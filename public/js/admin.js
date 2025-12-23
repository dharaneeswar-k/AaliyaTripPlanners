let allPackages = [];
let allTransports = [];
let allReviews = [];
let allEnquiries = [];
let ownerProfile = {};
let charts = {};

const TOKEN_KEY = 'adminToken';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    fetchDashboardData();
    fetchEnquiries();
    fetchAdmins();
    initEnquiryFilters();

    window.pkgModal = new bootstrap.Modal(document.getElementById('packageModal'));
    window.transModal = new bootstrap.Modal(document.getElementById('transportModal'));
    window.revModal = new bootstrap.Modal(document.getElementById('reviewModal'));
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
        allReviews = data.reviews || [];
        ownerProfile = data.ownerProfile || {};

        renderPackages();
        renderTransports();
        renderReviews();
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

    const reviewCountEl = document.getElementById('dash-review-count');
    if (reviewCountEl) reviewCountEl.innerText = allReviews.length;

    const badgePkg = document.getElementById('stats-packages');
    if (badgePkg) badgePkg.innerText = allPackages.length;

    const badgeEnq = document.getElementById('stats-enquiries');
    if (badgeEnq) badgeEnq.innerText = allEnquiries.length;

    const badgeTrans = document.getElementById('stats-transports');
    if (badgeTrans) badgeTrans.innerText = allTransports.length;

    const badgeReviews = document.getElementById('stats-reviews');
    if (badgeReviews) badgeReviews.innerText = allReviews.length;
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
    document.getElementById('confirm-msg').innerText = message;
    const confirmBtn = document.getElementById('confirm-btn-action');

    // Remove existing listeners to prevent stacking
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

    newBtn.addEventListener('click', () => {
        onConfirm();
        window.confirmModal.hide();
    });

    window.confirmModal.show();
}

function uploadImage(input, targetId, statusId) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            showToast('File is too large. Max 2MB.', 'error');
            input.value = '';
            return;
        }

        reader.onload = function (e) {
            document.getElementById(targetId).value = e.target.result;
            document.getElementById(statusId).innerText = 'Image selected: ' + file.name;
            document.getElementById(statusId).className = 'text-success small';
        };

        reader.readAsDataURL(file);
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
                            <h6 class="fw-bold mb-0">${rev.customerName}</h6>
                            <div class="small">${stars.join('')}</div>
                        </div>
                    </div>
                    <button class="btn btn-icon-sm text-danger" onclick="deleteReview('${rev._id}')"><i class="fas fa-trash"></i></button>
                </div>
                <p class="text-muted small fst-italic">"${rev.comment}"</p>
            </div>
        `;
        grid.appendChild(col);
    });
}

function openReviewModal() {
    document.getElementById('review-form').reset();
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
            showToast('Review added!', 'success');
        } else {
            showToast('Failed to add review', 'error');
        }
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
});

function deleteReview(id) {
    showConfirmation('Delete this review?', async () => {
        try {
            const res = await fetch(`/api/admin/reviews/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (res.ok) {
                fetchDashboardData();
                showToast('Review deleted!', 'success');
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


