(function () {
  var header = document.querySelector('.dr-header');
  if (!header) return;

  var burger = header.querySelector('.dr-header-burger');
  var nav = header.querySelector('.dr-nav');
  if (!burger || !nav) return;

  burger.addEventListener('click', function () {
    var isOpen = header.classList.toggle('dr-header-nav-open');
    burger.classList.toggle('dr-is-active', isOpen);
    burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
})();