import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import LibraryPage from './+page.svelte';

const pocketbase = vi.hoisted(() => ({
	collection: vi.fn(),
	getFullList: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn()
}));

vi.mock('pocketbase', () => ({
	default: class {
		collection(name: string) {
			pocketbase.collection(name);
			return {
				getFullList: pocketbase.getFullList,
				create: pocketbase.create,
				update: pocketbase.update,
				delete: pocketbase.delete
			};
		}
	}
}));

type TestRemedy = {
	id: string;
	name: string;
	scientific_name: string;
	category: string;
	parts_used: string;
	benefits: string;
	usage: string;
	precautions: string;
	author: string;
	created: string;
};

function makeRemedy(overrides: Partial<TestRemedy> = {}): TestRemedy {
	return {
		id: 'remedy-1',
		name: 'Tía tô',
		scientific_name: 'Perilla frutescens',
		category: 'Cây thân thảo',
		parts_used: 'Lá',
		benefits: 'Hỗ trợ giải cảm theo kinh nghiệm dân gian',
		usage: 'Hãm trà',
		precautions: 'Thận trọng khi sử dụng',
		author: 'An',
		created: '2025-01-02T00:00:00.000Z',
		...overrides
	};
}

function renderPage() {
	render(LibraryPage);
}

async function expectEmptyLibrary(name = 'thuốc nam') {
	await expect
		.element(page.getByRole('heading', { name: `Chưa có ghi chép trong thư viện ${name}` }))
		.toBeInTheDocument();
}

beforeEach(() => {
	pocketbase.collection.mockReset();
	pocketbase.getFullList.mockReset().mockResolvedValue([]);
	pocketbase.create.mockReset().mockResolvedValue({ id: 'remedy-new' });
	pocketbase.update.mockReset().mockResolvedValue({ id: 'remedy-1' });
	pocketbase.delete.mockReset().mockResolvedValue(undefined);
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

it('renders the default library and fetches thuốc nam records', async () => {
	renderPage();

	await expect
		.element(page.getByRole('heading', { level: 1 }))
		.toHaveTextContent('Thư viện thuốc nam');
	await expectEmptyLibrary();
	expect(pocketbase.collection).toHaveBeenCalledWith('thuoc_nam');
});

it('shows a loading state while records are being fetched', async () => {
	let resolveRecords!: (records: TestRemedy[]) => void;
	pocketbase.getFullList.mockReturnValue(
		new Promise<TestRemedy[]>((resolve) => {
			resolveRecords = resolve;
		})
	);
	renderPage();

	await expect.element(page.getByText('Đang tải thư viện...')).toBeInTheDocument();
	resolveRecords([]);
	await expectEmptyLibrary();
});

it('marks only thuốc nam as the initially selected library', async () => {
	renderPage();

	await expect
		.element(page.getByRole('button', { name: 'Thuốc nam' }))
		.toHaveAttribute('aria-pressed', 'true');
	await expect
		.element(page.getByRole('button', { name: 'Thuốc bắc', exact: true }))
		.toHaveAttribute('aria-pressed', 'false');
	await expect
		.element(page.getByRole('button', { name: 'Thuốc tây' }))
		.toHaveAttribute('aria-pressed', 'false');
});

it('switches to thuốc bắc and loads its collection', async () => {
	renderPage();
	await page.getByRole('button', { name: 'Thuốc bắc' }).click();

	await expectEmptyLibrary('thuốc bắc');
	expect(pocketbase.collection).toHaveBeenLastCalledWith('thuoc_bac');
	await expect
		.element(page.getByRole('button', { name: 'Thuốc bắc', exact: true }))
		.toHaveAttribute('aria-pressed', 'true');
});

it('shows thuốc bắc categories', async () => {
	renderPage();
	await page.getByRole('button', { name: 'Thuốc bắc' }).click();
	await expectEmptyLibrary('thuốc bắc');

	for (const category of ['Vị thuốc', 'Bài thuốc', 'Dược liệu', 'Khác']) {
		await expect
			.element(page.getByRole('button', { name: new RegExp(category) }))
			.toBeInTheDocument();
	}
});

it('switches to thuốc tây and loads its collection', async () => {
	renderPage();
	await page.getByRole('button', { name: 'Thuốc tây' }).click();

	await expectEmptyLibrary('thuốc tây');
	expect(pocketbase.collection).toHaveBeenLastCalledWith('thuoc_tay');
	await expect
		.element(page.getByRole('heading', { level: 1 }))
		.toHaveTextContent('Thư viện thuốc tây');
});

it('shows thuốc tây categories', async () => {
	renderPage();
	await page.getByRole('button', { name: 'Thuốc tây' }).click();
	await expectEmptyLibrary('thuốc tây');

	for (const category of ['Giảm đau', 'Kháng sinh', 'Tim mạch', 'Tiêu hóa', 'Hô hấp', 'Khác']) {
		await expect
			.element(page.getByRole('button', { name: new RegExp(category) }))
			.toBeInTheDocument();
	}
});

it('resets the category filter when switching libraries', async () => {
	pocketbase.getFullList.mockResolvedValue([makeRemedy()]);
	renderPage();
	await page.getByRole('button', { name: /Cây thân thảo/ }).click();
	await page.getByRole('button', { name: 'Thuốc bắc' }).click();
	await expect.element(page.getByRole('button', { name: /Tất cả/ })).toHaveClass(/chosen/);
});

it('clears the search query when switching libraries', async () => {
	pocketbase.getFullList.mockResolvedValue([makeRemedy()]);
	renderPage();
	await page.getByRole('searchbox').fill('Tía tô');
	await page.getByRole('button', { name: 'Thuốc tây' }).click();

	await expect.element(page.getByRole('searchbox')).toHaveValue('');
	await expect.element(page.getByRole('heading', { name: 'Tía tô' })).toBeInTheDocument();
});

it('filters records by the selected category', async () => {
	pocketbase.getFullList.mockResolvedValue([
		makeRemedy(),
		makeRemedy({ id: 'remedy-2', name: 'Gừng', category: 'Thân gỗ' })
	]);
	renderPage();
	await expect.element(page.getByRole('heading', { name: 'Gừng' })).toBeInTheDocument();
	await page.getByRole('button', { name: /Cây thân thảo/ }).click();

	await expect.element(page.getByRole('heading', { name: 'Tía tô' })).toBeInTheDocument();
	await expect.element(page.getByRole('heading', { name: 'Gừng' })).not.toBeInTheDocument();
});

it('shows record counts beside categories', async () => {
	pocketbase.getFullList.mockResolvedValue([
		makeRemedy(),
		makeRemedy({ id: 'remedy-2', name: 'Gừng', category: 'Thân gỗ' })
	]);
	renderPage();

	await expect.element(page.getByRole('button', { name: /Tất cả/ })).toHaveTextContent('2');
	await expect.element(page.getByRole('button', { name: /Cây thân thảo/ })).toHaveTextContent('1');
});

it('renders remedy details on a result card', async () => {
	pocketbase.getFullList.mockResolvedValue([makeRemedy()]);
	renderPage();

	await expect.element(page.getByRole('heading', { name: 'Tía tô' })).toBeInTheDocument();
	await expect.element(page.getByText('Perilla frutescens')).toBeInTheDocument();
	await expect.element(page.getByText('Lá')).toBeInTheDocument();
	await expect
		.element(page.getByText('Hỗ trợ giải cảm theo kinh nghiệm dân gian'))
		.toBeInTheDocument();
});

it('formats dates and shows an author fallback', async () => {
	pocketbase.getFullList.mockResolvedValue([
		makeRemedy({ author: '' }),
		makeRemedy({ id: 'remedy-2', name: 'Gừng', author: 'Bình' })
	]);
	renderPage();

	await expect.element(page.getByText('Ghi chép cộng đồng')).toBeInTheDocument();
	await expect.element(page.getByText('Ghi bởi Bình')).toBeInTheDocument();
	await expect.element(page.getByText('02/01/2025').first()).toBeInTheDocument();
});

it.each([
	{ field: 'name', query: 'Tía tô' },
	{ field: 'scientific name', query: 'Perilla frutescens' },
	{ field: 'category', query: 'Cây thân thảo' },
	{ field: 'parts used', query: 'Lá' },
	{ field: 'benefits', query: 'giải cảm' },
	{ field: 'usage', query: 'Hãm trà' },
	{ field: 'precautions', query: 'Thận trọng' }
])('searches remedy $field', async ({ query }) => {
	pocketbase.getFullList.mockResolvedValue([makeRemedy()]);
	renderPage();
	await page.getByRole('searchbox').fill(query);

	await expect.element(page.getByRole('heading', { name: 'Tía tô' })).toBeInTheDocument();
});

it('trims search text and ignores Vietnamese letter case', async () => {
	pocketbase.getFullList.mockResolvedValue([makeRemedy()]);
	renderPage();
	await page.getByRole('searchbox').fill('  TÍA TÔ  ');

	await expect.element(page.getByRole('heading', { name: 'Tía tô' })).toBeInTheDocument();
});

it('shows all records again when the search is cleared', async () => {
	pocketbase.getFullList.mockResolvedValue([
		makeRemedy(),
		makeRemedy({ id: 'remedy-2', name: 'Gừng' })
	]);
	renderPage();
	const search = page.getByRole('searchbox');
	await search.fill('Tía tô');
	await expect.element(page.getByRole('heading', { name: 'Gừng' })).not.toBeInTheDocument();
	await search.fill('');

	await expect.element(page.getByRole('heading', { name: 'Gừng' })).toBeInTheDocument();
});

it.each([
	{ status: 403, message: 'PocketBase từ chối đọc collection thuoc_nam' },
	{ status: 404, message: 'Không tìm thấy collection thuoc_nam' },
	{
		status: 0,
		message: 'Không truy cập được PocketBase. Hãy kiểm tra máy chủ và URL'
	}
])('shows a useful load error for status $status', async ({ status, message }) => {
	pocketbase.getFullList.mockRejectedValue({ status });
	renderPage();

	await expect.element(page.getByRole('alert')).toHaveTextContent(message);
});

it('uses library-specific labels, disclaimers, and default categories in forms', async () => {
	renderPage();
	await expectEmptyLibrary();

	const configurations = [
		{
			tab: 'Thuốc nam',
			library: 'thuốc nam',
			item: 'vị thuốc',
			field: 'Công dụng dân gian',
			category: 'Cây thân thảo',
			disclaimer: /tham khảo dân gian/
		},
		{
			tab: 'Thuốc bắc',
			library: 'thuốc bắc',
			item: 'vị thuốc bắc',
			field: 'Công dụng theo y học cổ truyền',
			category: 'Vị thuốc',
			disclaimer: /Thông tin chỉ mang tính tham khảo/
		},
		{
			tab: 'Thuốc tây',
			library: 'thuốc tây',
			item: 'thuốc tây',
			field: 'Chỉ định / công dụng',
			category: 'Giảm đau',
			disclaimer: /không thay thế hướng dẫn của bác sĩ hoặc dược sĩ/
		}
	];

	for (const config of configurations) {
		if (config.tab !== 'Thuốc nam') {
			await page.getByRole('button', { name: config.tab }).click();
			await expectEmptyLibrary(config.library);
		}
		await page.getByRole('button', { name: `Thêm ${config.item}`, exact: true }).click();
		await expect
			.element(page.getByRole('heading', { name: `Thêm ${config.item} mới` }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('textbox', { name: new RegExp(config.field) }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('combobox')).toHaveValue(config.category);
		await expect.element(page.getByText(config.disclaimer)).toBeInTheDocument();
		await page.getByRole('button', { name: 'Hủy' }).click();
	}
});

it('creates a record in the selected library and reloads the list', async () => {
	const savedRemedy = makeRemedy({ id: 'remedy-new', name: 'Bạc hà' });
	pocketbase.getFullList
		.mockResolvedValueOnce([])
		.mockResolvedValueOnce([])
		.mockResolvedValueOnce([savedRemedy]);
	pocketbase.create.mockResolvedValue(savedRemedy);
	renderPage();
	await expectEmptyLibrary();
	await page.getByRole('button', { name: 'Thuốc bắc' }).click();
	await expectEmptyLibrary('thuốc bắc');
	await page.getByRole('button', { name: 'Thêm vị thuốc bắc', exact: true }).click();
	await page.getByRole('textbox', { name: /Tên vị thuốc bắc/ }).fill('Bạc hà');
	await page
		.getByRole('textbox', { name: /Công dụng theo y học cổ truyền/ })
		.fill('Ghi chép tham khảo');
	await page.getByRole('button', { name: 'Thêm vào thư viện' }).click();

	await expect.element(page.getByRole('heading', { name: 'Bạc hà' })).toBeInTheDocument();
	expect(pocketbase.collection).toHaveBeenLastCalledWith('thuoc_bac');
	expect(pocketbase.create).toHaveBeenCalledWith(
		expect.objectContaining({
			name: 'Bạc hà',
			category: 'Vị thuốc',
			benefits: 'Ghi chép tham khảo'
		})
	);
	expect(pocketbase.getFullList).toHaveBeenCalledTimes(3);
});

it('shows a form error when saving a record fails', async () => {
	pocketbase.create.mockRejectedValue(new Error('write failed'));
	renderPage();
	await expectEmptyLibrary();
	await page.getByRole('button', { name: 'Thêm vị thuốc', exact: true }).click();
	await page.getByRole('textbox', { name: /Tên vị thuốc/ }).fill('Tía tô');
	await page.getByRole('textbox', { name: /Công dụng dân gian/ }).fill('Ghi chép tham khảo');
	await page.getByRole('button', { name: 'Thêm vào thư viện' }).click();

	await expect.element(page.getByRole('alert')).toHaveTextContent('Lưu chưa thành công');
});

it('prefills the edit form and updates the selected record', async () => {
	pocketbase.getFullList.mockResolvedValue([makeRemedy()]);
	renderPage();
	await page.getByRole('button', { name: 'Sửa Tía tô' }).click();
	await expect
		.element(page.getByRole('heading', { name: 'Cập nhật vị thuốc' }))
		.toBeInTheDocument();
	await expect.element(page.getByRole('textbox', { name: /Tên vị thuốc/ })).toHaveValue('Tía tô');
	await page.getByRole('textbox', { name: /Công dụng dân gian/ }).fill('Công dụng đã cập nhật');
	await page.getByRole('button', { name: 'Lưu thay đổi' }).click();

	expect(pocketbase.update).toHaveBeenCalledWith(
		'remedy-1',
		expect.objectContaining({ benefits: 'Công dụng đã cập nhật' })
	);
	expect(pocketbase.collection).toHaveBeenLastCalledWith('thuoc_nam');
});

it('supports cancelling, confirming, and handling failed deletes', async () => {
	pocketbase.getFullList.mockResolvedValue([
		makeRemedy(),
		makeRemedy({ id: 'remedy-2', name: 'Gừng' })
	]);
	pocketbase.delete
		.mockResolvedValueOnce(undefined)
		.mockRejectedValueOnce(new Error('delete failed'));
	const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
	renderPage();
	await expect.element(page.getByRole('heading', { name: 'Tía tô' })).toBeInTheDocument();
	await page.getByRole('button', { name: 'Xóa Tía tô' }).click();
	expect(confirm).toHaveBeenCalled();
	expect(pocketbase.delete).not.toHaveBeenCalled();
	await expect.element(page.getByRole('heading', { name: 'Tía tô' })).toBeInTheDocument();

	confirm.mockReturnValue(true);
	await page.getByRole('button', { name: 'Xóa Tía tô' }).click();
	await expect.element(page.getByRole('heading', { name: 'Tía tô' })).not.toBeInTheDocument();
	await page.getByRole('button', { name: 'Xóa Gừng' }).click();
	await expect.element(page.getByRole('alert')).toHaveTextContent('Xóa chưa thành công');
	await expect.element(page.getByRole('heading', { name: 'Gừng' })).toBeInTheDocument();
});
