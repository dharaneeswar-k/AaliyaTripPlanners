/**
 * Admin Panel Logic - Premium Redesign
 * Handles Dashboard Data, content management, and interactions.
 */

// Global State
let allPackages = [];
let allTransports = [];
let allReviews = [];
let allEnquiries = [];
let ownerProfile = {};
let charts = {}; // Store chart instances

// Auth Token Key
const TOKEN_KEY = 'adminToken';

/* ================== AUTOMATIC INITIALIZATION ================== */
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    fetchDashboardData();
    fetchEnquiries();
    fetchAdmins();

    // Setup Global Modals
    window.pkgModal = new bootstrap.Modal(document.getElementById('packageModal'));
    window.transModal = new bootstrap.Modal(document.getElementById('transportModal'));
    window.revModal = new bootstrap.Modal(document.getElementById('reviewModal'));
    window.confirmModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    window.enqModal = new bootstrap.Modal(document.getElementById('enquiryModal'));
    window.myProfModal = new bootstrap.Modal(document.getElementById('myProfileModal'));

    // Hash Navigation
    const currentTab = window.location.hash.substring(1) || 'dashboard';
    showTab(currentTab);
});

/* ================== NAVIGATION & UI ================== */
function toggleSidebar() {
    document.body.classList.toggle('sidebar-open');
    document.getElementById('sidebar').classList.toggle('show');
}

function showTab(tabId, event = null) {
    if (event) event.preventDefault();

    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });

    // Show selected tab
    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) {
        targetTab.style.display = 'block';
        targetTab.classList.add('active', 'animate-fade-in');
    }

    // Update active nav item
    document.querySelectorAll('.nav-link').forEach(item => {
        item.classList.remove('active');
    });

    // Update active state
    if (event) {
        event.currentTarget.classList.add('active');
    } else {
        const navItem = document.querySelector(`.nav-link[onclick*="'${tabId}'"]`);
        if (navItem) navItem.classList.add('active');
    }

    // Close sidebar on mobile
    if (window.innerWidth <= 991) {
        document.body.classList.remove('sidebar-open');
        document.getElementById('sidebar').classList.remove('show');
    }

    // Update charts if showing analytics or dashboard
    if (tabId === 'dashboard' || tabId === 'analytics') {
        setTimeout(updateCharts, 300); // Small delay for layout to settle
    }

    history.pushState(null, null, `#${tabId}`);
}


/* ================== AUTHENTICATION ================== */
function checkAuth() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        window.location.href = '/admin/login.html';
    } else {
        const adminName = localStorage.getItem('adminName');
        if (adminName) {
            const els = document.querySelectorAll('#admin-name');
            els.forEach(el => el.innerText = adminName);
        }
    }
}

function logout() {
    showConfirmation('Are you sure you want to logout?', () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('adminName');
        localStorage.removeItem('adminEmail');
        window.location.href = '/admin/login.html';
    });
}

function getHeaders() {
    const token = localStorage.getItem(TOKEN_KEY);
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

/* ================== DATA FETCHING & ANALYTICS ================== */
async function fetchDashboardData() {
    try {
        const res = await fetch('/api/admin/dashboard-data', { headers: getHeaders() });
        if (res.status === 401) return logout();

        const data = await res.json();

        allPackages = data.packages || [];
        allTransports = data.transports || [];
        allReviews = data.reviews || [];
        ownerProfile = data.ownerProfile || {};

        renderPackages();
        renderTransports();
        renderReviews();
        renderProfile();
        updateDashboardStats();
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
    }
}

async function fetchEnquiries() {
    try {
        const res = await fetch('/api/admin/enquiries', { headers: getHeaders() });
        const data = await res.json();
        allEnquiries = data || [];
        renderEnquiries();
        updateDashboardStats();
        initCharts(); // Initialize charts with real data
    } catch (err) {
        console.error('Error fetching enquiries:', err);
    }
}

function updateDashboardStats() {
    // Update Stats Cards
    const pkgCount = document.getElementById('dash-pkg-count'); // Updated ID
    if (pkgCount) pkgCount.innerText = allPackages.length;

    const enqCount = document.getElementById('dash-enq-count'); // Updated ID
    if (enqCount) enqCount.innerText = allEnquiries.length;

    const transCount = document.getElementById('dash-trans-count'); // Updated ID
    if (transCount) transCount.innerText = allTransports.length;

    const ratingEl = document.getElementById('dash-rating'); // Updated ID
    if (ratingEl && allReviews.length > 0) {
        const avg = allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length;
        ratingEl.innerText = avg.toFixed(1);
    }

    // Sidebar Badges
    const badgePkg = document.getElementById('stats-packages');
    if (badgePkg) badgePkg.innerText = allPackages.length;

    const badgeEnq = document.getElementById('stats-enquiries');
    if (badgeEnq) badgeEnq.innerText = allEnquiries.length;

    const badgeTrans = document.getElementById('stats-transports');
    if (badgeTrans) badgeTrans.innerText = allTransports.length;
}

function processAnalyticsData() {
    // 1. Process Enquiries by Month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCounts = new Array(12).fill(0);

    allEnquiries.forEach(enq => {
        const d = new Date(enq.createdAt);
        if (!isNaN(d.getTime())) {
            monthlyCounts[d.getMonth()]++;
        }
    });

    // 2. Process Enquiries by Type
    const typeCounts = {};
    allEnquiries.forEach(enq => {
        const type = enq.enquiryType || 'General';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    // 3. Process Enquiries by Status
    const statusCounts = {};
    allEnquiries.forEach(enq => {
        const status = enq.status || 'PENDING';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return { monthlyCounts, typeCounts, statusCounts, months };
}

function initCharts() {
    const { monthlyCounts, typeCounts, statusCounts, months } = processAnalyticsData();

    // 1. Enquiry Trend Chart (Area)
    if (document.querySelector("#enquiryTrendChart")) {
        const options1 = {
            series: [{ name: 'Enquiries', data: monthlyCounts }],
            chart: {
                height: 350,
                type: 'area',
                toolbar: { show: false },
                fontFamily: 'Inter, sans-serif'
            },
            colors: ['#4f46e5'],
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 2 },
            fill: {
                type: 'gradient',
                gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] }
            },
            xaxis: { categories: months },
            grid: { borderColor: '#f1f5f9' },
            tooltip: { theme: 'light' }
        };

        if (charts.trend) charts.trend.destroy();
        charts.trend = new ApexCharts(document.querySelector("#enquiryTrendChart"), options1);
        charts.trend.render();
    }

    // 2. Enquiry Type Chart (Donut)
    if (document.querySelector("#enquiryTypeChart")) {
        const options2 = {
            series: Object.values(typeCounts),
            labels: Object.keys(typeCounts),
            chart: { type: 'donut', height: 300, fontFamily: 'Inter, sans-serif' },
            colors: ['#4f46e5', '#10b981', '#f59e0b', '#0ea5e9'],
            legend: { position: 'bottom' },
            dataLabels: { enabled: false }
        };

        if (charts.type) charts.type.destroy();
        charts.type = new ApexCharts(document.querySelector("#enquiryTypeChart"), options2);
        charts.type.render();
    }

    // 3. Enquiry Status Chart (Bar)
    if (document.querySelector("#enquiryStatusChart")) {
        const options3 = {
            series: [{ name: 'Count', data: Object.values(statusCounts) }],
            chart: { type: 'bar', height: 300, toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
            plotOptions: { bar: { borderRadius: 4, horizontal: true } },
            dataLabels: { enabled: false },
            xaxis: { categories: Object.keys(statusCounts) },
            colors: ['#6366f1']
        };

        if (charts.status) charts.status.destroy();
        charts.status = new ApexCharts(document.querySelector("#enquiryStatusChart"), options3);
        charts.status.render();
    }
}

function updateCharts() {
    // Re-render logic can be simple re-init for now
    if (allEnquiries.length > 0) initCharts();
}


/* ================== PACKAGE MANAGEMENT ================== */
function renderPackages() {
    const tbody = document.getElementById('packages-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    allPackages.forEach(pkg => {
        const offerText = (pkg.offer && pkg.offer.text) || pkg.offerText || '';
        const offerPercent = (pkg.offer && pkg.offer.percentage) || pkg.offerPercent || 0;

        // Offer is active if percent > 0 OR there is text
        const hasOffer = offerPercent > 0 || (offerText && offerText.trim().length > 0);

        const imgUrl = pkg.images && pkg.images.length > 0 ? pkg.images[0] : 'https://placehold.co/60';

        let offerBadge = '<span class="text-muted small">-</span>';
        if (hasOffer) {
            if (offerPercent > 0) {
                offerBadge = `<span class="badge badge-custom badge-pending">${offerPercent}% OFF</span>`;
            } else {
                offerBadge = `<span class="badge badge-custom badge-info">Special Offer</span>`;
            }
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Image"><img src="${imgUrl}" class="img-thumb-sm" alt="pkg"></td>
            <td data-label="Package Name">
                <div class="fw-bold text-dark text-truncate" style="max-width: 150px;">${pkg.title}</div>
            </td>
            <td data-label="Type"><span class="badge badge-custom badge-primary">${pkg.packageType}</span></td>
            <td data-label="Price" class="fw-bold text-dark">₹${pkg.startingPrice}</td>
            <td data-label="Offer">${offerBadge}</td>
            <td data-label="Actions">
                <button class="btn btn-icon-sm d-inline-flex me-1" onclick="openPackageModal('${pkg._id}')"><i class="fas fa-pen small"></i></button>
                <button class="btn btn-icon-sm d-inline-flex text-danger hover-danger" onclick="deletePackage('${pkg._id}')"><i class="fas fa-trash small"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openPackageModal(pkgId = null) {
    const form = document.getElementById('package-form');
    form.reset();
    document.getElementById('pkg-img-file-status').innerText = '';
    document.getElementById('pkg-id').value = ''; // Ensure ID is clear

    if (pkgId) {
        const pkg = allPackages.find(p => p._id === pkgId);
        if (!pkg) return;

        document.getElementById('pkg-id').value = pkg._id;
        document.getElementById('pkg-title-in').value = pkg.title;
        document.getElementById('pkg-type-in').value = pkg.packageType;
        document.getElementById('pkg-dest-in').value = pkg.destination;
        document.getElementById('pkg-price-in').value = pkg.startingPrice;
        document.getElementById('pkg-dur-in').value = pkg.duration;
        document.getElementById('pkg-itin-in').value = pkg.itinerary || '';
        document.getElementById('pkg-incl-in').value = pkg.inclusions || '';
        document.getElementById('pkg-excl-in').value = pkg.exclusions || '';

        if (pkg.images && pkg.images.length > 0) {
            document.getElementById('pkg-img-in').value = pkg.images[0];
            document.getElementById('pkg-img-file-status').innerText = 'Current image loaded';
        }

        const offerText = pkg.offerText || (pkg.offer && pkg.offer.text) || '';
        const offerPercent = pkg.offerPercent || (pkg.offer && pkg.offer.percentage) || '';

        console.log('Editing Package:', { id: pkg._id, offerText, offerPercent, rawOffer: pkg.offer });

        document.getElementById('pkg-offer-text').value = offerText;
        document.getElementById('pkg-offer-percent').value = offerPercent;
    }

    if (window.pkgModal) window.pkgModal.show();
}

document.getElementById('package-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Package form submitted');

    try {
        const formData = new FormData(e.target);
        const id = formData.get('id');

        const payload = {
            title: formData.get('title'),
            packageType: formData.get('packageType'),
            destination: formData.get('destination'),
            startingPrice: formData.get('startingPrice'),
            duration: formData.get('duration'),
            itinerary: formData.get('itinerary'),
            inclusions: formData.get('inclusions'),
            exclusions: formData.get('exclusions'),
        };

        const newImage = formData.get('image');
        if (newImage) {
            payload.images = [newImage];
        } else if (id) {
            const existingImg = document.getElementById('pkg-img-in').value;
            if (existingImg) payload.images = [existingImg];
        }

        const offerText = formData.get('offerText');
        const offerPercentStr = formData.get('offerPercent');

        console.log('Offer Inputs:', { offerText, offerPercentStr });

        const offerPercentVal = offerPercentStr ? parseFloat(offerPercentStr) : 0;
        const offerTextVal = offerText ? offerText.trim() : '';

        // Determine if we are setting or clearing an offer
        if (offerTextVal.length > 0 || offerPercentVal > 0) {
            payload.offerText = offerTextVal;
            payload.offerPercent = offerPercentVal;
        } else {
            payload.offerText = '';
            payload.offerPercent = 0;
        }

        console.log('Sending payload:', payload);

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/admin/packages/${id}` : '/api/admin/packages';

        const res = await fetch(url, {
            method: method,
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            window.pkgModal.hide();
            fetchDashboardData();
            showToast(id ? 'Package Updated!' : 'Package Created!', 'success');
        } else {
            const err = await res.json();
            console.error('Server error:', err);
            showToast('Error: ' + (err.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Submission error:', error);
        showToast('Something went wrong: ' + error.message, 'error');
    }
});

function deletePackage(id) {
    showConfirmation('Are you sure you want to delete this package?', async () => {
        try {
            const res = await fetch(`/api/admin/packages/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (res.ok) {
                fetchDashboardData();
                showToast('Package deleted successfully', 'success');
            } else {
                showToast('Failed to delete package', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error: ' + err.message, 'error');
        }
    });
}


/* ================== ENQUIRY MANAGEMENT ================== */
function renderEnquiries() {
    const tbody = document.getElementById('enquiries-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Sort by date desc
    allEnquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    allEnquiries.forEach(enq => {
        let statusBadge = '';
        switch (enq.status) {
            case 'PENDING': statusBadge = '<span class="badge badge-custom badge-pending">Pending</span>'; break;
            case 'CONTACTED': statusBadge = '<span class="badge badge-custom badge-primary">Contacted</span>'; break;
            case 'CONVERTED': statusBadge = '<span class="badge badge-custom badge-success">Booked</span>'; break;
            case 'CLOSED': statusBadge = '<span class="badge badge-custom bg-secondary text-white">Closed</span>'; break;
            default: statusBadge = `<span class="badge badge-custom bg-light text-dark border">${enq.status}</span>`;
        }

        const d = new Date(enq.createdAt);
        const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Status">${statusBadge}</td>
            <td data-label="Type"><span class="fw-semibold small text-uppercase text-muted">${enq.enquiryType}</span></td>
            <td data-label="Customer">
                <div class="fw-bold text-dark">${enq.customerName || enq.name || 'Unknown'}</div>
                <div class="small text-muted">${enq.contact || enq.phone || 'No Contact'}</div>
            </td>
            <td data-label="Date" class="small text-muted">${date}</td>
            <td data-label="Details" style="display:none">
                <span class="text-muted fst-italic text-truncate d-block" style="max-width: 200px;">"${enq.message || 'No message'}"</span>
            </td>
            <td data-label="Actions">
                    <div class="dropdown">
                        <button class="btn btn-primary-custom btn-sm me-1" onclick="viewEnquiry('${enq._id}')">View</button>
                        <button class="btn btn-icon-sm border-0" data-bs-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                            <li><h6 class="dropdown-header">Update Status</h6></li>
                            <li><a class="dropdown-item" href="#" onclick="updateEnquiry('${enq._id}', 'CONTACTED')"><i class="fas fa-phone small me-2"></i>Mark Contacted</a></li>
                            <li><a class="dropdown-item" href="#" onclick="updateEnquiry('${enq._id}', 'CONVERTED')"><i class="fas fa-check small me-2 text-success"></i>Mark Booked</a></li>
                            <li><a class="dropdown-item" href="#" onclick="updateEnquiry('${enq._id}', 'CLOSED')"><i class="fas fa-times small me-2 text-muted"></i>Close Enquiry</a></li>
                        </ul>
                    </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateEnquiry(id, status) {
    try {
        const res = await fetch(`/api/admin/enquiries/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            fetchEnquiries();
            showToast('Enquiry status updated', 'success');
        }
    } catch (err) {
        console.error(err);
        showToast('Failed to update status', 'error');
    }
}

let currentEnquiryId = null;

function viewEnquiry(id) {
    const enq = allEnquiries.find(e => e._id === id);
    if (!enq) return;

    currentEnquiryId = id;

    // Populate Modal
    document.getElementById('enq-name').innerText = enq.customerName || enq.name || 'N/A';
    document.getElementById('enq-contact').innerText = enq.contact || enq.phone || 'N/A';
    const d = new Date(enq.createdAt);
    document.getElementById('enq-date').innerText = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

    document.getElementById('enq-type').innerText = enq.enquiryType || 'General';
    document.getElementById('enq-dest').innerText = enq.destination || '-';


    document.getElementById('enq-message').innerText = enq.message || 'No additional message provided.';

    window.enqModal.show();
}

function updateEnquiryStatusFromModal(status) {
    if (currentEnquiryId) {
        updateEnquiry(currentEnquiryId, status);
        window.enqModal.hide();
    }
}

/* ================== MY PROFILE ================== */
function openMyProfile(e) {
    if (e) e.preventDefault();

    const name = localStorage.getItem('adminName') || 'Admin';
    const email = localStorage.getItem('adminEmail') || 'admin@example.com';

    document.getElementById('my-profile-name').innerText = name;
    document.getElementById('my-profile-email').innerText = email;
    document.getElementById('my-profile-avatar').innerText = name.charAt(0).toUpperCase();

    window.myProfModal.show();
}


/* ================== TRANSPORT MANAGEMENT ================== */
function renderTransports() {
    const grid = document.getElementById('transports-grid');
    if (!grid) return;
    grid.innerHTML = '';

    allTransports.forEach(trans => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        col.innerHTML = `
             <div class="card-premium h-100 position-relative">
                <div class="ratio ratio-16x9">
                    <img src="${trans.image || 'https://placehold.co/300'}" class="object-fit-cover" alt="${trans.name}">
                </div>
                <div class="card-body">
                    <h5 class="fw-bold mb-2">${trans.name}</h5>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-light text-dark border"><i class="fas fa-users me-1"></i> ${trans.capacity} Seats</span>
                        <span class="fw-bold text-primary">₹${trans.pricePerKm}/km</span>
                    </div>
                </div>
                <div class="position-absolute top-0 end-0 p-2">
                    <button class="btn btn-light btn-sm rounded-circle shadow-sm mb-2" onclick="openTransportModal('${trans._id}')"><i class="fas fa-pen text-primary"></i></button>
                    <button class="btn btn-light btn-sm rounded-circle shadow-sm" onclick="deleteTransport('${trans._id}')"><i class="fas fa-trash text-danger"></i></button>
                </div>
            </div>
        `;
        grid.appendChild(col);
    });
}

function openTransportModal(transId = null) {
    const form = document.getElementById('transport-form');
    form.reset();
    document.getElementById('trans-img-file-status').innerText = '';

    if (transId) {
        const trans = allTransports.find(t => t._id === transId);
        if (!trans) return;

        document.getElementById('trans-id').value = trans._id;
        document.getElementById('trans-name').value = trans.name;
        document.getElementById('trans-cap').value = trans.capacity;
        document.getElementById('trans-price').value = trans.pricePerKm;

        if (trans.image) {
            document.getElementById('trans-img').value = trans.image;
            document.getElementById('trans-img-file-status').innerText = 'Current image loaded';
        }
    } else {
        document.getElementById('trans-id').value = '';
    }

    window.transModal.show();
}

document.getElementById('transport-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = formData.get('id');
    const payload = Object.fromEntries(formData.entries());

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/admin/transports/${id}` : '/api/admin/transports';

        const res = await fetch(url, {
            method: method,
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            window.transModal.hide();
            fetchDashboardData();
            showToast('Vehicle Saved Successfully!', 'success');
        } else {
            showToast('Operation failed', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Error: ' + err.message, 'error');
    }
});

function deleteTransport(id) {
    showConfirmation('Delete this vehicle?', async () => {
        try {
            const res = await fetch(`/api/admin/transports/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (res.ok) {
                fetchDashboardData();
                showToast('Vehicle deleted successfully', 'success');
            } else {
                showToast('Failed to delete vehicle', 'error');
            }
        } catch (err) { console.error(err); }
    });
}


/* ================== REVIEW MANAGEMENT ================== */
function renderReviews() {
    const grid = document.getElementById('reviews-grid');
    if (!grid) return;
    grid.innerHTML = '';

    allReviews.forEach(rev => {
        const stars = Array(5).fill('<i class="far fa-star text-warning"></i>');
        for (let i = 0; i < rev.rating; i++) stars[i] = '<i class="fas fa-star text-warning"></i>';

        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        col.innerHTML = `
            <div class="card-premium h-100 p-3">
                <div class="d-flex justify-content-between mb-3">
                    <div class="d-flex align-items-center">
                        <img src="${rev.customerPhoto || 'https://placehold.co/50'}" class="rounded-circle me-3" width="48" height="48" style="object-fit:cover">
                        <div>
                            <h6 class="fw-bold mb-0 text-dark">${rev.customerName}</h6>
                            <small class="text-warning">${stars.join('')}</small>
                        </div>
                    </div>
                    <button class="btn btn-outline-danger btn-sm rounded-circle border-0" style="width:32px;height:32px" onclick="deleteReview('${rev._id}')">
                         <i class="fas fa-times"></i>
                    </button>
                </div>
                <p class="text-muted small mb-0 fst-italic">"${rev.comment}"</p>
            </div>
        `;
        grid.appendChild(col);
    });
}

function openReviewModal() {
    document.getElementById('review-form').reset();
    document.getElementById('rev-img-file-status').innerText = '';
    window.revModal.show();
}

document.getElementById('review-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    try {
        const res = await fetch('/api/admin/reviews', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            window.revModal.hide();
            fetchDashboardData();
            showToast('Review added successfully!', 'success');
        } else {
            showToast('Failed to add review', 'error');
        }
    } catch (err) { console.error(err); }
});

function deleteReview(id) {
    showConfirmation('Remove this review?', async () => {
        try {
            const res = await fetch(`/api/admin/reviews/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (res.ok) {
                fetchDashboardData();
                showToast('Review removed', 'success');
            } else {
                showToast('Failed to remove review', 'error');
            }
        } catch (err) { console.error(err); }
    });
}


/* ================== PROFILE MANAGEMENT ================== */
function renderProfile() {
    if (!ownerProfile || !document.getElementById('prof-name')) return;
    document.getElementById('prof-name').value = ownerProfile.displayName || '';
    document.getElementById('prof-desc').value = ownerProfile.description || '';
    document.getElementById('prof-phone').value = ownerProfile.contactPhone || '';
    document.getElementById('prof-insta').value = ownerProfile.instagramHandle || '';
    document.getElementById('prof-img').value = ownerProfile.ownerImage || '';
}

document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    try {
        const res = await fetch('/api/admin/profile', {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            showToast('Profile updated successfully!', 'success');
            fetchDashboardData();
        } else {
            showToast('Update failed', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Error: ' + err.message, 'error');
    }
});

/* ================== ADMIN MANAGEMENT ================== */
let allAdmins = [];

async function fetchAdmins() {
    try {
        const res = await fetch('/api/admin/admins', { headers: getHeaders() });
        if (res.ok) {
            allAdmins = await res.json();
            renderAdmins();
        }
    } catch (err) { console.error(err); }
}

function renderAdmins() {
    const list = document.getElementById('admins-list');
    if (!list) return;
    list.innerHTML = '';

    allAdmins.forEach(admin => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center p-3 border-bottom';
        li.innerHTML = `
            <div class="d-flex align-items-center">
                <img src="${admin.profilePhoto || 'https://placehold.co/40'}" class="rounded-circle me-3" width="40" height="40">
                <div>
                    <h6 class="mb-0 fw-bold">${admin.name}</h6>
                    <small class="text-muted">${admin.email}</small>
                </div>
            </div>
            ${admin.role !== 'SUPER_ADMIN' ?
                `<button class="btn btn-sm btn-action text-danger" onclick="deleteAdminUser('${admin._id}')"><i class="fas fa-trash"></i></button>` : ''}
        `;
        list.appendChild(li);
    });
}

function deleteAdminUser(id) {
    showConfirmation('Remove this admin?', async () => {
        try {
            const res = await fetch(`/api/admin/admins/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (res.ok) {
                fetchAdmins();
                showToast('Admin removed successfully', 'success');
            } else {
                showToast('Failed to remove admin', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error: ' + err.message, 'error');
        }
    });
}

document.getElementById('create-admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    const pass = document.getElementById('new-admin-pass').value;
    const confirmPass = document.getElementById('new-admin-pass-confirm').value;

    if (pass !== confirmPass) {
        showToast('Passwords do not match!', 'error');
        return;
    }

    try {
        const res = await fetch('/api/admin/create-admin', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast('New Admin Created Successfully!', 'success');
            e.target.reset();
            fetchAdmins();
        } else {
            const err = await res.json();
            showToast('Error: ' + err.message, 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('An unexpected error occurred: ' + err.message, 'error');
    }
});

/* ================== UTILS ================== */
let confirmCallback = null;

function showConfirmation(msg, action) {
    document.getElementById('confirm-msg').innerText = msg;
    confirmCallback = action;
    window.confirmModal.show();
}

document.getElementById('confirm-btn-action').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    window.confirmModal.hide();
});

// Toast Notification
function showToast(message, type = 'success') {
    const toastEl = document.getElementById('liveToast');
    const toastBody = toastEl.querySelector('.toast-body');

    toastBody.innerText = message;
    toastEl.className = 'toast toast-custom align-items-center';

    // Add specific class for border color logic in CSS
    toastEl.classList.add(type);

    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
}

/* ================== FILE UPLOAD ================== */
function uploadImage(inputElement, targetInputId, statusId) {
    const file = inputElement.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
        showToast('File too large (Max 50MB)', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    const statusEl = document.getElementById(statusId);
    if (statusEl) statusEl.innerText = "Uploading...";

    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (data.path) {
                document.getElementById(targetInputId).value = data.path;
                if (statusEl) {
                    statusEl.innerText = "Uploaded!";
                    statusEl.className = "text-success small";
                }
                showToast('Image uploaded successfully', 'success');
            } else {
                if (statusEl) {
                    statusEl.innerText = "Failed";
                    statusEl.className = "text-danger small";
                }
                showToast('Upload failed', 'error');
            }
        })
        .catch(err => {
            console.error(err);
            showToast('Upload error', 'error');
            if (statusEl) statusEl.innerText = "Error";
        });
}
