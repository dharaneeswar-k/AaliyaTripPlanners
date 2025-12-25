let allPackages = [];
let allTransports = [];
let allGallery = [];
let allEnquiries = [];
let ownerProfile = {};
let charts = {};
let uploadedGalleryMedia = []; // Store { url, type } objects

const TOKEN_KEY = 'adminToken';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    fetchDashboardData();
    fetchEnquiries();
    fetchAdmins();
    initEnquiryFilters();

    window.pkgModal = new bootstrap.Modal(document.getElementById('packageModal'));
    window.transModal = new bootstrap.Modal(document.getElementById('transportModal'));
    window.galleryModal = new bootstrap.Modal(document.getElementById('galleryModal'));
    window.confirmModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    window.enqModal = new bootstrap.Modal(document.getElementById('enquiryModal'));
    window.myProfModal = new bootstrap.Modal(document.getElementById('myProfileModal'));

    const currentTab = window.location.hash.substring(1) || 'dashboard';
    showTab(currentTab);
});

function toggleSidebar() {
    document.body.classList.toggle('sidebar-open');
    document.getElementById('sidebar').classList.toggle('show');
}

function showTab(tabId, event = null) {
    if (event) event.preventDefault();

    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });

    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) {
        targetTab.style.display = 'block';
        targetTab.classList.add('active', 'animate-fade-in');
    }

    document.querySelectorAll('.nav-link').forEach(item => {
        item.classList.remove('active');
    });

    if (event) {
        event.currentTarget.classList.add('active');
    } else {
        const navItem = document.querySelector(`.nav-link[onclick*="'${tabId}'"]`);
        if (navItem) navItem.classList.add('active');
    }

    if (window.innerWidth <= 991) {
        document.body.classList.remove('sidebar-open');
        document.getElementById('sidebar').classList.remove('show');
    }

    if (tabId === 'dashboard' || tabId === 'analytics') {
        setTimeout(updateCharts, 300);
    }

    history.pushState(null, null, `#${tabId}`);
}

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

async function fetchDashboardData() {
    try {
        const res = await fetch('/api/admin/dashboard-data', { headers: getHeaders() });
        if (res.status === 401) return logout();

        const data = await res.json();

        allPackages = data.packages || [];
        allTransports = data.transports || [];
        allGallery = data.gallery || [];
        ownerProfile = data.ownerProfile || {};

        renderPackages();
        renderTransports();
        renderGallery();
        renderProfile();
        updateDashboardStats();
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        showToast('Failed to load dashboard data. Check console.', 'error');
    }
}

async function fetchEnquiries() {
    try {
        const res = await fetch('/api/admin/enquiries', { headers: getHeaders() });
        const data = await res.json();
        allEnquiries = data || [];
        renderEnquiries();
        updateDashboardStats();
        initCharts();
    } catch (err) {
        // Error handling silently
    }
}

function updateDashboardStats() {
    const pkgCount = document.getElementById('dash-pkg-count');
    if (pkgCount) pkgCount.innerText = allPackages.length;

    const enqCount = document.getElementById('dash-enq-count');
    if (enqCount) enqCount.innerText = allEnquiries.length;

    const transCount = document.getElementById('dash-trans-count');
    if (transCount) transCount.innerText = allTransports.length;

    const galCountEl = document.getElementById('dash-gallery-count');
    if (galCountEl) galCountEl.innerText = allGallery.length;

    const badgePkg = document.getElementById('stats-packages');
    if (badgePkg) badgePkg.innerText = allPackages.length;

    const badgeEnq = document.getElementById('stats-enquiries');
    if (badgeEnq) badgeEnq.innerText = allEnquiries.length;

    const badgeTrans = document.getElementById('stats-transports');
    if (badgeTrans) badgeTrans.innerText = allTransports.length;

    const badgeGal = document.getElementById('stats-gallery');
    if (badgeGal) badgeGal.innerText = allGallery.length;
}

function processAnalyticsData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCounts = new Array(12).fill(0);

    allEnquiries.forEach(enq => {
        const d = new Date(enq.createdAt);
        if (!isNaN(d.getTime())) {
            monthlyCounts[d.getMonth()]++;
        }
    });

    const typeCounts = {};
    allEnquiries.forEach(enq => {
        const type = enq.enquiryType || 'General';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const statusCounts = {};
    allEnquiries.forEach(enq => {
        const status = enq.status || 'PENDING';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return { monthlyCounts, typeCounts, statusCounts, months };
}

function initCharts() {
    const { monthlyCounts, typeCounts, statusCounts, months } = processAnalyticsData();

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
    if (allEnquiries.length > 0) initCharts();
}

function renderPackages() {
    const tbody = document.getElementById('packages-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    allPackages.forEach(pkg => {
        const offerText = (pkg.offer && pkg.offer.text) || pkg.offerText || '';
        const offerPercent = (pkg.offer && pkg.offer.percentage) || pkg.offerPercent || 0;

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
    document.getElementById('pkg-id').value = '';

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

        document.getElementById('pkg-offer-text').value = offerText;
        document.getElementById('pkg-offer-percent').value = offerPercent;
    }

    if (window.pkgModal) window.pkgModal.show();
}

function showToast(message, type = 'success') {
    const toastEl = document.getElementById('liveToast');
    const toastBody = toastEl.querySelector('.toast-body');
    const toast = new bootstrap.Toast(toastEl);

    toastEl.className = `toast toast-custom ${type}`;
    toastBody.innerText = message;
    toast.show();
}

function showConfirmation(message, onConfirm) {
    const modalEl = document.getElementById('confirmationModal');
    if (!modalEl) return;

    document.getElementById('confirm-msg').innerText = message;
    const confirmBtn = document.getElementById('confirm-btn-action');

    // Remove existing listeners to prevent stacking
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

    newBtn.addEventListener('click', () => {
        onConfirm();
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
    });

    let modal = bootstrap.Modal.getInstance(modalEl);
    if (!modal) {
        modal = new bootstrap.Modal(modalEl);
    }
    modal.show();
}

function uploadImage(input, targetId, statusId) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        const statusEl = document.getElementById(statusId);

        // Auto-detect type if this is the gallery upload
        if (targetId === 'gal-media') {
            const typeInput = document.getElementById('gal-type');
            if (typeInput) {
                if (file.type.startsWith('video/')) {
                    typeInput.value = 'video';
                } else {
                    typeInput.value = 'image';
                }
            }
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB limit for videos
            showToast('File is too large. Max 50MB.', 'error');
            input.value = '';
            return;
        }

        // Show preview immediately
        reader.onload = function (e) {
            // Note: We don't set the value yet, we wait for upload
            // But if we want to show preview in an <img> tag, we might need to find it.
            // However, the current code logic sets the HIDDEN input value for submission.
            // We should NOT set the hidden input to Base64 anymore if we want to save the URL.
            // But we might want to show a preview if there's an img tag. 
            // The existing logic doesn't seem to update an <img> tag src directly here, 
            // except for 'prof-img-preview' in HTML but that logic was 'onchange' calling uploadImage.

            // Let's look at how it was used:
            // document.getElementById(targetId).value = e.target.result;

            // We'll process the upload now.
            statusEl.innerText = 'Uploading...';
            statusEl.className = 'text-info small';
        };
        reader.readAsDataURL(file);

        // Upload to Cloudinary
        const formData = new FormData();
        formData.append('image', file);

        fetch('/api/upload', {
            method: 'POST',
            body: formData, // Auto-sets Content-Type to multipart/form-data
            // headers: getHeaders() // Optional: if you add auth later
        })
            .then(res => {
                if (!res.ok) throw new Error('Upload failed');
                return res.json();
            })
            .then(data => {
                document.getElementById(targetId).value = data.path; // Set the Cloudinary URL
                statusEl.innerText = 'Media uploaded: ' + file.name;
                statusEl.className = 'text-success small';

                // If there is a preview image element associated, update it?
                // The previous code didn't seem to update an img tag explicitely in this function, 
                // usually the user sees the file name or the form submission reloads the page.
                // Wait, for profile:
                // onchange="uploadImage(this, 'prof-img', 'prof-img-status')"
                // And: <img id="prof-img-preview" ...>
                // The preview logic for profile seems missing in the original `uploadImage` function I saw.
                // I'll stick to just setting the value and text.
            })
            .catch(err => {
                console.error(err);
                statusEl.innerText = 'Upload Error';
                statusEl.className = 'text-danger small';
                input.value = ''; // Clear input
            });
    }
}

async function fetchAdmins() {
    try {
        const res = await fetch('/api/admin/admins', { headers: getHeaders() });
        if (res.ok) {
            const admins = await res.json();
            renderAdmins(admins);
        }
    } catch (err) {
        console.error("Failed to fetch admins");
    }
}

function renderAdmins(admins) {
    const list = document.getElementById('admins-list');
    if (!list) return;
    list.innerHTML = '';

    admins.forEach(admin => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center py-3';
        li.innerHTML = `
            <div>
                <div class="fw-bold text-dark">${admin.name}</div>
                <div class="small text-muted">${admin.email}</div>
            </div>
            ${admin.email !== 'admin@example.com' ?
                `<button class="btn btn-sm text-danger bg-light rounded-circle" onclick="deleteAdmin('${admin._id}')"><i class="fas fa-trash"></i></button>`
                : '<span class="badge bg-secondary">System</span>'}
        `;
        list.appendChild(li);
    });
}

document.getElementById('create-admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const password = formData.get('password');
    const confirm = document.getElementById('new-admin-pass-confirm').value;

    if (password !== confirm) {
        showToast('Passwords do not match', 'error');
        return;
    }

    try {
        const res = await fetch('/api/admin/create-admin', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(Object.fromEntries(formData.entries()))
        });

        if (res.ok) {
            showToast('New Admin Created', 'success');
            e.target.reset();
            fetchAdmins();
        } else {
            const data = await res.json();
            showToast(data.message || 'Failed to create admin', 'error');
        }
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
});

function deleteAdmin(id) {
    showConfirmation('Delete this admin user?', async () => {
        try {
            const res = await fetch(`/api/admin/admins/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (res.ok) {
                fetchAdmins();
                showToast('Admin removed', 'success');
            } else {
                showToast('Failed to remove admin', 'error');
            }
        } catch (err) {
            showToast('Error', 'error');
        }
    });
}

document.getElementById('package-form').addEventListener('submit', async (e) => {
    e.preventDefault();

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

        const offerPercentVal = offerPercentStr ? parseFloat(offerPercentStr) : 0;
        const offerTextVal = offerText ? offerText.trim() : '';

        if (offerTextVal.length > 0 || offerPercentVal > 0) {
            payload.offerText = offerTextVal;
            payload.offerPercent = offerPercentVal;
        } else {
            payload.offerText = '';
            payload.offerPercent = 0;
        }

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
            showToast('Error: ' + (err.message || 'Unknown error'), 'error');
        }
    } catch (error) {
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
            showToast('Error: ' + err.message, 'error');
        }
    });
}

let currentEnquiryFilter = {
    search: '',
    status: 'ALL'
};

function initEnquiryFilters() {
    const searchInput = document.getElementById('enq-search');
    const statusSelect = document.getElementById('enq-filter-status');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentEnquiryFilter.search = e.target.value.toLowerCase();
            applyEnquiryFilters();
        });
    }

    if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
            currentEnquiryFilter.status = e.target.value;
            applyEnquiryFilters();
        });
    }
}

function applyEnquiryFilters() {
    const filtered = allEnquiries.filter(enq => {
        const matchesStatus = currentEnquiryFilter.status === 'ALL' || enq.status === currentEnquiryFilter.status;

        const searchStr = (currentEnquiryFilter.search || '').trim();
        const matchesSearch = !searchStr ||
            (enq.customerName || '').toLowerCase().includes(searchStr) ||
            (enq.name || '').toLowerCase().includes(searchStr) ||
            (enq.contact || '').toLowerCase().includes(searchStr) ||
            (enq.phone || '').toLowerCase().includes(searchStr);

        return matchesStatus && matchesSearch;
    });

    renderEnquiries(filtered);
}

function renderEnquiries(enquiriesToRender = null) {
    let list = enquiriesToRender;
    if (!list) {
        list = allEnquiries;
        if (currentEnquiryFilter.status !== 'ALL' || currentEnquiryFilter.search !== '') {
            list = allEnquiries.filter(enq => {
                const matchesStatus = currentEnquiryFilter.status === 'ALL' || enq.status === currentEnquiryFilter.status;
                const searchStr = currentEnquiryFilter.search;
                const matchesSearch = !searchStr ||
                    (enq.customerName || '').toLowerCase().includes(searchStr) ||
                    (enq.name || '').toLowerCase().includes(searchStr) ||
                    (enq.contact || '').toLowerCase().includes(searchStr) ||
                    (enq.phone || '').toLowerCase().includes(searchStr);
                return matchesStatus && matchesSearch;
            });
        }
    }

    const tbody = document.getElementById('enquiries-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No enquiries found matching your filters.</td></tr>';
        return;
    }

    list.forEach(enq => {
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
        showToast('Failed to update status', 'error');
    }
}

let currentEnquiryId = null;

function viewEnquiry(id) {
    const enq = allEnquiries.find(e => e._id === id);
    if (!enq) return;

    currentEnquiryId = id;

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

function downloadEnquiriesCSV() {
    const searchStr = currentEnquiryFilter.search;
    const dataToExport = allEnquiries.filter(enq => {
        const matchesStatus = currentEnquiryFilter.status === 'ALL' || enq.status === currentEnquiryFilter.status;
        const matchesSearch = !searchStr ||
            (enq.customerName || '').toLowerCase().includes(searchStr) ||
            (enq.name || '').toLowerCase().includes(searchStr) ||
            (enq.contact || '').toLowerCase().includes(searchStr) ||
            (enq.phone || '').toLowerCase().includes(searchStr);
        return matchesStatus && matchesSearch;
    });

    if (dataToExport.length === 0) {
        showToast('No data to export', 'error');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Status,Customer Name,Contact,Type,Destination,Message\n";

    dataToExport.forEach(row => {
        const d = new Date(row.createdAt);
        const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

        const name = (row.customerName || row.name || '').replace(/"/g, '""');
        const contact = (row.contact || row.phone || '').replace(/"/g, '""');
        const msg = (row.message || '').replace(/"/g, '""').replace(/(\r\n|\n|\r)/gm, " ");

        csvContent += `"${dateStr}","${row.status}","${name}","${contact}","${row.enquiryType}","${row.destination || ''}","${msg}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filename = `enquiries_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function openMyProfile(e) {
    if (e) e.preventDefault();

    const name = localStorage.getItem('adminName') || 'Admin';
    const email = localStorage.getItem('adminEmail') || 'admin@example.com';

    document.getElementById('my-profile-name').innerText = name;
    document.getElementById('my-profile-email').innerText = email;
    document.getElementById('my-profile-avatar').innerText = name.charAt(0).toUpperCase();

    window.myProfModal.show();
}

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
        } catch (err) {
            // Error handling silently
        }
    });
}

// ==========================================
// NEW GALLERY IMPLEMENTATION
// ==========================================

let newUploadedMedia = []; // Stores { url, type }

function renderGallery() {
    const grid = document.getElementById('gallery-grid-container');
    const emptyState = document.getElementById('gallery-empty-state');

    if (!grid) return;
    grid.innerHTML = '';

    if (!allGallery || allGallery.length === 0) {
        if (emptyState) emptyState.classList.remove('d-none');
        return;
    }

    if (emptyState) emptyState.classList.add('d-none');

    allGallery.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-sm-6 col-lg-4 col-xl-3';

        // Robust media handling
        let mediaList = item.media || [];
        // Legacy fallback support for older items if any remain
        if (mediaList.length === 0 && item.mediaUrl) {
            mediaList = [{ url: item.mediaUrl, type: item.mediaType || 'image' }];
        }

        const count = mediaList.length;
        const firstMedia = count > 0 ? mediaList[0] : null;

        let mediaPreview = '';
        if (firstMedia) {
            if (firstMedia.type === 'video' || (firstMedia.url && firstMedia.url.endsWith('.mp4'))) {
                mediaPreview = `
                    <video src="${firstMedia.url}" class="card-img-top object-fit-cover" style="height: 220px;" muted loop onmouseover="this.play()" onmouseout="this.pause();this.currentTime=0;"></video>
                    <div class="position-absolute top-0 end-0 p-2"><span class="badge bg-black bg-opacity-75"><i class="fas fa-video me-1"></i> Video</span></div>
                `;
            } else {
                mediaPreview = `<img src="${firstMedia.url}" class="card-img-top object-fit-cover" style="height: 220px;" alt="${item.destination}" loading="lazy">`;
            }
        } else {
            mediaPreview = '<div class="bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center" style="height: 220px;"><i class="fas fa-image text-muted fa-2x"></i></div>';
        }

        // Multi-badge
        let multiBadge = '';
        if (count > 1) {
            multiBadge = `<div class="position-absolute bottom-0 start-0 p-2 w-100 bg-gradient-dark-bottom"><span class="badge bg-white text-dark shadow-sm"><i class="fas fa-layer-group me-1"></i> +${count - 1} more</span></div>`;
        }

        col.innerHTML = `
            <div class="card-premium h-100 p-0 overflow-hidden border-0 shadow-sm hover-lift">
                <div class="position-relative">
                    ${mediaPreview}
                    ${multiBadge}
                </div>
                <div class="card-body p-3">
                    <h5 class="fw-bold mb-1 text-dark text-truncate">${item.destination || 'Untitled'}</h5>
                    <p class="text-muted small mb-2"><i class="fas fa-user-circle me-1 text-primary"></i> ${item.customerName || 'Happy Customer'}</p>
                    <p class="small text-secondary text-truncate mb-0">${item.description || 'No description'}</p>
                </div>
                <div class="card-footer bg-white border-top-0 p-3 pt-0 text-end">
                     <button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="deleteGalleryItem('${item._id}')">
                        <i class="fas fa-trash-alt me-1"></i> Delete
                     </button>
                </div>
            </div>
        `;
        grid.appendChild(col);
    });
}

function openNewGalleryModal() {
    const modalEl = document.getElementById('newGalleryModal');
    if (!modalEl) return;

    // Reset form
    document.getElementById('new-gallery-form').reset();
    document.getElementById('gallery-previews').innerHTML = '';
    document.getElementById('gallery-media-data').value = '';

    newUploadedMedia = [];

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

async function handleNewGalleryFiles(input) {
    const files = input.files;
    const previewContainer = document.getElementById('gallery-previews');
    const uploadBtn = document.getElementById('btn-save-gallery');

    if (files.length === 0) return;

    // Check total count (existing + new)
    if (newUploadedMedia.length + files.length > 3) {
        showToast('Maximum 3 items allowed per gallery entry.', 'error');
        input.value = '';
        return;
    }

    // Disable save button while uploading
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Uploading...';
    }

    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Size Check (50MB)
            if (file.size > 50 * 1024 * 1024) {
                showToast(`File ${file.name} is too large (Max 50MB)`, 'error');
                continue;
            }

            const formData = new FormData();
            formData.append('image', file);

            // Optimistic UI: Show placeholder loading
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'position-relative d-inline-block rounded overflow-hidden border';
            loadingDiv.style.width = '80px';
            loadingDiv.style.height = '80px';
            loadingDiv.innerHTML = '<div class="w-100 h-100 bg-light d-flex align-items-center justify-content-center"><i class="fas fa-spinner fa-spin text-muted"></i></div>';
            previewContainer.appendChild(loadingDiv);

            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();

            // Determine type
            let type = 'image';
            if (file.type.startsWith('video/')) type = 'video';

            // Add to tracked array
            newUploadedMedia.push({
                url: data.path, // Cloudinary URL
                type: type
            });

            // Replace placeholder with actual preview
            loadingDiv.innerHTML = '';
            if (type === 'video') {
                loadingDiv.innerHTML = `<video src="${data.path}" class="object-fit-cover w-100 h-100"></video><i class="fas fa-video position-absolute top-50 start-50 translate-middle text-white drop-shadow"></i>`;
            } else {
                loadingDiv.innerHTML = `<img src="${data.path}" class="object-fit-cover w-100 h-100">`;
            }
        }

    } catch (err) {
        console.error(err);
        showToast('One or more files failed to upload.', 'error');
    } finally {
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-save me-2"></i> Save to Gallery';
        }
        input.value = ''; // Reset input to allow re-selecting same file if needed
    }
}

document.getElementById('new-gallery-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (newUploadedMedia.length === 0) {
        showToast('Please upload at least one image or video.', 'error');
        return;
    }

    const formData = new FormData(e.target);
    const payload = {
        destination: formData.get('destination'),
        customerName: formData.get('customerName'),
        description: formData.get('description'),
        media: newUploadedMedia
    };

    try {
        const res = await fetch('/api/admin/gallery', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            // Close modal safely
            const modalEl = document.getElementById('newGalleryModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            fetchDashboardData(); // Refresh grid
            showToast('Gallery memory added successfully!', 'success');
        } else {
            const data = await res.json();
            showToast(data.message || 'Failed to save gallery item', 'error');
        }
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
});

function deleteGalleryItem(id) {
    showConfirmation('Are you sure you want to remove this memory?', async () => {
        try {
            const res = await fetch(`/api/admin/gallery/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });

            if (res.ok) {
                fetchDashboardData();
                showToast('Memory removed successfully.', 'success');
            } else {
                showToast('Failed to delete item.', 'error');
            }
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
        }
    });
}

function renderProfile() {
    if (!ownerProfile) return;
    const nameEl = document.getElementById('prof-name');
    if (nameEl) nameEl.value = ownerProfile.displayName || '';

    const phoneEl = document.getElementById('prof-phone');
    if (phoneEl) phoneEl.value = ownerProfile.contactPhone || '';

    const instaEl = document.getElementById('prof-insta');
    if (instaEl) instaEl.value = ownerProfile.instagramHandle || '';

    const descEl = document.getElementById('prof-desc');
    if (descEl) descEl.value = ownerProfile.description || '';

    const imgInput = document.getElementById('prof-img');
    if (imgInput) imgInput.value = ownerProfile.ownerImage || '';

    const preview = document.getElementById('prof-img-preview');
    if (preview && ownerProfile.ownerImage) {
        preview.src = ownerProfile.ownerImage;
        preview.style.display = 'block';
    }
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
            fetchDashboardData();
            showToast('Profile updated!', 'success');
        } else {
            showToast('Update failed', 'error');
        }
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
});


