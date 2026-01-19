(function () {
	const token = localStorage.getItem('token');
	if (!token) {
		window.location.href = '/login.html';
		return;
	}

	const LOW_STOCK_THRESHOLD = Number(window.APP_CONFIG?.lowStockThreshold) || 5;
	const DASHBOARD_LOW_STOCK_THRESHOLD = 10;

	// Elements
	const navButtons = document.querySelectorAll('.nav-item');
	const sections = document.querySelectorAll('section[id^="section-"]');
	const langSelect = document.getElementById('lang-select-app');
	const logoutBtn = document.getElementById('logout-btn');
	const toastEl = document.getElementById('toast');
	const userInfo = document.getElementById('user-info');

	// Dashboard
	const statProducts = document.getElementById('stat-products');
	const statStock = document.getElementById('stat-stock');
	const statMovements = document.getElementById('stat-movements');
	const statProductsCard = document.getElementById('stat-products-card');
	const statStockCard = document.getElementById('stat-stock-card');
	const statInventoryCard = document.getElementById('stat-inventory-card');
	const statInventoryList = document.getElementById('stat-inventory-list');
	const recentMovementsBody = document.getElementById('recent-movements-body');
	const recentMovementsEmpty = document.getElementById('recent-movements-empty');
	const chartEmpty = document.getElementById('chart-empty');
	const movementChartCanvas = document.getElementById('movement-chart');
	const inventoryStatusContent = document.getElementById('inventory-status-content');
	let movementChart;

	// Products
	const productForm = document.getElementById('product-form');
	const productSubmitBtn = document.getElementById('product-submit');
	const productResetBtn = document.getElementById('product-reset');
	const productsBody = document.getElementById('products-body');
	const productsEmpty = document.getElementById('products-empty');
	let productsById = {};
	let editingProductId = null;

	// Movements
	const movementForm = document.getElementById('movement-form');
	const movementProductSelect = document.getElementById('movement-product');
	const movementTypeSelect = document.getElementById('movement-type');
	const movementQuantityInput = document.getElementById('movement-quantity');
	const movementSubmitBtn = movementForm.querySelector('button[type="submit"]');
	const movementStockInfo = document.getElementById('movement-stock-info');
	const movementValidation = document.getElementById('movement-validation');
	const movementHelper = movementForm.querySelector('.helper[data-i18n="movement_hint_helper"]');
	movementHelper.style.display = 'none';

	// Export
	const exportBtn = document.getElementById('export-btn');

	// Language init
	langSelect.value = localStorage.getItem('lang') || 'EN';
	i18n.setLanguage(langSelect.value);
	i18n.translateDom();

	langSelect.addEventListener('change', (e) => {
		i18n.setLanguage(e.target.value);
		syncProductButtonText();
		i18n.translateDom(document);
		renderProducts(Object.values(productsById));
		renderInventoryStatus(Object.values(productsById));
		renderInventorySummary(Object.values(productsById));
		updateMovementContext();
		updateMovementHelper();
	});

	// User badge
	try {
		const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
		if (storedUser.username) {
			const userIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 19c1.3-3.4 5.7-3.8 6.5-3.8s5.2.4 6.5 3.8"/></svg>';
			userInfo.innerHTML = `<span class="user-chip">${userIcon}<span>${storedUser.username}</span></span>`;
		}
	} catch (err) {
		console.warn('Unable to read user from storage', err);
	}

	function handleUnauthorized() {
		localStorage.removeItem('token');
		window.location.href = '/login.html';
	}

	async function api(path, options = {}, asText = false) {
		const res = await fetch(path, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${localStorage.getItem('token')}`,
				...(options.headers || {}),
			},
		});
		if (res.status === 401) {
			handleUnauthorized();
			throw new Error('Unauthorized');
		}
		if (!res.ok) {
			let message = i18n.t('toast_error');
			let code;
			let details;
			try {
				const body = await res.json();
				if (body && body.message) message = body.message;
				if (body && body.code) code = body.code;
				if (body && body.details) details = body.details;
			} catch (err) {
				// ignore
			}
			const error = new Error(message);
			error.code = code;
			error.details = details;
			throw error;
		}
		if (asText) return res.text();
		return res.json();
	}

	function showToast(text, tone = 'info') {
		toastEl.textContent = text;
		toastEl.classList.add('show');
		toastEl.style.borderLeft = `4px solid ${tone === 'error' ? 'var(--danger)' : 'var(--accent)'}`;
		clearTimeout(showToast._timer);
		showToast._timer = setTimeout(() => toastEl.classList.remove('show'), 2600);
	}

	function formatCurrency(value) {
		const num = Number(value) || 0;
		return `${num.toLocaleString('uz-UZ')} so‘m`;
	}

	function formatDateTime(value) {
		if (!value) return '—';
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) return '—';
		const pad = (n) => n.toString().padStart(2, '0');
		const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
		const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
		return `${date} ${time}`;
	}

	function getStockState(stock) {
		const qty = Number(stock) || 0;
		if (qty <= 0) return 'empty';
		if (qty <= LOW_STOCK_THRESHOLD) return 'low';
		return 'ok';
	}

	function getStockBadge(stock) {
		const state = getStockState(stock);
		if (state === 'empty') return { label: i18n.t('stock.outOfStockLabel'), className: 'badge-stock-empty' };
		if (state === 'low') return { label: i18n.t('stock.lowStockLabel').replace('{count}', stock), className: 'badge-stock-low' };
		return null;
	}

	function renderInventorySummary(products = []) {
		if (!statInventoryList) return;
		const outOfStock = [];
		const lowStock = [];
		products.forEach((p) => {
			const qty = Number(p.stock) || 0;
			if (qty <= 0) {
				outOfStock.push(p);
			} else if (qty <= DASHBOARD_LOW_STOCK_THRESHOLD) {
				lowStock.push(p);
			}
		});

		const makePill = (item, tone) => {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = `inventory-pill tone-${tone}`;
			const labelKey = tone === 'danger' ? 'inventory_status_outItem' : 'inventory_status_lowItem';
			const text = i18n
				.t(labelKey)
				.replace('{item}', item.name)
				.replace('{count}', item.stock);
			btn.innerHTML = `
				<span class="status-dot status-dot-${tone}"></span>
				<span class="inventory-pill-text">${text}</span>
			`;
			btn.addEventListener('click', () => focusProductRow(item.id));
			return btn;
		};

		statInventoryList.innerHTML = '';
		[...outOfStock, ...lowStock].forEach((p) => {
			const tone = (Number(p.stock) || 0) <= 0 ? 'danger' : 'warning';
			statInventoryList.appendChild(makePill(p, tone));
		});

		if (!outOfStock.length && !lowStock.length) {
			const ok = document.createElement('div');
			ok.className = 'stat-inventory-ok';
			ok.innerHTML = `
				<span class="status-dot status-dot-ok"></span>
				<span class="stat-inventory-text">${i18n.t('inventory_status_allGood')}</span>
			`;
			statInventoryList.appendChild(ok);
		}
	}

	function renderInventoryStatus(products = []) {
		if (!inventoryStatusContent) return;
		const outOfStock = [];
		const lowStock = [];
		products.forEach((p) => {
			const qty = Number(p.stock) || 0;
			if (qty <= 0) {
				outOfStock.push(p);
			} else if (qty <= DASHBOARD_LOW_STOCK_THRESHOLD) {
				lowStock.push(p);
			}
		});

		const makeChip = (item, tone) => {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = `inventory-chip tone-${tone}`;
			btn.dataset.productId = item.id;
			btn.innerHTML = `
				<span class="status-dot status-dot-${tone}"></span>
				<span class="inventory-chip-name">${item.name}</span>
				<span class="inventory-chip-qty">(${item.stock})</span>
			`;
			btn.addEventListener('click', () => focusProductRow(item.id));
			return btn;
		};

		inventoryStatusContent.innerHTML = '';
		if (outOfStock.length || lowStock.length) {
			const items = [...outOfStock.map((p) => makeChip(p, 'danger')), ...lowStock.map((p) => makeChip(p, 'warning'))];
			items.forEach((el) => inventoryStatusContent.appendChild(el));
			return;
		}

		const okWrap = document.createElement('div');
		okWrap.className = 'inventory-ok';
		okWrap.innerHTML = `
			<span class="status-dot status-dot-ok"></span>
			<span class="inventory-ok-text">${i18n.t('dashboard_allGood')}</span>
		`;
		inventoryStatusContent.appendChild(okWrap);
	}

	function showSection(section) {
		sections.forEach((el) => {
			el.style.display = el.id === `section-${section}` ? 'block' : 'none';
		});
		navButtons.forEach((btn) => {
			btn.classList.toggle('active', btn.dataset.section === section);
		});
		i18n.translateDom();
	}

	function focusProductRow(productId) {
		showSection('products');
		const row = productsBody?.querySelector(`[data-product-id="${productId}"]`);
		if (!row) return;
		row.classList.add('product-highlight');
		row.scrollIntoView({ behavior: 'smooth', block: 'center' });
		clearTimeout(focusProductRow._timer);
		focusProductRow._timer = setTimeout(() => row.classList.remove('product-highlight'), 1800);
	}

	function navigateToProducts() {
		showSection('products');
	}

	navButtons.forEach((btn) => {
		btn.addEventListener('click', () => {
			const target = btn.dataset.section;
			showSection(target);
		});
	});

	function attachCardNav(el) {
		if (!el) return;
		el.addEventListener('click', navigateToProducts);
		el.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				navigateToProducts();
			}
		});
	}

	attachCardNav(statProductsCard);
	attachCardNav(statStockCard);

	logoutBtn.addEventListener('click', () => {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		window.location.href = '/login.html';
	});

	function syncProductButtonText() {
		if (editingProductId) {
			productSubmitBtn.textContent = i18n.t('product_update_btn');
		} else {
			productSubmitBtn.textContent = i18n.t('product_create_btn');
		}
	}

	async function loadDashboard() {
		try {
			const summary = await api('/api/dashboard/summary');
			statProducts.textContent = summary.products;
			statStock.textContent = summary.totalStock;
			if (statMovements) statMovements.textContent = summary.movements;
		} catch (err) {
			showToast(err.message, 'error');
		}
	}

	async function loadRecentMovements() {
		try {
			const movements = await api('/api/movements');
			if (recentMovementsBody) recentMovementsBody.innerHTML = '';
			if (!movements.length) {
				if (recentMovementsEmpty) recentMovementsEmpty.style.display = 'block';
				if (chartEmpty) chartEmpty.style.display = 'flex';
				if (movementChart) movementChart.destroy();
				return;
			}
			if (recentMovementsEmpty) recentMovementsEmpty.style.display = 'none';
			if (chartEmpty) chartEmpty.style.display = 'none';
			await renderMovementsChart(movements);
			if (recentMovementsBody) {
				const recent = movements.slice(-8).reverse();
				recent.forEach((m) => {
					const tr = document.createElement('tr');
					const productName = m.productName || (productsById[m.productId]?.name) || i18n.t('products_deletedLabel');
					const missingProduct = !(m.productName || productsById[m.productId]);
					const isIn = m.type === 'IN';
					const badgeClass = isIn ? 'badge-in' : 'badge-out';
					const qtyClass = isIn ? 'qty-in' : 'qty-out';
					tr.innerHTML = `
						<td>${formatDateTime(m.createdAt)}</td>
						<td class="${missingProduct ? 'product-missing' : ''}">${productName}</td>
						<td><span class="badge ${badgeClass}">${isIn ? i18n.t('movement_type_in') : i18n.t('movement_type_out')}</span></td>
						<td class="${qtyClass}">${m.quantity}</td>
					`;
					recentMovementsBody.appendChild(tr);
				});
			}
		} catch (err) {
			showToast(err.message, 'error');
		}
	}

	async function renderMovementsChart(movements) {
		const recent = movements.slice(-10);
		const labels = recent.map((m) => new Date(m.createdAt).toLocaleDateString());
		const values = recent.map((m) => (m.type === 'IN' ? m.quantity : -m.quantity));
		const colors = recent.map((m) => (m.type === 'IN' ? 'rgba(37, 197, 159, 0.9)' : 'rgba(229, 72, 72, 0.9)'));
		if (movementChart) movementChart.destroy();
		movementChart = new Chart(movementChartCanvas, {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						label: i18n.t('table_header_quantity'),
						data: values,
						backgroundColor: colors,
						borderRadius: 6,
					},
				],
			},
			options: {
				responsive: true,
				plugins: {
					legend: { display: false },
				},
				scales: {
					y: { grid: { color: '#e5e7eb' } },
					x: { grid: { display: false } },
				},
			},
		});
	}

	async function loadProducts() {
		try {
			const products = await api('/api/products');
			productsById = Object.fromEntries(products.map((p) => [p.id, p]));
			renderProducts(products);
			fillMovementProducts(products);
		} catch (err) {
			showToast(err.message, 'error');
		}
	}

	function renderProducts(products) {
		productsBody.innerHTML = '';
		renderInventoryStatus(products);
		renderInventorySummary(products);
		if (!products.length) {
			productsEmpty.style.display = 'block';
			return;
		}
		productsEmpty.style.display = 'none';
		products.forEach((p) => {
			const tr = document.createElement('tr');
			const stockBadge = getStockBadge(p.stock);
			const stockCell = `
				<div class="stock-cell">
					<span class="stock-qty">${p.stock}</span>
					${stockBadge ? `<span class="badge ${stockBadge.className}">${stockBadge.label}</span>` : ''}
				</div>
			`;
			tr.dataset.productId = p.id;
			tr.classList.toggle('stock-empty-row', getStockState(p.stock) === 'empty');
			tr.innerHTML = `
				<td>${p.name}</td>
				<td><span class="badge">${p.category}</span></td>
				<td>${formatCurrency(p.price)}</td>
				<td>${stockCell}</td>
				<td>
					<div class="actions">
						<button class="icon-btn" data-action="edit" aria-label="${i18n.t('action_edit')}">✎</button>
						<button class="icon-btn danger" data-action="delete" aria-label="${i18n.t('action_delete')}">✖</button>
					</div>
				</td>
			`;
			tr.querySelector('[data-action="edit"]').addEventListener('click', () => startEditProduct(p));
			tr.querySelector('[data-action="delete"]').addEventListener('click', () => deleteProduct(p.id));
			productsBody.appendChild(tr);
		});
		i18n.translateDom(productsBody);
	}

	function fillMovementProducts(products) {
		const previousSelection = movementProductSelect.value;
		movementProductSelect.innerHTML = '';
		let restoredSelection = false;
		products.forEach((p) => {
			const option = document.createElement('option');
			option.value = p.id;
			option.textContent = p.name;
			if (p.id === previousSelection) {
				option.selected = true;
				restoredSelection = true;
			}
			movementProductSelect.appendChild(option);
		});
		if (!restoredSelection && movementProductSelect.options.length) {
			movementProductSelect.selectedIndex = 0;
		}
		updateMovementContext();
	}

	function getSelectedProduct() {
		const selectedId = movementProductSelect.value;
		return productsById[selectedId];
	}

	function renderMovementStockInfo(product) {
		const stock = product ? Number(product.stock) || 0 : 0;
		if (!movementStockInfo) return stock;
		if (!product) {
			movementStockInfo.textContent = i18n.t('movement_no_product');
			movementStockInfo.classList.remove('warning');
			return stock;
		}
		const base = i18n.t('movement_stock_label').replace('{count}', stock);
		if (stock === 0) {
			movementStockInfo.textContent = `${base} — ${i18n.t('stock_outOfStock')}`;
			movementStockInfo.classList.add('warning');
		} else if (getStockState(stock) === 'low') {
			movementStockInfo.textContent = `${base} — ${i18n.t('stock_lowStock').replace('{count}', stock)}`;
			movementStockInfo.classList.remove('warning');
		} else {
			movementStockInfo.textContent = base;
			movementStockInfo.classList.remove('warning');
		}
		return stock;
	}

	function adjustMovementTypeOptions(stock) {
		const outOption = movementTypeSelect.querySelector('option[value="OUT"]');
		if (!outOption) return;
		const disableOut = stock === 0;
		outOption.disabled = disableOut;
		if (disableOut && movementTypeSelect.value === 'OUT') {
			movementTypeSelect.value = 'IN';
		}
	}

	function updateMovementValidation() {
		const product = getSelectedProduct();
		const stock = product ? Number(product.stock) || 0 : 0;
		const type = movementTypeSelect.value;
		const qty = Number(movementQuantityInput.value);
		let message = '';
		let disable = false;
		if (!product) {
			message = i18n.t('movement_no_product');
			disable = true;
		} else if (type === 'OUT') {
			if (stock === 0) {
				message = i18n.t('stock_outOfStock');
				disable = true;
			} else if (qty && qty > stock) {
				message = i18n.t('movement_out_insufficient').replace('{count}', stock);
				disable = true;
			}
		}
		if (movementValidation) {
			movementValidation.textContent = message;
			movementValidation.style.display = message ? 'block' : 'none';
		}
		if (movementSubmitBtn) {
			movementSubmitBtn.disabled = disable;
		}
		return { message, disable };
	}

	function updateMovementContext() {
		const product = getSelectedProduct();
		const stock = renderMovementStockInfo(product);
		adjustMovementTypeOptions(stock);
		updateMovementValidation();
		updateMovementHelper();
	}

	function updateMovementHelper() {
		if (!movementHelper) return;
		const type = movementTypeSelect.value;
		movementHelper.classList.remove('success', 'danger');
		if (!type) {
			movementHelper.textContent = '';
			movementHelper.style.display = 'none';
			return;
		}
		movementHelper.style.display = 'block';
		if (type === 'IN') {
			movementHelper.textContent = i18n.t('movement_helper_in');
			movementHelper.classList.add('success');
		} else {
			movementHelper.textContent = i18n.t('movement_helper_out');
			movementHelper.classList.add('danger');
		}
	}

	productForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const payload = {
			name: productForm.name.value.trim(),
			category: productForm.category.value.trim(),
			price: parseFloat(productForm.price.value),
			stock: parseInt(productForm.stock.value, 10),
		};
		try {
			if (editingProductId) {
				await api(`/api/products/${editingProductId}`, { method: 'PUT', body: JSON.stringify(payload) });
			} else {
				await api('/api/products', { method: 'POST', body: JSON.stringify(payload) });
			}
			showToast(i18n.t('toast_saved'));
			resetProductForm();
			await loadProducts();
			await loadDashboard();
			await loadRecentMovements();
		} catch (err) {
			showToast(err.message, 'error');
		}
	});

	productResetBtn.addEventListener('click', () => {
		resetProductForm();
	});

	function startEditProduct(product) {
		editingProductId = product.id;
		productForm.name.value = product.name;
		productForm.category.value = product.category;
		productForm.price.value = product.price;
		productForm.stock.value = product.stock;
		syncProductButtonText();
	}

	async function deleteProduct(id) {
		const confirmed = window.confirm(i18n.t('confirm_delete'));
		if (!confirmed) return;
		try {
			await api(`/api/products/${id}`, { method: 'DELETE' });
			showToast(i18n.t('toast_deleted'));
			await loadProducts();
			await loadDashboard();
		} catch (err) {
			showToast(err.message, 'error');
		}
	}

	function resetProductForm() {
		editingProductId = null;
		productForm.reset();
		syncProductButtonText();
	}

	movementProductSelect.addEventListener('change', () => {
		updateMovementContext();
	});

	movementTypeSelect.addEventListener('change', () => {
		updateMovementHelper();
		updateMovementValidation();
	});
	movementQuantityInput.addEventListener('input', updateMovementValidation);

	movementForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		if (!movementForm.checkValidity()) {
			movementForm.reportValidity();
			return;
		}
		const validation = updateMovementValidation();
		if (validation?.disable) return;
		const payload = {
			productId: movementForm.querySelector('#movement-product').value,
			type: movementForm.querySelector('#movement-type').value,
			quantity: parseInt(movementForm.querySelector('#movement-quantity').value, 10),
		};
		try {
			await api('/api/movements', { method: 'POST', body: JSON.stringify(payload) });
			showToast(i18n.t('movement_success'));
			movementForm.reset();
			await loadProducts();
			await loadDashboard();
			await loadRecentMovements();
			updateMovementContext();
		} catch (err) {
			if (err.code === 'INSUFFICIENT_STOCK') {
				const available = err.details?.available ?? 0;
				showToast(i18n.t('movement_out_insufficient').replace('{count}', available), 'error');
				updateMovementValidation();
				return;
			}
			showToast(err.message, 'error');
		}
	});

	exportBtn.addEventListener('click', async () => {
		try {
			const csv = await api('/api/export/products', {}, true);
			const blob = new Blob([csv], { type: 'text/csv' });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'products.csv';
			a.click();
			window.URL.revokeObjectURL(url);
		} catch (err) {
			showToast(err.message, 'error');
		}
	});

	async function init() {
		showSection('dashboard');
		syncProductButtonText();
		await loadDashboard();
		await loadProducts();
		await loadRecentMovements();
	}

	init();
})();
