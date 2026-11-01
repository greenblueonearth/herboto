import { afterEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
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
