document.addEventListener('DOMContentLoaded', function () {
    const navbarLinks = document.querySelectorAll('.navbar-nav .nav-link[href^="#"]');

    function smoothScroll(targetId, offset = 0) {
        const targetElement = document.querySelector(targetId);
        if (!targetElement) return;

        const navbarHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = targetPosition - navbarHeight - offset;
        const startPosition = window.pageYOffset;
        const distance = offsetPosition - startPosition;
        const duration = 600;
        let start = null;

        function step(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;

            const ease = (t) => 1 - Math.pow(1 - t, 4);

            const position = startPosition + (distance * ease(Math.min(progress / duration, 1)));

            window.scrollTo(0, position);

            if (progress < duration) {
                window.requestAnimationFrame(step);
            } else {
                window.scrollTo(0, offsetPosition);
                if (history.pushState) {
                    history.pushState(null, null, targetId);
                }
            }
        }

        window.requestAnimationFrame(step);
    }

    navbarLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href === '#') return;

            const navbarCollapse = document.getElementById('navbarNav');
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                new bootstrap.Collapse(navbarCollapse).hide();
            }

            navbarLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');

            smoothScroll(href, 10);
        });
    });

    const sections = document.querySelectorAll('section[id], header[id]');

    const activeLinkObserverOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
    };

    const activeLinkObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');

                navbarLinks.forEach(link => link.classList.remove('active'));

                const active = document.querySelector(`.navbar-nav .nav-link[href="#${id}"]`);
                if (active) {
                    active.classList.add('active');
                    if (typeof resetPillToActive === 'function') resetPillToActive();
                }
            }
        });
    }, activeLinkObserverOptions);

    sections.forEach(section => {
        activeLinkObserver.observe(section);
    });

    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const navbarNav = document.querySelector('.navbar-nav');
    let pillTracker = document.querySelector('.nav-pill-tracker');

    if (navbarNav && !pillTracker) {
        pillTracker = document.createElement('div');
        pillTracker.classList.add('nav-pill-tracker');
        navbarNav.appendChild(pillTracker);
    }

    function movePillTo(element) {
        if (!element || !pillTracker) return;

        if (window.innerWidth < 992) {
            pillTracker.style.opacity = '0';
            return;
        }

        const width = element.offsetWidth;
        const left = element.offsetLeft;

        pillTracker.style.width = `${width}px`;
        pillTracker.style.left = `${left}px`;

        pillTracker.style.opacity = '1';
    }

    function resetPillToActive() {
        const activeLink = document.querySelector('.navbar-nav .nav-link.active');
        if (activeLink) {
            movePillTo(activeLink);
        } else {
            if (pillTracker) pillTracker.style.opacity = '0';
        }
    }

    navbarLinks.forEach(link => {
        link.addEventListener('mouseenter', (e) => {
            movePillTo(e.target);
        });
    });

    if (navbarNav) {
        navbarNav.addEventListener('mouseleave', () => {
            resetPillToActive();
        });
    }

    window.addEventListener('resize', resetPillToActive);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});
