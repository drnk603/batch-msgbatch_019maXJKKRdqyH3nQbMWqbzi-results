(function() {
  'use strict';

  if (typeof window.__app === 'undefined') {
    window.__app = {};
  }

  var app = window.__app;

  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  function throttle(func, limit) {
    var inThrottle;
    return function() {
      var args = arguments, context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function() { inThrottle = false; }, limit);
      }
    };
  }

  function initBurgerMenu() {
    if (app.burgerInitialized) return;
    app.burgerInitialized = true;

    var nav = document.querySelector('.c-nav#main-nav');
    var toggle = document.querySelector('.c-nav__toggle');
    var body = document.body;

    if (!nav || !toggle) return;

    var focusableElements;
    var firstFocusable;
    var lastFocusable;

    function updateFocusableElements() {
      focusableElements = nav.querySelectorAll('a[href], button:not([disabled])');
      firstFocusable = focusableElements[0];
      lastFocusable = focusableElements[focusableElements.length - 1];
    }

    function openMenu() {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      body.classList.add('u-no-scroll');
      updateFocusableElements();
      if (firstFocusable) firstFocusable.focus();
    }

    function closeMenu() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('u-no-scroll');
    }

    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      if (nav.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeMenu();
        toggle.focus();
      }

      if (nav.classList.contains('is-open') && e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    });

    document.addEventListener('click', function(e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && e.target !== toggle) {
        closeMenu();
      }
    });

    var navLinks = document.querySelectorAll('.c-nav__item');
    for (var i = 0; i < navLinks.length; i++) {
      navLinks[i].addEventListener('click', function() {
        if (nav.classList.contains('is-open')) {
          closeMenu();
        }
      });
    }

    var resizeHandler = debounce(function() {
      if (window.innerWidth >= 1024 && nav.classList.contains('is-open')) {
        closeMenu();
      }
    }, 150);

    window.addEventListener('resize', resizeHandler, { passive: true });
  }

  function initSmoothScroll() {
    if (app.smoothScrollInitialized) return;
    app.smoothScrollInitialized = true;

    var isHomepage = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html');

    var links = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var href = link.getAttribute('href');

      if (href === '#' || href === '#!') continue;

      if (!isHomepage && href.indexOf('#') === 0) {
        link.setAttribute('href', '/' + href);
      }

      link.addEventListener('click', function(e) {
        var targetHref = this.getAttribute('href');
        var hash = targetHref.indexOf('#') !== -1 ? targetHref.substring(targetHref.indexOf('#')) : '';

        if (!hash || hash === '#' || hash === '#!') return;

        if (targetHref.indexOf('/') === 0 && targetHref.indexOf('#') > 0) {
          return;
        }

        var targetId = hash.substring(1);
        var targetElement = document.getElementById(targetId);

        if (targetElement) {
          e.preventDefault();

          var header = document.querySelector('.l-header');
          var headerHeight = header ? header.offsetHeight : 80;

          var elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
          var offsetPosition = elementPosition - headerHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          if (window.history && window.history.pushState) {
            window.history.pushState(null, null, hash);
          }
        }
      });
    }
  }

  function initScrollSpy() {
    if (app.scrollSpyInitialized) return;
    app.scrollSpyInitialized = true;

    var sections = document.querySelectorAll('[id]');
    var navLinks = document.querySelectorAll('.c-nav__item[href^="#"]');

    if (sections.length === 0 || navLinks.length === 0) return;

    var scrollHandler = throttle(function() {
      var scrollPos = window.pageYOffset + 100;

      for (var i = sections.length - 1; i >= 0; i--) {
        var section = sections[i];
        var sectionTop = section.offsetTop;
        var sectionHeight = section.offsetHeight;
        var sectionId = section.getAttribute('id');

        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
          for (var j = 0; j < navLinks.length; j++) {
            var link = navLinks[j];
            var href = link.getAttribute('href');
            
            if (href === '#' + sectionId) {
              navLinks[j].classList.add('active');
              navLinks[j].setAttribute('aria-current', 'page');
            } else {
              navLinks[j].classList.remove('active');
              navLinks[j].removeAttribute('aria-current');
            }
          }
          break;
        }
      }
    }, 100);

    window.addEventListener('scroll', scrollHandler, { passive: true });
  }

  function initActiveMenuState() {
    if (app.activeMenuInitialized) return;
    app.activeMenuInitialized = true;

    var currentPath = window.location.pathname;
    var navLinks = document.querySelectorAll('.c-nav__item');

    for (var i = 0; i < navLinks.length; i++) {
      var link = navLinks[i];
      var linkPath = link.getAttribute('href');

      if (!linkPath || linkPath.indexOf('#') === 0) continue;

      link.removeAttribute('aria-current');
      link.classList.remove('active');

      if (linkPath === currentPath ||
          (currentPath === '/' && linkPath === '/index.html') ||
          (currentPath === '/index.html' && linkPath === '/')) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active');
      } else if (linkPath && linkPath !== '#' && currentPath.indexOf(linkPath) === 0 && linkPath.length > 1) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active');
      }
    }
  }

  function initImages() {
    if (app.imagesInitialized) return;
    app.imagesInitialized = true;

    var images = document.querySelectorAll('img');

    for (var i = 0; i < images.length; i++) {
      var img = images[i];

      if (!img.hasAttribute('loading') &&
          !img.classList.contains('c-logo__img') &&
          !img.hasAttribute('data-critical')) {
        img.setAttribute('loading', 'lazy');
      }

      img.addEventListener('error', function() {
        var fallbackSVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23e9ecef" width="400" height="300"/%3E%3Ctext fill="%236c757d" font-family="sans-serif" font-size="16" dy="10" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EAfbeelding niet beschikbaar%3C/text%3E%3C/svg%3E';
        this.src = fallbackSVG;
      });
    }
  }

  function initFormValidation() {
    if (app.formsInitialized) return;
    app.formsInitialized = true;

    var forms = [
      document.getElementById('newsletter-form'),
      document.getElementById('contactForm'),
      document.getElementById('brochure-form')
    ];

    app.notify = function(message, type) {
      var container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
      }

      var toast = document.createElement('div');
      toast.className = 'alert alert-' + (type || 'info') + ' alert-dismissible fade show';
      toast.setAttribute('role', 'alert');
      toast.innerHTML = message + '<button type="button" class="btn-close" aria-label="Sluiten"></button>';
      container.appendChild(toast);

      toast.querySelector('.btn-close').addEventListener('click', function() {
        toast.classList.remove('show');
        setTimeout(function() {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 150);
      });

      setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 150);
      }, 5000);
    };

    function validateEmail(email) {
      var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    }

    function validatePhone(phone) {
      var re = /^[\+\d\s\(\)\-]{10,20}$/;
      return re.test(phone);
    }

    function validateName(name) {
      var re = /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/;
      return re.test(name);
    }

    function validateMessage(message) {
      return message && message.length >= 10;
    }

    function showError(input, message) {
      input.classList.add('is-invalid');
      var errorDiv = input.nextElementSibling;
      if (!errorDiv || !errorDiv.classList.contains('invalid-feedback')) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback c-form__error';
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
      }
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }

    function clearError(input) {
      input.classList.remove('is-invalid');
      var errorDiv = input.nextElementSibling;
      if (errorDiv && (errorDiv.classList.contains('invalid-feedback') || errorDiv.classList.contains('c-form__error'))) {
        errorDiv.style.display = 'none';
      }
    }

    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];
      if (!form) continue;

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();

        var formId = this.getAttribute('id');
        var isValid = true;

        if (formId === 'newsletter-form') {
          var emailInput = this.querySelector('#newsletter-email');
          var privacyInput = this.querySelector('#newsletter-privacy');

          clearError(emailInput);

          if (!emailInput.value.trim()) {
            showError(emailInput, 'E-mailadres is verplicht');
            isValid = false;
          } else if (!validateEmail(emailInput.value)) {
            showError(emailInput, 'Voer een geldig e-mailadres in');
            isValid = false;
          }

          if (!privacyInput.checked) {
            showError(privacyInput, 'U moet akkoord gaan met het privacybeleid');
            isValid = false;
          } else {
            clearError(privacyInput);
          }
        }

        if (formId === 'contactForm') {
          var firstNameInput = this.querySelector('#firstName');
          var lastNameInput = this.querySelector('#lastName');
          var emailInput = this.querySelector('#email');
          var phoneInput = this.querySelector('#phone');
          var messageInput = this.querySelector('#message');
          var privacyInput = this.querySelector('#privacy');

          clearError(firstNameInput);
          clearError(lastNameInput);
          clearError(emailInput);
          clearError(phoneInput);
          clearError(messageInput);
          clearError(privacyInput);

          if (!firstNameInput.value.trim()) {
            showError(firstNameInput, 'Voornaam is verplicht');
            isValid = false;
          } else if (!validateName(firstNameInput.value)) {
            showError(firstNameInput, 'Voer een geldige voornaam in');
            isValid = false;
          }

          if (!lastNameInput.value.trim()) {
            showError(lastNameInput, 'Achternaam is verplicht');
            isValid = false;
          } else if (!validateName(lastNameInput.value)) {
            showError(lastNameInput, 'Voer een geldige achternaam in');
            isValid = false;
          }

          if (!emailInput.value.trim()) {
            showError(emailInput, 'E-mailadres is verplicht');
            isValid = false;
          } else if (!validateEmail(emailInput.value)) {
            showError(emailInput, 'Voer een geldig e-mailadres in');
            isValid = false;
          }

          if (!phoneInput.value.trim()) {
            showError(phoneInput, 'Telefoonnummer is verplicht');
            isValid = false;
          } else if (!validatePhone(phoneInput.value)) {
            showError(phoneInput, 'Voer een geldig telefoonnummer in');
            isValid = false;
          }

          if (!messageInput.value.trim()) {
            showError(messageInput, 'Bericht is verplicht');
            isValid = false;
          } else if (!validateMessage(messageInput.value)) {
            showError(messageInput, 'Bericht moet minimaal 10 tekens bevatten');
            isValid = false;
          }

          if (!privacyInput.checked) {
            showError(privacyInput, 'U moet akkoord gaan met het privacybeleid');
            isValid = false;
          }
        }

        if (formId === 'brochure-form') {
          var nameInput = this.querySelector('#brochure-name');
          var emailInput = this.querySelector('#brochure-email');
          var consentInput = this.querySelector('#brochure-consent');

          clearError(nameInput);
          clearError(emailInput);
          clearError(consentInput);

          if (!nameInput.value.trim()) {
            showError(nameInput, 'Naam is verplicht');
            isValid = false;
          } else if (!validateName(nameInput.value)) {
            showError(nameInput, 'Voer een geldige naam in');
            isValid = false;
          }

          if (!emailInput.value.trim()) {
            showError(emailInput, 'E-mailadres is verplicht');
            isValid = false;
          } else if (!validateEmail(emailInput.value)) {
            showError(emailInput, 'Voer een geldig e-mailadres in');
            isValid = false;
          }

          if (!consentInput.checked) {
            showError(consentInput, 'U moet akkoord gaan met de voorwaarden');
            isValid = false;
          }
        }

        if (!isValid) {
          return false;
        }

        var submitBtn = this.querySelector('button[type="submit"]');
        var originalText = submitBtn ? submitBtn.innerHTML : '';

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Verzenden...';
        }

        var self = this;

        setTimeout(function() {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
          }
          app.notify('Uw bericht is succesvol verzonden!', 'success');
          self.reset();
          
          setTimeout(function() {
            window.location.href = '/thank_you.html';
          }, 1000);
        }, 1500);

        return false;
      });
    }
  }

  function initPortfolioFilter() {
    if (app.filterInitialized) return;
    app.filterInitialized = true;

    var filterButtons = document.querySelectorAll('.c-filter__btn');
    var portfolioItems = document.querySelectorAll('[data-category]');

    if (filterButtons.length === 0 || portfolioItems.length === 0) return;

    for (var i = 0; i < filterButtons.length; i++) {
      filterButtons[i].addEventListener('click', function() {
        var category = this.getAttribute('data-category');

        for (var j = 0; j < filterButtons.length; j++) {
          filterButtons[j].classList.remove('is-active');
        }
        this.classList.add('is-active');

        for (var k = 0; k < portfolioItems.length; k++) {
          var item = portfolioItems[k];
          var itemCategory = item.getAttribute('data-category');

          if (category === 'all' || itemCategory === category) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        }
      });
    }
  }

  function initModals() {
    if (app.modalsInitialized) return;
    app.modalsInitialized = true;

    var modalTriggers = document.querySelectorAll('[data-bs-toggle="modal"]');
    var modals = document.querySelectorAll('.modal');
    var body = document.body;

    function openModal(modalId) {
      var modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
        body.classList.add('u-no-scroll');
      }
    }

    function closeModal(modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      body.classList.remove('u-no-scroll');
    }

    for (var i = 0; i < modalTriggers.length; i++) {
      modalTriggers[i].addEventListener('click', function(e) {
        e.preventDefault();
        var targetId = this.getAttribute('href');
        if (targetId && targetId.indexOf('#') === 0) {
          targetId = targetId.substring(1);
        } else {
          targetId = this.getAttribute('data-bs-target');
          if (targetId && targetId.indexOf('#') === 0) {
            targetId = targetId.substring(1);
          }
        }
        if (targetId) {
          openModal(targetId);
        }
      });
    }

    for (var j = 0; j < modals.length; j++) {
      var modal = modals[j];

      var closeButtons = modal.querySelectorAll('[data-bs-dismiss="modal"], .btn-close');
      for (var k = 0; k < closeButtons.length; k++) {
        closeButtons[k].addEventListener('click', function() {
          var modalElement = this.closest('.modal');
          if (modalElement) {
            closeModal(modalElement);
          }
        });
      }

      modal.addEventListener('click', function(e) {
        if (e.target === this) {
          closeModal(this);
        }
      });
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        var openModal = document.querySelector('.modal.show');
        if (openModal) {
          closeModal(openModal);
        }
      }
    });
  }

  function initScrollToTop() {
    if (app.scrollToTopInitialized) return;
    app.scrollToTopInitialized = true;

    var scrollToTopBtn = document.querySelector('.c-scroll-to-top, .scroll-to-top');
    
    if (!scrollToTopBtn) {
      scrollToTopBtn = document.createElement('button');
      scrollToTopBtn.className = 'c-scroll-to-top';
      scrollToTopBtn.setAttribute('aria-label', 'Scroll naar boven');
      scrollToTopBtn.innerHTML = '↑';
      document.body.appendChild(scrollToTopBtn);
    }

    var scrollHandler = throttle(function() {
      if (window.pageYOffset > 300) {
        scrollToTopBtn.classList.add('is-visible');
      } else {
        scrollToTopBtn.classList.remove('is-visible');
      }
    }, 100);

    window.addEventListener('scroll', scrollHandler, { passive: true });

    scrollToTopBtn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  app.init = function() {
    initBurgerMenu();
    initSmoothScroll();
    initScrollSpy();
    initActiveMenuState();
    initImages();
    initFormValidation();
    initPortfolioFilter();
    initModals();
    initScrollToTop();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init);
  } else {
    app.init();
  }

})();
