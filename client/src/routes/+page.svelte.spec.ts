import { afterEach, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ChatPage from './+page.svelte';

afterEach(() => {
	vi.unstubAllGlobals();
});

it('does not show a previous response in a newly started conversation', async () => {
	let resolveFetch!: (response: Response) => void;
	vi.stubGlobal(
		'fetch',
		() =>
			new Promise<Response>((resolve) => {
				resolveFetch = resolve;
			})
	);
	render(ChatPage);

	await page.getByRole('button', { name: /Cây thuốc nào/ }).click();
	await page.getByRole('button', { name: 'Cuộc trò chuyện mới' }).click();

	resolveFetch(Response.json({ answer: 'Phản hồi của cuộc trò chuyện cũ.' }));
	await new Promise((resolve) => setTimeout(resolve, 0));

	await expect.element(page.getByText('Cùng tìm hiểu')).toBeInTheDocument();
	await expect.element(page.getByText('Phản hồi của cuộc trò chuyện cũ.')).not.toBeInTheDocument();
});

it('renders the welcome view, suggestions, and medical disclaimer', async () => {
	render(ChatPage);

	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Cùng tìm hiểu');
	await expect.element(page.getByRole('button', { name: /Cây thuốc nào/ })).toBeInTheDocument();
	await expect.element(page.getByText(/không thay thế tư vấn y tế chuyên môn/)).toBeInTheDocument();
	await expect
		.element(page.getByRole('link', { name: /Thư viện/ }))
		.toHaveAttribute('href', '/thuvien');
});

it.each([
	'Cây thuốc nào trong thư viện thường được dùng khi bị ho?',
	'Tía tô có những công dụng dân gian nào?',
	'Tôi nên lưu ý gì khi tìm hiểu cách dùng thuốc nam?'
])('sends the suggested question "%s"', async (suggestion) => {
	const fetchMock = vi.fn().mockResolvedValue(Response.json({ answer: 'Câu trả lời tham khảo.' }));
	vi.stubGlobal('fetch', fetchMock);
	render(ChatPage);
	await page.getByRole('button', { name: suggestion }).click();

	await expect.element(page.getByText('Câu trả lời tham khảo.')).toBeInTheDocument();
	expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ message: suggestion });
});

it('submits a typed question and renders the user and assistant messages', async () => {
	const fetchMock = vi
		.fn()
		.mockResolvedValue(Response.json({ answer: 'Hãy hỏi chuyên gia y tế.' }));
	vi.stubGlobal('fetch', fetchMock);
	render(ChatPage);
	await page
		.getByRole('textbox', { name: 'Nhập câu hỏi về thuốc nam' })
		.fill('Tía tô có công dụng gì?');
	await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();

	await expect.element(page.getByText('Tía tô có công dụng gì?')).toBeInTheDocument();
	await expect.element(page.getByText('Hãy hỏi chuyên gia y tế.')).toBeInTheDocument();
	expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
		message: 'Tía tô có công dụng gì?',
		history: []
	});
});

it('trims whitespace from a typed question before sending', async () => {
	const fetchMock = vi.fn().mockResolvedValue(Response.json({ answer: 'Đã nhận câu hỏi.' }));
	vi.stubGlobal('fetch', fetchMock);
	render(ChatPage);
	await page.getByRole('textbox', { name: 'Nhập câu hỏi về thuốc nam' }).fill('  Tía tô  ');
	await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();

	await expect.element(page.getByText('Đã nhận câu hỏi.')).toBeInTheDocument();
	expect(JSON.parse(fetchMock.mock.calls[0][1].body).message).toBe('Tía tô');
});

it('does not send an empty or whitespace-only question', async () => {
	const fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
	render(ChatPage);
	const composer = page.getByRole('textbox', { name: 'Nhập câu hỏi về thuốc nam' });
	await expect.element(page.getByRole('button', { name: 'Gửi câu hỏi' })).toBeDisabled();
	await composer.fill('   ');
	await expect.element(page.getByRole('button', { name: 'Gửi câu hỏi' })).toBeDisabled();
	expect(fetchMock).not.toHaveBeenCalled();
});

it('shows the pending indicator and prevents duplicate submissions', async () => {
	let resolveFetch!: (response: Response) => void;
	const fetchMock = vi.fn(
		() =>
			new Promise<Response>((resolve) => {
				resolveFetch = resolve;
			})
	);
	vi.stubGlobal('fetch', fetchMock);
	render(ChatPage);
	const composer = page.getByRole('textbox', { name: 'Nhập câu hỏi về thuốc nam' });
	await composer.fill('Câu hỏi đầu tiên');
	await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
	await expect.element(page.getByText('Đang đối chiếu thư viện...')).toBeInTheDocument();
	await expect.element(page.getByRole('button', { name: 'Gửi câu hỏi' })).toBeDisabled();
	await composer.fill('Câu hỏi thứ hai');
	await expect.element(page.getByRole('button', { name: 'Gửi câu hỏi' })).toBeDisabled();
	expect(fetchMock).toHaveBeenCalledOnce();
	resolveFetch(Response.json({ answer: 'Đã trả lời.' }));
	await expect.element(page.getByText('Đã trả lời.')).toBeInTheDocument();
});

it('submits the composer when Enter is pressed', async () => {
	const fetchMock = vi.fn().mockResolvedValue(Response.json({ answer: 'Đã gửi bằng Enter.' }));
	vi.stubGlobal('fetch', fetchMock);
	render(ChatPage);
	const composer = page.getByRole('textbox', { name: 'Nhập câu hỏi về thuốc nam' });
	await composer.fill('Hỏi bằng Enter');
	await userEvent.keyboard('{Enter}');

	await expect.element(page.getByText('Đã gửi bằng Enter.')).toBeInTheDocument();
	expect(fetchMock).toHaveBeenCalledOnce();
});

it('keeps Shift+Enter in the composer without submitting', async () => {
	const fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
	render(ChatPage);
	const composer = page.getByRole('textbox', { name: 'Nhập câu hỏi về thuốc nam' });
	await composer.fill('Dòng một');
	await userEvent.keyboard('{Shift>}{Enter}{/Shift}');

	await expect.element(page.getByRole('heading', { level: 1 })).toBeInTheDocument();
	expect(fetchMock).not.toHaveBeenCalled();
});

it('renders source links with their scientific name and category', async () => {
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue(
			Response.json({
				answer: 'Thông tin cần được đối chiếu.',
				sources: [
					{
						id: 'tia-so-1',
						name: 'Tía tô',
						scientific_name: 'Perilla frutescens',
						category: 'Cây thân thảo'
					}
				]
			})
		)
	);
	render(ChatPage);
	await page.getByRole('textbox', { name: 'Nhập câu hỏi về thuốc nam' }).fill('Tía tô');
	await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();

	const source = page.getByRole('link', { name: /Tía tô/ });
	await expect.element(source).toHaveAttribute('href', '/thuvien');
	await expect.element(source).toHaveTextContent('Perilla frutescens');
	await expect.element(source).toHaveTextContent('Cây thân thảo');
});

it('renders a valid answer when the API returns no sources', async () => {
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue(Response.json({ answer: 'Chưa có nguồn phù hợp.' }))
	);
	render(ChatPage);
	await page.getByRole('textbox', { name: 'Nhập câu hỏi về thuốc nam' }).fill('Câu hỏi thử');
	await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();

	await expect.element(page.getByText('Chưa có nguồn phù hợp.')).toBeInTheDocument();
	await expect.element(page.getByText('NGUỒN TRONG THƯ VIỆN')).not.toBeInTheDocument();
});

it('shows the API error message for a non-success response', async () => {
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue(Response.json({ error: 'Hãy thử lại sau.' }, { status: 503 }))
	);
	render(ChatPage);
	await page.getByRole('textbox', { name: 'Nhập câu hỏi về thuốc nam' }).fill('Câu hỏi thử');
	await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();

	await expect.element(page.getByRole('alert')).toHaveTextContent('Hãy thử lại sau.');
});

it('uses a fallback message when a failed response has no error', async () => {
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({}, { status: 500 })));
	render(ChatPage);
	await page.getByRole('textbox', { name: 'Nhập câu hỏi về thuốc nam' }).fill('Câu hỏi thử');
	await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();

	await expect.element(page.getByRole('alert')).toHaveTextContent('Chưa gửi được câu hỏi');
});

it('shows an error when the API response is not valid JSON', async () => {
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('không phải JSON')));
	render(ChatPage);
	await page.getByRole('textbox', { name: 'Nhập câu hỏi về thuốc nam' }).fill('Câu hỏi thử');
	await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();

	await expect.element(page.getByRole('alert')).toBeInTheDocument();
});

it('rejects a response with an empty answer', async () => {
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ answer: '  ' })));
	render(ChatPage);
	await page.getByRole('textbox', { name: 'Nhập câu hỏi về thuốc nam' }).fill('Câu hỏi thử');
	await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();

	await expect
		.element(page.getByRole('alert'))
		.toHaveTextContent('Trợ lý trả về nội dung không hợp lệ');
});

it('shows a useful error when the network request rejects', async () => {
	vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
	render(ChatPage);
	await page.getByRole('textbox', { name: 'Nhập câu hỏi về thuốc nam' }).fill('Câu hỏi thử');
	await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();

	await expect.element(page.getByRole('alert')).toHaveTextContent('offline');
});

it('sends earlier user and assistant turns as chat history', async () => {
	const fetchMock = vi
		.fn()
		.mockResolvedValueOnce(Response.json({ answer: 'Câu trả lời đầu.' }))
		.mockResolvedValueOnce(Response.json({ answer: 'Câu trả lời tiếp.' }));
	vi.stubGlobal('fetch', fetchMock);
	render(ChatPage);
	const composer = page.getByRole('textbox', { name: 'Nhập câu hỏi về thuốc nam' });
	await composer.fill('Câu hỏi đầu');
	await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
	await expect.element(page.getByText('Câu trả lời đầu.')).toBeInTheDocument();
	await composer.fill('Câu hỏi tiếp');
	await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
	await expect.element(page.getByText('Câu trả lời tiếp.')).toBeInTheDocument();

	expect(JSON.parse(fetchMock.mock.calls[1][1].body).history).toEqual([
		{ role: 'user', content: 'Câu hỏi đầu' },
		{ role: 'assistant', content: 'Câu trả lời đầu.' }
	]);
});

it('starts a clean conversation after previous messages', async () => {
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ answer: 'Phản hồi cần xóa.' })));
	render(ChatPage);
	await page.getByRole('textbox', { name: 'Nhập câu hỏi về thuốc nam' }).fill('Câu cũ');
	await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
	await expect.element(page.getByText('Phản hồi cần xóa.')).toBeInTheDocument();
	await page.getByRole('button', { name: 'Cuộc trò chuyện mới' }).click();

	await expect.element(page.getByRole('heading', { level: 1 })).toBeInTheDocument();
	await expect.element(page.getByText('Phản hồi cần xóa.')).not.toBeInTheDocument();
	await expect
		.element(page.getByRole('textbox', { name: 'Nhập câu hỏi về thuốc nam' }))
		.toHaveValue('');
});

it('clears a request error when a later message succeeds', async () => {
	const fetchMock = vi
		.fn()
		.mockResolvedValueOnce(Response.json({ error: 'Thử lại nhé.' }, { status: 502 }))
		.mockResolvedValueOnce(Response.json({ answer: 'Đã kết nối lại.' }));
	vi.stubGlobal('fetch', fetchMock);
	render(ChatPage);
	const composer = page.getByRole('textbox', { name: 'Nhập câu hỏi về thuốc nam' });
	await composer.fill('Lần đầu');
	await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
	await expect.element(page.getByRole('alert')).toHaveTextContent('Thử lại nhé.');
	await composer.fill('Lần sau');
	await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();

	await expect.element(page.getByText('Đã kết nối lại.')).toBeInTheDocument();
	await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
});
