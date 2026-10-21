<script lang="ts">
	import AppSidebar from '#lib/components/AppSidebar.svelte';
	import PocketBase from 'pocketbase';

	type Remedy = {
		id: string;
		name: string;
		scientific_name?: string;
		category: string;
		parts_used?: string;
		benefits: string;
		usage?: string;
		precautions?: string;
		author?: string;
		created: string;
	};

	type RemedyForm = Omit<Remedy, 'id' | 'created'>;

	const collectionName = 'thuoc_nam';
	const pocketBaseUrl = import.meta.env.VITE_POCKETBASE_URL || '/pocketbase';
	const pocketbase = new PocketBase(pocketBaseUrl);
	const categories = ['Tất cả', 'Cây thân thảo', 'Thân gỗ', 'Dây leo', 'Hoa và quả', 'Khác'];

	function emptyForm(): RemedyForm {
		return {
			name: '',
			scientific_name: '',
			category: 'Cây thân thảo',
			parts_used: '',
			benefits: '',
			usage: '',
			precautions: '',
			author: ''
		};
	}

	let remedies = $state<Remedy[]>([]);
	let activeCategory = $state('Tất cả');
	let searchQuery = $state('');
	let isLoading = $state(true);
	let isSaving = $state(false);
	let errorMessage = $state('');
	let formError = $state('');
	let editingRemedy = $state<Remedy | null>(null);
	let form = $state<RemedyForm>(emptyForm());
	let dialogElement: HTMLDialogElement;

	const visibleRemedies = $derived(
		remedies.filter((remedy) => {
			const matchesCategory = activeCategory === 'Tất cả' || remedy.category === activeCategory;
			const query = searchQuery.trim().toLocaleLowerCase('vi');
			const searchable = [remedy.name, remedy.scientific_name, remedy.category, remedy.benefits]
				.join(' ')
				.toLocaleLowerCase('vi');
			return matchesCategory && (!query || searchable.includes(query));
		})
	);

	const categoryCounts = $derived(
		Object.fromEntries(
			categories.map((category) => [
				category,
				category === 'Tất cả'
					? remedies.length
					: remedies.filter((remedy) => remedy.category === category).length
			])
		) as Record<string, number>
	);

	$effect(() => {
		void loadRemedies();
	});

	function getResponseStatus(error: unknown) {
		if (typeof error === 'object' && error !== null && 'status' in error) {
			return typeof error.status === 'number' ? error.status : 0;
		}
		return 0;
	}

	async function loadRemedies() {
		isLoading = true;
		errorMessage = '';
		try {
			remedies = await pocketbase
				.collection(collectionName)
				.getFullList<Remedy>({ sort: '-updated' });
		} catch (error) {
			console.error('Không thể tải thư viện thuốc nam:', error);
			const status = getResponseStatus(error);
			errorMessage =
				status === 403
					? 'PocketBase từ chối đọc collection thuoc_nam. Hãy kiểm tra list rule.'
					: status === 404
						? 'Không tìm thấy collection thuoc_nam. Hãy chạy ./init-pocketbase.sh.'
						: 'Không truy cập được PocketBase. Hãy kiểm tra máy chủ và URL mà trình duyệt có thể truy cập.';
		} finally {
			isLoading = false;
		}
	}

	function openCreateDialog() {
		editingRemedy = null;
		form = emptyForm();
		formError = '';
		dialogElement.showModal();
	}

	function openEditDialog(remedy: Remedy) {
		editingRemedy = remedy;
		formError = '';
		form = {
			name: remedy.name,
			scientific_name: remedy.scientific_name ?? '',
			category: remedy.category,
			parts_used: remedy.parts_used ?? '',
			benefits: remedy.benefits,
			usage: remedy.usage ?? '',
			precautions: remedy.precautions ?? '',
			author: remedy.author ?? ''
		};
		dialogElement.showModal();
	}

	function resetDialog() {
		editingRemedy = null;
		form = emptyForm();
		formError = '';
	}

	async function saveRemedy(event: SubmitEvent) {
		event.preventDefault();
		isSaving = true;
		errorMessage = '';
		try {
			if (editingRemedy) {
				await pocketbase.collection(collectionName).update(editingRemedy.id, form);
			} else {
				await pocketbase.collection(collectionName).create(form);
			}
			dialogElement.close();
			await loadRemedies();
		} catch (error) {
			console.error('Không thể lưu vị thuốc:', error);
			formError = 'Lưu chưa thành công. Vui lòng kiểm tra quyền ghi của collection PocketBase.';
		} finally {
			isSaving = false;
		}
	}

	async function deleteRemedy(remedy: Remedy) {
		if (!window.confirm(`Xóa “${remedy.name}” khỏi thư viện?`)) return;
		try {
			await pocketbase.collection(collectionName).delete(remedy.id);
			remedies = remedies.filter((item) => item.id !== remedy.id);
			errorMessage = '';
		} catch (error) {
			console.error('Không thể xóa vị thuốc:', error);
			errorMessage = 'Xóa chưa thành công. Vui lòng kiểm tra quyền xóa của collection PocketBase.';
		}
	}

	function formatDate(date: string) {
		return new Intl.DateTimeFormat('vi-VN', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		}).format(new Date(date));
	}
</script>

<svelte:head>
	<title>Thư viện thuốc nam</title>
	<meta name="description" content="Thư viện cây thuốc nam được cộng đồng ghi chép và quản lý." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Noto+Serif:ital,wght@0,500;0,600;1,400&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="library-shell">
	<AppSidebar activePage="library" />

	<main class="main-content">
		<header class="topbar">
			<div class="breadcrumb">Không gian cộng đồng <span>/</span> <strong>Thư viện</strong></div>
			<div class="connection"><span class="connection-dot"></span> PocketBase</div>
		</header>

		<section class="page-content">
			<div class="intro-row">
				<div>
					<div class="eyebrow">KHO TRI THỨC DÂN GIAN <span></span> {remedies.length} VỊ THUỐC</div>
					<h1>Thư viện thuốc nam</h1>
					<p class="intro-copy">Ghi chép, chia sẻ và cùng nhau gìn giữ những cây thuốc quanh ta.</p>
				</div>
				<button class="primary-button" onclick={openCreateDialog}>
					<span aria-hidden="true">＋</span> Thêm vị thuốc
				</button>
			</div>

			{#if errorMessage}
				<div class="alert" role="alert">
					<span>{errorMessage}</span>
					<button class="alert-retry" onclick={() => void loadRemedies()}>Thử lại</button>
				</div>
			{/if}

			<div class="toolbar">
				<label class="search-box">
					<span aria-hidden="true">⌕</span>
					<input bind:value={searchQuery} type="search" placeholder="Tìm tên cây, công dụng..." />
					<kbd>/</kbd>
				</label>
				<div class="result-count">{visibleRemedies.length} kết quả</div>
			</div>

			<div class="library-layout">
				<aside class="filters" aria-label="Lọc theo nhóm cây">
					<div class="filter-title">NHÓM CÂY</div>
					{#each categories as category (category)}
						<button
							class:chosen={activeCategory === category}
							class="filter-option"
							onclick={() => (activeCategory = category)}
						>
							<span>{category}</span><small>{categoryCounts[category] ?? 0}</small>
						</button>
					{/each}
					<div class="filter-note">
						<strong>Góp một trang mới</strong>
						<p>Mỗi ghi chép nhỏ đều giúp kho tri thức thêm phong phú.</p>
						<button onclick={openCreateDialog}>＋ Đóng góp</button>
					</div>
				</aside>

				<section class="results" aria-label="Danh sách vị thuốc">
					{#if isLoading}
						<div class="empty-state">
							<span class="loading-mark"></span>
							<p>Đang mở tủ thuốc...</p>
						</div>
					{:else if visibleRemedies.length === 0}
						<div class="empty-state">
							<span class="empty-mark" aria-hidden="true">✳</span>
							<h2>
								{remedies.length ? 'Chưa tìm thấy vị thuốc phù hợp' : 'Trang đầu tiên đang chờ bạn'}
							</h2>
							<p>
								{remedies.length
									? 'Thử đổi từ khóa hoặc chọn một nhóm cây khác.'
									: 'Thêm một ghi chép để bắt đầu xây dựng thư viện.'}
							</p>
							{#if !remedies.length}
								<button class="primary-button" onclick={openCreateDialog}>＋ Thêm vị thuốc</button>
							{/if}
						</div>
					{:else}
						<div class="remedy-grid">
							{#each visibleRemedies as remedy (remedy.id)}
								<article class="remedy-card">
									<div class="card-topline">
										<span class="category-tag">{remedy.category}</span>
										<div class="card-actions">
											<button
												aria-label={`Sửa ${remedy.name}`}
												title="Sửa ghi chép"
												onclick={() => openEditDialog(remedy)}>Sửa</button
											>
											<button
												class="delete-action"
												aria-label={`Xóa ${remedy.name}`}
												title="Xóa ghi chép"
												onclick={() => void deleteRemedy(remedy)}>Xóa</button
											>
										</div>
									</div>
									<h2>{remedy.name}</h2>
									{#if remedy.scientific_name}
										<div class="scientific-name">{remedy.scientific_name}</div>
									{/if}
									<p class="benefits">{remedy.benefits}</p>
									{#if remedy.parts_used}
										<div class="parts-used"><span>BỘ PHẬN DÙNG</span>{remedy.parts_used}</div>
									{/if}
									<div class="card-footer">
										<span>{remedy.author ? `Ghi bởi ${remedy.author}` : 'Ghi chép cộng đồng'}</span>
										<span>{formatDate(remedy.created)}</span>
									</div>
								</article>
							{/each}
						</div>
					{/if}
				</section>
			</div>
		</section>
	</main>
</div>

<dialog bind:this={dialogElement} onclose={resetDialog}>
	<form class="remedy-form" onsubmit={saveRemedy}>
		<div class="dialog-heading">
			<div>
				<div class="eyebrow">GHI CHÉP CỘNG ĐỒNG</div>
				<h2>{editingRemedy ? 'Cập nhật vị thuốc' : 'Thêm vị thuốc mới'}</h2>
			</div>
			<button
				class="close-button"
				type="button"
				aria-label="Đóng"
				onclick={() => dialogElement.close()}>×</button
			>
		</div>

		<div class="form-grid">
			<label class="wide-field"
				>Tên vị thuốc *
				<input bind:value={form.name} required maxlength="120" placeholder="Ví dụ: Tía tô" />
			</label>
			<label
				>Tên khoa học
				<input
					bind:value={form.scientific_name}
					maxlength="160"
					placeholder="Ví dụ: Perilla frutescens"
				/>
			</label>
			<label
				>Nhóm cây *
				<select bind:value={form.category} required>
					{#each categories.slice(1) as category (category)}<option value={category}
							>{category}</option
						>{/each}
				</select>
			</label>
			<label
				>Bộ phận sử dụng
				<input bind:value={form.parts_used} maxlength="200" placeholder="Lá, thân, rễ..." />
			</label>
			<label
				>Người ghi chép
				<input bind:value={form.author} maxlength="100" placeholder="Tên của bạn" />
			</label>
			<label class="wide-field"
				>Công dụng dân gian *
				<textarea
					bind:value={form.benefits}
					required
					maxlength="2000"
					rows="3"
					placeholder="Mô tả kinh nghiệm sử dụng dân gian..."></textarea>
			</label>
			<label class="wide-field"
				>Cách dùng
				<textarea
					bind:value={form.usage}
					maxlength="2000"
					rows="2"
					placeholder="Cách sơ chế, liều lượng theo kinh nghiệm..."></textarea>
			</label>
			<label class="wide-field"
				>Lưu ý an toàn
				<textarea
					bind:value={form.precautions}
					maxlength="2000"
					rows="2"
					placeholder="Đối tượng cần thận trọng hoặc lưu ý khác..."></textarea>
			</label>
		</div>

		<p class="form-disclaimer">
			Thông tin mang tính tham khảo dân gian, không thay thế tư vấn y tế chuyên môn.
		</p>
		{#if formError}<p class="form-error" role="alert">{formError}</p>{/if}
		<div class="form-actions">
			<button class="secondary-button" type="button" onclick={() => dialogElement.close()}
				>Hủy</button
			>
			<button class="primary-button" type="submit" disabled={isSaving}>
				{isSaving ? 'Đang lưu...' : editingRemedy ? 'Lưu thay đổi' : 'Thêm vào thư viện'}
			</button>
		</div>
	</form>
</dialog>

<style>
	:global(*) {
		box-sizing: border-box;
	}
	:global(body) {
		margin: 0;
		background: #f7f7f2;
		color: #242e26;
		font-family: 'Be Vietnam Pro', sans-serif;
	}
	:global(button),
	:global(input),
	:global(textarea),
	:global(select) {
		font: inherit;
	}
	.library-shell {
		min-height: 100vh;
		display: grid;
		grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
	}
	.filter-title,
	.filter-title {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 1px;
	}
	.main-content {
		min-width: 0;
	}
	.topbar {
		height: 64px;
		border-bottom: 1px solid #e8e7df;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 42px;
		background: rgb(255 255 255 / 0.48);
	}
	.breadcrumb {
		color: #8a918a;
		font-size: 12px;
	}
	.breadcrumb span {
		padding: 0 8px;
		color: #c2c4ba;
	}
	.breadcrumb strong {
		color: #34473b;
		font-weight: 600;
	}
	.connection {
		display: flex;
		align-items: center;
		gap: 7px;
		font-size: 11px;
		color: #727c72;
	}
	.connection-dot {
		width: 7px;
		height: 7px;
		background: #cb8d49;
		border-radius: 50%;
	}
	.page-content {
		max-width: 1440px;
		padding: 42px;
		margin: 0 auto;
	}
	.intro-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 24px;
		margin-bottom: 30px;
	}
	.eyebrow {
		color: #9c7751;
		font-size: 10px;
		letter-spacing: 1.1px;
		font-weight: 700;
	}
	.eyebrow span {
		display: inline-block;
		vertical-align: middle;
		margin: 0 8px;
		height: 3px;
		width: 3px;
		background: #c38e56;
		border-radius: 50%;
	}
	h1,
	h2 {
		font-family: 'Noto Serif', Georgia, serif;
		letter-spacing: 0;
	}
	h1 {
		margin: 10px 0 7px;
		font-size: 36px;
		line-height: 1.15;
		color: #263c31;
		font-weight: 500;
	}
	.intro-copy {
		color: #788178;
		margin: 0;
		font-size: 14px;
	}
	.primary-button {
		display: inline-flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
		border: 0;
		border-radius: 4px;
		background: #bd7446;
		color: white;
		min-height: 42px;
		padding: 0 16px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition:
			background 0.18s ease,
			transform 0.18s ease;
		white-space: nowrap;
	}
	.primary-button:hover {
		background: #a95f37;
		transform: translateY(-1px);
	}
	.primary-button:disabled {
		opacity: 0.65;
		cursor: wait;
		transform: none;
	}
	.primary-button span {
		font-size: 18px;
		line-height: 1;
	}
	.alert {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin: -10px 0 22px;
		padding: 12px 15px;
		background: #fff1e7;
		color: #874b2b;
		border-left: 3px solid #bd7446;
		font-size: 13px;
	}
	.alert-retry {
		border: 0;
		background: none;
		color: inherit;
		text-decoration: underline;
		cursor: pointer;
		white-space: nowrap;
	}
	.toolbar {
		display: flex;
		align-items: center;
		gap: 20px;
		border-top: 1px solid #e4e4db;
		padding-top: 19px;
		margin-bottom: 22px;
	}
	.search-box {
		flex: 1;
		max-width: 550px;
		height: 42px;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 11px;
		border: 1px solid #e2e2d9;
		background: #fff;
		border-radius: 4px;
		color: #849084;
	}
	.search-box > span {
		font-size: 24px;
		line-height: 1;
		transform: rotate(-20deg);
	}
	.search-box input {
		width: 100%;
		min-width: 0;
		border: 0;
		outline: 0;
		color: #34473b;
		font-size: 13px;
		background: transparent;
	}
	.search-box input::placeholder {
		color: #a2a89f;
	}
	.search-box kbd {
		font-size: 11px;
		border: 1px solid #e8e8e1;
		border-radius: 3px;
		padding: 2px 6px;
	}
	.result-count {
		font-size: 12px;
		color: #82877f;
	}
	.library-layout {
		display: grid;
		grid-template-columns: 190px minmax(0, 1fr);
		gap: 26px;
		align-items: start;
	}
	.filters {
		padding: 8px 0;
	}
	.filter-title {
		color: #879087;
		margin: 0 0 12px 10px;
	}
	.filter-option {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 9px 10px;
		border: 0;
		border-radius: 4px;
		color: #69746a;
		background: transparent;
		text-align: left;
		font-size: 12px;
		cursor: pointer;
	}
	.filter-option.chosen {
		color: #2f4b3b;
		background: #e8eee6;
		font-weight: 600;
	}
	.filter-option small {
		font-size: 10px;
		color: #9ba399;
	}
	.filter-note {
		margin: 31px 8px 0;
		padding-top: 17px;
		border-top: 1px solid #e3e4da;
	}
	.filter-note strong {
		font-family: 'Noto Serif', Georgia, serif;
		font-size: 15px;
		color: #3d5142;
		font-weight: 500;
	}
	.filter-note p {
		color: #899087;
		font-size: 11px;
		line-height: 1.6;
		margin: 7px 0 10px;
	}
	.filter-note button {
		border: 0;
		background: none;
		color: #a7623f;
		padding: 0;
		font-size: 11px;
		font-weight: 700;
		cursor: pointer;
	}
	.remedy-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 13px;
	}
	.remedy-card {
		min-width: 0;
		background: #fff;
		border: 1px solid #e9e8e0;
		border-radius: 5px;
		padding: 17px 18px 13px;
		transition:
			border-color 0.2s ease,
			transform 0.2s ease;
		animation: reveal 0.35s both;
	}
	.remedy-card:hover {
		border-color: #c7d1c1;
		transform: translateY(-2px);
	}
	.card-topline {
		min-height: 23px;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 8px;
	}
	.category-tag {
		border-radius: 3px;
		background: #f2eee3;
		color: #987344;
		padding: 4px 7px;
		font-size: 9px;
	}
	.card-actions {
		display: flex;
		gap: 3px;
	}
	.card-actions button {
		background: none;
		border: 0;
		color: #778178;
		padding: 3px 5px;
		font-size: 10px;
		cursor: pointer;
	}
	.card-actions button:hover {
		color: #a95f37;
	}
	.card-actions .delete-action {
		color: #aa7564;
	}
	.remedy-card h2 {
		margin: 13px 0 2px;
		color: #304739;
		font-size: 20px;
		line-height: 1.25;
		font-weight: 500;
		overflow-wrap: anywhere;
	}
	.scientific-name {
		color: #a0a39a;
		font-family: Georgia, serif;
		font-style: italic;
		font-size: 12px;
	}
	.benefits {
		color: #68736a;
		font-size: 12px;
		line-height: 1.65;
		margin: 12px 0;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		line-clamp: 3;
		-webkit-line-clamp: 3;
		overflow: hidden;
	}
	.parts-used {
		border-top: 1px solid #f0f0eb;
		padding-top: 10px;
		color: #59695b;
		font-size: 11px;
	}
	.parts-used span {
		display: block;
		color: #a0a69c;
		font-size: 8px;
		letter-spacing: 0.7px;
		margin-bottom: 4px;
	}
	.card-footer {
		border-top: 1px solid #f0f0eb;
		padding-top: 10px;
		margin-top: 11px;
		display: flex;
		justify-content: space-between;
		gap: 8px;
		color: #a0a49b;
		font-size: 9px;
	}
	.empty-state {
		min-height: 300px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		border: 1px dashed #d9ddd3;
		border-radius: 5px;
		padding: 28px;
	}
	.empty-mark {
		color: #bd8550;
		font-size: 26px;
	}
	.empty-state h2 {
		margin: 10px 0 4px;
		color: #3b4c40;
		font-size: 20px;
		font-weight: 500;
	}
	.empty-state p {
		color: #899087;
		font-size: 12px;
		margin: 0 0 17px;
	}
	.empty-state .primary-button {
		margin-top: 10px;
	}
	.loading-mark {
		height: 20px;
		width: 20px;
		border: 2px solid #e7e4d9;
		border-top-color: #bd7446;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	.empty-state:has(.loading-mark) p {
		margin-top: 12px;
	}
	dialog {
		width: min(620px, calc(100vw - 28px));
		max-height: min(90vh, 850px);
		padding: 0;
		border: 1px solid #e5e5dc;
		border-radius: 7px;
		color: #29392f;
		box-shadow: 0 18px 70px rgb(28 45 34 / 0.25);
	}
	dialog::backdrop {
		background: rgb(24 39 31 / 0.48);
		backdrop-filter: blur(2px);
	}
	.remedy-form {
		padding: 24px;
		overflow: auto;
		max-height: min(90vh, 850px);
	}
	.dialog-heading {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		border-bottom: 1px solid #e9e9e1;
		padding-bottom: 17px;
		margin-bottom: 17px;
	}
	.dialog-heading h2 {
		margin: 5px 0 0;
		font-size: 25px;
		font-weight: 500;
	}
	.close-button {
		background: none;
		border: 0;
		color: #7c857b;
		font-size: 25px;
		line-height: 1;
		cursor: pointer;
	}
	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 13px 14px;
	}
	.form-grid label {
		display: grid;
		gap: 6px;
		color: #59675c;
		font-size: 11px;
		font-weight: 600;
	}
	.form-grid .wide-field {
		grid-column: 1 / -1;
	}
	.form-grid input,
	.form-grid select,
	.form-grid textarea {
		min-width: 0;
		width: 100%;
		border: 1px solid #dedfd6;
		border-radius: 4px;
		padding: 9px 10px;
		background: #fff;
		color: #34473b;
		font-size: 12px;
		outline: none;
	}
	.form-grid textarea {
		resize: vertical;
		line-height: 1.5;
	}
	.form-grid input:focus,
	.form-grid select:focus,
	.form-grid textarea:focus {
		border-color: #8eaa8d;
		box-shadow: 0 0 0 2px rgb(142 170 141 / 0.15);
	}
	.form-disclaimer {
		color: #9a795a;
		background: #faf5ea;
		border-radius: 3px;
		padding: 9px 10px;
		font-size: 10px;
		line-height: 1.5;
		margin: 16px 0;
	}
	.form-error {
		color: #9a422f;
		font-size: 12px;
		margin: -6px 0 12px;
	}
	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}
	.secondary-button {
		border: 1px solid #dedfd6;
		border-radius: 4px;
		background: white;
		color: #677268;
		padding: 0 14px;
		min-height: 42px;
		font-size: 12px;
		cursor: pointer;
	}
	@keyframes reveal {
		from {
			opacity: 0;
			transform: translateY(5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 1000px) {
		.page-content {
			padding: 32px 25px;
		}
		.topbar {
			padding: 0 25px;
		}
		.library-layout {
			grid-template-columns: 160px minmax(0, 1fr);
			gap: 18px;
		}
		.remedy-grid {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 700px) {
		.library-shell {
			display: block;
		}
		.topbar {
			height: 48px;
			padding: 0 17px;
		}
		.page-content {
			padding: 28px 17px;
		}
		.intro-row {
			align-items: flex-start;
			flex-direction: column;
			gap: 17px;
			margin-bottom: 23px;
		}
		h1 {
			font-size: 30px;
		}
		.intro-copy {
			max-width: 400px;
			font-size: 13px;
			line-height: 1.5;
		}
		.toolbar {
			gap: 10px;
		}
		.search-box {
			height: 40px;
		}
		.search-box kbd {
			display: none;
		}
		.library-layout {
			display: block;
		}
		.filters {
			display: flex;
			overflow-x: auto;
			gap: 5px;
			padding: 0 0 15px;
		}
		.filter-title,
		.filter-note {
			display: none;
		}
		.filter-option {
			width: auto;
			flex: 0 0 auto;
			gap: 7px;
			border: 1px solid #e5e5dc;
			background: #fff;
			padding: 7px 9px;
		}
		.filter-option.chosen {
			border-color: #c8d3c4;
		}
		.remedy-grid {
			grid-template-columns: 1fr;
			gap: 10px;
		}
		.remedy-card {
			padding: 15px;
		}
		.form-grid {
			grid-template-columns: 1fr;
		}
		.form-grid .wide-field {
			grid-column: auto;
		}
		.remedy-form {
			padding: 19px;
		}
		.dialog-heading h2 {
			font-size: 22px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		*,
		*::before,
		*::after {
			scroll-behavior: auto !important;
			animation-duration: 0.01ms !important;
			transition-duration: 0.01ms !important;
		}
	}
</style>
