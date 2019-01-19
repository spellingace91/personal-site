// package
const pkg = require('./package.json');

// gulp
const gulp = require('gulp');

// load all plugins in "devDependencies" in the variable $
const $ = require('gulp-load-plugins')({
  pattern: ['*'],
  scope: ['devDependencies']
});

// error handling
const onError = (err) => {
  console.log(err);
};

// scss task - build the scss to the build folder, including the required paths, and write out a sourcemap
gulp.task('scss', () => {
  $.fancyLog('-> Compiling scss');
  return gulp.src(pkg.paths.src.scss + pkg.vars.scssName)
    .pipe($.plumber({errorHandler: onError}))
    .pipe($.sourcemaps.init({loadMaps: true}))
    .pipe($.sassLint())
    .pipe($.sassLint.format())
    .pipe($.sass({
            includePaths: pkg.paths.scss
      })
      .on('error', $.sass.logError))
    .pipe($.cached('sass-compile'))
    .pipe($.autoprefixer())
    .pipe($.groupCssMediaQueries())
    .pipe($.sourcemaps.write('./'))
    .pipe($.size({gzip: true, showFiles: true}))
    .pipe(gulp.dest(pkg.paths.build.css));
});

// css task - combine & minimize any distribution CSS into the public css folder, and add our banner to it
gulp.task('css', ['scss'], () => {
  $.fancyLog('-> Building css');
  return gulp.src(pkg.globs.distCss)
    .pipe($.plumber({errorHandler: onError}))
    .pipe($.newer({dest: pkg.paths.dist.css + pkg.vars.siteCssName}))
    .pipe($.print.default())
    .pipe($.sourcemaps.init({loadMaps: true}))
    .pipe($.concat(pkg.vars.siteCssName))
    .pipe($.cssnano({
      discardComments: {
        removeAll: true
      },
      discardDuplicates: true,
      discardEmpty: true,
      minifyFontValues: true,
      minifySelectors: true
    }))
    // .pipe($.header(banner, {pkg: pkg}))
    .pipe($.sourcemaps.write('./'))
    .pipe($.size({gzip: true, showFiles: true}))
    .pipe(gulp.dest(pkg.paths.dist.css))
    .pipe($.filter('**/*.css'))
    // .pipe($.bs.stream())
    .pipe($.connect.reload({stream: true}))
});

// babel js task - transpile our JavaScript into the build directory
gulp.task('js-babel', () => {
  $.fancyLog('-> Transpiling JavaScript via Babel...');
  return gulp.src(pkg.globs.babelJs)
    .pipe($.plumber({errorHandler: onError}))
    .pipe($.newer({dest: pkg.paths.build.js}))
    .pipe($.babel())
    .pipe($.size({gzip: true, showFiles: true}))
    .pipe(gulp.dest(pkg.paths.build.js))
})

// js task - minimize any distribution JavaScript into the public js folder, and add our banner to it
gulp.task('js', ['js-babel'], () => {
  $.fancyLog('-> Building js');
  return gulp.src(pkg.globs.distJs)
    .pipe($.plumber({errorHandler: onError}))
    .pipe($.if(['*.js', '!*.min.js'],
      $.newer({dest: pkg.paths.dist.js, ext: '.min.js'}),
      $.newer({dest: pkg.paths.dist.js})
    ))
    .pipe($.if(['*.js', '!*.min.js'],
      $.uglify()
    ))
    .pipe($.if(['*.js', '!*.min.js'],
      $.rename({suffix: '.min'})
    ))
    // .pipe($.header(banner, {pkg: pkg}))
    .pipe($.size({gzip: true, showFiles: true}))
    .pipe(gulp.dest(pkg.paths.dist.js))
    .pipe($.filter('**/*.js'))
    .pipe($.connect.reload({stream: true}))
    // .pipe($.bs.stream())
});

// favicons-generate task
gulp.task('favicons-generate', () => {
  $.fancyLog('-> Generating favicons');
  return gulp.src(pkg.paths.favicon.src).pipe($.favicons({
    appName: pkg.name,
    appDescription: pkg.description,
    developerName: pkg.author,
    developerUrl: pkg.urls.live,
    background: '#ffffff',
    path: pkg.paths.favicon.path,
    url: pkg.site_url,
    display: 'standalone',
    orientation: 'portrait',
    version: pkg.version,
    logging: false,
    online: false,
    html: pkg.paths.build.html + 'favicons.html',
    replace: true,
    icons: {
      android: false,
      appleIcon: true,
      appleStartup: false,
      coast: true,
      favicons: true,
      firefox: true,
      opengraph: false,
      twitter: false,
      windows: true,
      yandex: true
    }
  })).pipe(gulp.dest(pkg.paths.favicon.dest));
});

// copy favicons task
gulp.task('favicons', ['favicons-generate'], () => {
  $.fancyLog('-> Copying favicon.ico');
  return gulp.src(pkg.globs.siteIcon)
    .pipe($.size({gzip: true, showFiles: true}))
    .pipe(gulp.dest(pkg.paths.dist.base));
});

// imagemin task
// gulp.task('imagemin', () => {
//   return gulp.src(pkg.paths.src.img + '**/*.{png,jpg,jpeg,gif,svg}')
//     .pipe($.imagemin({
//       progressive: true,
//       interlaced: true,
//       optimizationLevel: 7,
//       svgoPlugins: [{removeViewBox: false}],
//       verbose: true,
//       use: []
//     }))
//     .pipe(gulp.dest(pkg.paths.dist.img));
// });

// image compression task
gulp.task('compress', () => {
  $.fancyLog('-> Compressing images');
  return gulp.src(pkg.paths.src.img + '**/*')
    .pipe($.responsiveImages({
      '*.jpg': [{
        quality: 80
      }]
    }))
    .pipe(gulp.dest(pkg.paths.dist.img));
});

gulp.task('connect', () => {
  $.connect.server({
    root: 'public/',
    livereload: true
  })
});

// gulp.task('html', () => {
//   gulp.src(pkg.paths.src.base + '**/*.html')
//   .pipe($.connect.reload())
// });

gulp.task('nunjucks', () => {
  $.fancyLog('-> Compiling templates');
  return gulp.src(pkg.paths.templates + '**/*.njk')
    .pipe($.plumber({errorHandler: onError}))
    .pipe($.nunjucksRender({
      path: pkg.paths.templates
    }))
    .pipe(gulp.dest(pkg.paths.dist.base))
    .pipe($.connect.reload({stream: true}));
});

// generate-fontello task
gulp.task('generate-fontello', () => {
  return gulp.src(pkg.paths.src.fontello + 'config.json')
    .pipe($.fontello())
    .pipe($.print.default())
    .pipe(gulp.dest(pkg.paths.build.fontello));
});

// copy fonts task
gulp.task('fonts', ['generate-fontello'], () => {
  return gulp.src(pkg.globs.fonts)
    .pipe(gulp.dest(pkg.paths.dist.fonts));
});

// default task
gulp.task('default', ['css', 'js', 'nunjucks', 'connect'], () => {
  // console.log('Running gulp with these dependencies: ' + Object.keys($));
  gulp.watch([pkg.paths.src.scss + '**/*.scss'], ['css']);
  gulp.watch([pkg.paths.src.css + '**/*.css'], ['css'])
  gulp.watch([pkg.paths.src.js + '**/*.js'], ['js']);
  gulp.watch([pkg.paths.templates + '**/*.njk'], ['nunjucks']);
});

// production build
gulp.task('build', ['default', 'favicons', 'compress', 'fonts']);