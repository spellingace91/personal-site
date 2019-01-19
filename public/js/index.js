function setCurrPage() {
  const currPage = window.location.href;
  const currPageLink = document.querySelector(`[href="${currPage}"]`);
  currPageLink.classList.add('current');
}

function init() {
  setCurrPage();
}

init();
