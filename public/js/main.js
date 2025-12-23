document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/public/data');
        const data = await response.json();

        if (response.ok) {
            window.siteData = data;
            renderPackages(data.packages);
            renderTransports(data.transports);
            renderReviews(data.reviews);
            renderOwnerProfile(data.ownerProfile);
        } else {
            console.error('Failed to fetch public data:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Network error fetching public data:', error);
    }

    setupEnquiryForms();
    setupGlobalValidation();

    const navbar = document.querySelector('.navbar-premium');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('bookPackageId');
    if (bookId && window.siteData && window.siteData.packages) {
        const pkg = window.siteData.packages.find(p => p._id === bookId);
        if (pkg) {
            setTimeout(() => {
                openPackageModal(pkg._id, pkg.title, pkg.packageType, pkg.destination || pkg.title);
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 500);
        }
    }

    const coupleCard = document.querySelector('a[href="couple.html"]');
    if (coupleCard) {
        coupleCard.addEventListener('click', function (e) {
            e.preventDefault();
            this.classList.add('animating');
            setTimeout(() => {
                window.location.href = this.href;
            }, 600);
        });
    }

    window.addEventListener('pageshow', (event) => {
        if (event.persisted || window.performance && window.performance.navigation.type === 2) {
            document.querySelectorAll('.package-card').forEach(card => {
                card.classList.remove('animating');
            });
        }
    });
});

function setupGlobalValidation() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('.date-picker').forEach(input => {
        input.setAttribute('min', today);
    });

    document.querySelectorAll('.phone-input').forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            if (e.target.value.length > 10) {
                e.target.value = e.target.value.slice(0, 10);
            }
        });
    });
}

function renderPackages(packages) {
    const coupleContainer = document.getElementById('couple-packages-container');
    const commonContainer = document.getElementById('common-packages-container');

    if (coupleContainer) {
        coupleContainer.innerHTML = '';
        const couplePackages = packages.filter(p => p.packageType === 'COUPLE');

        if (couplePackages.length === 0) {
            coupleContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="p-4 rounded-4 bg-light shadow-sm d-inline-block">
                        <i class="fas fa-heart text-danger fa-3x mb-3 opacity-75"></i>
                        <h5 class="fw-bold text-dark">Curating Romantic Getaways...</h5>
                        <p class="text-muted mb-3">We are currently crafting new exclusive experiences for couples.<br>Stay tuned for our upcoming packages!</p>
                        <a href="index#contact" class="btn btn-primary rounded-pill btn-sm px-4">Contact for Custom Plan</a>
                    </div>
                </div>`;
        } else {
            couplePackages.forEach(pkg => coupleContainer.innerHTML += createPackageCard(pkg));
        }
    }

    if (commonContainer) {
        commonContainer.innerHTML = '';
        const commonPackages = packages.filter(p => p.packageType === 'COMMON');

        if (commonPackages.length === 0) {
            commonContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="p-4 rounded-4 bg-light shadow-sm d-inline-block">
                        <i class="fas fa-users text-primary fa-3x mb-3 opacity-75"></i>
                        <h5 class="fw-bold text-dark">Planning New Adventures...</h5>
                        <p class="text-muted mb-3">We are working on exciting new group itineraries.<br>Check back soon for updates!</p>
                        <a href="index#contact" class="btn btn-primary rounded-pill btn-sm px-4">Enquire Now</a>
                    </div>
                </div>`;
        } else {
            commonPackages.forEach(pkg => commonContainer.innerHTML += createPackageCard(pkg));
        }
    }

    const popDestContainer = document.getElementById('popular-destinations-container');
    if (popDestContainer) {
        popDestContainer.innerHTML = '';
        const popularPackages = packages.filter(p => p.packageType === 'COMMON').slice(0, 4);

        if (popularPackages.length === 0) {
            popDestContainer.innerHTML = '<p class="text-center text-muted">No popular destinations to show right now.</p>';
        } else {
            popularPackages.forEach(pkg => {
                const image = (pkg.images && pkg.images.length > 0) ? pkg.images[0] : 'https://placehold.co/400x500/e67e22/ffffff?text=Dest';
                popDestContainer.innerHTML += `
                    <div class="col-6 col-md-3">
                        <div class="destination-card" onclick="openPackageModal('${pkg._id}', '${pkg.title}', 'COUPLE', '${pkg.destination || pkg.title}')">
                            <img src="${image}" alt="${pkg.title}">
                            <div class="destination-card-overlay">
                                <h5>${pkg.destination || pkg.title}</h5>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
    }
}

function createPackageCard(pkg) {
    const image = (pkg.images && pkg.images.length > 0) ? pkg.images[0] : 'https://placehold.co/400x300/e67e22/ffffff?text=Package';

    let badgeHtml = '';
    let priceValue = `<span class="price-tag">₹${pkg.startingPrice || 'On Request'}</span>`;

    const offerText = pkg.offerText || (pkg.offer && pkg.offer.text) || '';
    const offerPercent = pkg.offerPercent || (pkg.offer && pkg.offer.percentage) || 0;

    if (offerText || offerPercent > 0) {
        if (offerText) {
            badgeHtml = `<div class="listing-card-badge"><i class="fas fa-certificate me-1"></i>${offerText}</div>`;
        } else if (offerPercent > 0) {
            badgeHtml = `<div class="listing-card-badge"><i class="fas fa-certificate me-1"></i>${offerPercent}% OFF</div>`;
        }

        if (pkg.startingPrice && offerPercent > 0) {
            const discountedPrice = Math.round(pkg.startingPrice * (1 - offerPercent / 100));
            priceValue = `
                <div class="d-flex flex-column text-end">
                    <span class="text-muted text-decoration-line-through small" style="font-size: 0.8rem;">₹${pkg.startingPrice}</span>
                    <span class="price-tag text-danger">₹${discountedPrice}</span>
                </div>
            `;
        }
    }

    const durationHtml = pkg.duration ? `<div class="listing-card-label"><i class="fas fa-clock me-1"></i>${pkg.duration}</div>` : '';

    return `
        <div class="col-md-4 col-sm-6">
            <div class="listing-card">
                <div class="listing-card-img-wrapper">
                    ${badgeHtml}
                    <img src="${image}" class="listing-card-img" alt="${pkg.title}">
                    ${durationHtml}
                </div>
                <div class="listing-card-body">
                    <h5 class="listing-card-title">${pkg.title}</h5>
                    <p class="listing-card-location">
                        <i class="fas fa-map-marker-alt text-primary me-2"></i>${pkg.destination || 'Custom Location'}
                    </p>
                    
                    <div class="listing-card-price">
                        <div>
                            <span class="price-sub">Starting from</span>
                        </div>
                        ${priceValue}
                    </div>

                    <div class="listing-card-actions">
                        <button class="btn btn-outline-secondary rounded-pill btn-sm fw-bold" onclick="window.location.href='details?id=${pkg._id}'">
                            Details
                        </button>
                        <button class="btn btn-primary rounded-pill btn-sm fw-bold shadow-sm" onclick="openPackageModal('${pkg._id}', '${pkg.title}', '${pkg.packageType}', '${pkg.destination || pkg.title}')">
                            Book Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderTransports(transports) {
    const container = document.getElementById('transport-container');
    const listContainer = document.getElementById('transports-list');

    if (!container) return;

    container.innerHTML = '';

    if (transports.length === 0) listContainer.style.display = 'none';

    transports.forEach(t => {
        const image = t.image || 'https://placehold.co/400x300/34495e/ffffff?text=Car';
        const cardHtml = `
            <div class="col-md-3 col-6">
                <div class="listing-card">
                    <div class="listing-card-img-wrapper" style="height: 180px;">
                        <img src="${image}" class="listing-card-img" alt="${t.name}">
                        <div class="listing-card-label"><i class="fas fa-users me-1"></i>${t.capacity} Seater</div>
                    </div>
                    <div class="listing-card-body p-3 text-center">
                        <h6 class="fw-bold mb-2 text-dark">${t.name}</h6>
                        <div class="mb-3">
                            <span class="price-tag" style="font-size: 1.1rem;">₹${t.pricePerKm || 0}</span>
                            <span class="text-muted small">/ km</span>
                        </div>
                        <button class="btn btn-primary rounded-pill btn-sm w-100 shadow-sm fw-bold" onclick="openTransportModal('${t._id}', '${t.name}')">
                            Book This Car
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += cardHtml;
    });
}

function renderReviews(reviews) {
    const container = document.getElementById('reviews-container');
    if (!container) return;
    container.innerHTML = '';

    if (reviews.length === 0) {
        container.innerHTML = '<div class="swiper-slide"><div class="review-card"><p class="text-center text-muted">No reviews yet.</p></div></div>';
        return;
    }

    reviews.forEach(review => {
        const stars = '<i class="fas fa-star"></i>'.repeat(Math.round(review.rating));
        const name = review.customerName || 'Happy Customer';
        const photo = review.customerPhoto ? review.customerPhoto : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;

        const slide = document.createElement("div");
        slide.className = "swiper-slide";
        slide.innerHTML = `
          <div class="review-card">
            <i class="fas fa-quote-left quote-icon"></i>

            <p class="review-content">
              ${review.comment || 'No comment provided.'}
            </p>

            <div class="review-footer">
              <img src="${photo}" class="reviewer-img" alt="${name}" />
              <div class="reviewer-info">
                <h5>${name}</h5>
                <div class="stars">
                  ${stars}
                </div>
              </div>
            </div>
          </div>
        `;
        container.appendChild(slide);
    });

    new Swiper(".reviewSwiper", {
        loop: true,
        grabCursor: true,
        centeredSlides: false,
        autoplay: {
            delay: 4000,
            disableOnInteraction: false,
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        breakpoints: {
            0: {
                slidesPerView: 1,
                spaceBetween: 16,
            },
            768: {
                slidesPerView: 2,
                spaceBetween: 20,
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 24,
            },
        },
    });
}

function renderOwnerProfile(profile) {
    if (!profile) return;
    const nameEl = document.getElementById('owner-name');
    if (!nameEl) return;

    nameEl.innerText = profile.displayName || profile.name || 'Travel Expert';
    document.getElementById('owner-desc').innerText = profile.description || '';

    if (profile.ownerImage || profile.photo) {
        document.getElementById('owner-photo').src = profile.ownerImage || profile.photo;
    }

    const instaBtn = document.getElementById('owner-insta');
    const instaHandle = profile.instagramHandle || profile.instagram;

    if (instaHandle) {
        instaBtn.href = instaHandle.startsWith('http') ? instaHandle : `https://instagram.com/${instaHandle.replace('@', '')}`;
    } else {
        instaBtn.style.display = 'none';
    }

    const phoneBtn = document.getElementById('owner-phone');
    const phoneVal = profile.contactPhone || profile.phone;

    if (phoneVal) {
        phoneBtn.href = `tel:${phoneVal}`;
    } else {
        phoneBtn.style.display = 'none';
    }
}

window.openPackageDetailsModal = (id) => {
    const pkg = window.siteData.packages.find(p => p._id === id);
    if (!pkg) return;

    document.getElementById('detail-modal-title').innerText = pkg.title;
    document.getElementById('detail-modal-price').innerText = pkg.startingPrice ? `₹${pkg.startingPrice}` : 'Best Price';

    const durEl = document.getElementById('detail-modal-duration');
    if (pkg.duration) {
        durEl.innerHTML = `<i class="fas fa-clock me-1"></i>${pkg.duration}`;
        durEl.style.display = 'inline';
    } else {
        durEl.style.display = 'none';
    }

    document.getElementById('detail-modal-itinerary').innerText = pkg.itinerary || 'Contact us for detailed itinerary.';
    document.getElementById('detail-modal-inclusions').innerText = pkg.inclusions || 'Standard inclusions apply.';
    document.getElementById('detail-modal-exclusions').innerText = pkg.exclusions || 'Standard exclusions apply.';

    const bookBtn = document.getElementById('detail-modal-book-btn');
    bookBtn.onclick = () => {
        bootstrap.Modal.getInstance(document.getElementById('packageDetailsModal')).hide();
        openPackageModal(pkg._id, pkg.title, pkg.packageType, pkg.destination || pkg.title);
    };

    new bootstrap.Modal(document.getElementById('packageDetailsModal')).show();
};

window.openPackageModal = (id, title, type, destination = '') => {
    document.getElementById('modal-package-id').value = id;
    document.getElementById('modal-package-title').innerText = title;
    document.getElementById('modal-package-type').value = type;

    document.querySelector('input[name="destination"]').value = destination;

    if (type === 'COUPLE') {
        document.querySelector('input[name="enquiryType"]').value = 'COUPLE_PACKAGE';

        const destGroup = document.getElementById('pkg-destination-group');
        destGroup.style.display = 'block';
        const destInput = destGroup.querySelector('input');
        destInput.setAttribute('required', 'true');
        if (destination) destInput.value = destination;

        const peopleGroup = document.getElementById('pkg-people-group');
        const peopleInput = document.getElementById('pkg-people-input');

        if (peopleGroup) peopleGroup.style.display = 'none';
        if (peopleInput) {
            peopleInput.removeAttribute('required');
            peopleInput.value = 2;
        }

    } else {
        document.querySelector('input[name="enquiryType"]').value = 'COMMON_PACKAGE';
        document.getElementById('modal-package-type').value = 'COMMON';

        const peopleGroup = document.getElementById('pkg-people-group');
        const peopleInput = document.getElementById('pkg-people-input');

        if (peopleGroup) peopleGroup.style.display = 'block';
        if (peopleInput) {
            peopleInput.setAttribute('required', 'true');
            peopleInput.value = '';
        }

        const destGroup = document.getElementById('pkg-destination-group');
        const destInput = destGroup.querySelector('input');

        if (destination) {
            destGroup.style.display = 'block';
            destInput.value = destination;
            destInput.setAttribute('readonly', 'true');
        } else {
            destGroup.style.display = 'none';
            destInput.removeAttribute('required');
            destInput.value = '';
            destInput.removeAttribute('readonly');
        }
    }

    new bootstrap.Modal(document.getElementById('packageEnquiryModal')).show();
};

window.openTransportModal = (id, name) => {
    document.getElementById('modal-transport-id').value = id;
    document.getElementById('modal-transport-name').innerText = `Booking Transport: ${name}`;
    new bootstrap.Modal(document.getElementById('transportEnquiryModal')).show();
};

function setupEnquiryForms() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            const allowedLocations = ['dindugul', 'dindigul', 'madurai'];

            if (data.pickupLocation) {
                const pickup = data.pickupLocation.toLowerCase().trim();
                const validPickup = allowedLocations.some(loc => pickup.includes(loc));
                if (!validPickup) {
                    alert('Pickup is available only from Dindigul and Madurai.');
                    return;
                }
            }

            if (data.dropLocation) {
                const drop = data.dropLocation.toLowerCase().trim();
                const validDrop = allowedLocations.some(loc => drop.includes(loc));
                if (!validDrop) {
                    alert('Drop is available only to Dindigul and Madurai regions.');
                    return;
                }
            }

            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            btn.innerText = 'Sending...';
            btn.disabled = true;

            try {
                const res = await fetch('/api/public/enquiry', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    document.querySelectorAll('.modal.show').forEach(m => {
                        const modalInstance = bootstrap.Modal.getInstance(m);
                        if (modalInstance) modalInstance.hide();
                    });

                    form.reset();

                    setTimeout(() => {
                        const successModalEl = document.getElementById('successModal');
                        if (successModalEl) {
                            const successModal = bootstrap.Modal.getOrCreateInstance(successModalEl);
                            successModal.show();
                        } else {
                            alert('Enquiry submitted successfully!');
                        }
                    }, 300);

                } else {
                    alert('Something went wrong. Please try again.');
                }
            } catch (error) {
                alert('Connection error. Please check your network.');
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    });
}

window.selectCategory = (targetId, card) => {
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');

    const tabBtnId = targetId + '-tab';
    const tabBtn = document.getElementById(tabBtnId);
    if (tabBtn) {
        const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        tabBtn.dispatchEvent(clickEvent);
    }
};
