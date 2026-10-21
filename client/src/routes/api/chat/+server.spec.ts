import { afterEach, expect, it, vi } from 'vitest';
import { POST } from './+server';

afterEach(() => {
	vi.unstubAllGlobals();
});

it('rejects valid JSON values that are not request objects', async () => {
	const response = await POST({
		request: new Request('http://localhost/api/chat', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: 'null'
		})
	} as unknown as Parameters<typeof POST>[0]);

	expect(response.status).toBe(400);
	expect(await response.json()).toMatchObject({
		error: 'Nội dung gửi lên phải là một đối tượng JSON.'
	});
});

it('retrieves matching PocketBase records and includes them as OpenRouter context', async () => {
	let openRouterPayload: { messages: Array<{ role: string; content: string }> } | undefined;
	vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit) => {
		const url = String(input);
		if (url.includes('/api/collections/thuoc_nam/records')) {
			return Response.json({
				items: [
					{
						id: 'tiaso12345678901',
						name: 'Tía tô',
						scientific_name: 'Perilla frutescens',
						category: 'Cây thân thảo',
						benefits: 'Kinh nghiệm dân gian dùng khi cảm lạnh.'
					},
					{
						id: 'gunggung12345678',
						name: 'Gừng',
						category: 'Thân gỗ',
						benefits: 'Dùng trong trà ấm.'
					}
				]
			});
		}
		openRouterPayload = JSON.parse(String(init?.body));
		return Response.json({
			choices: [{ message: { content: 'Thư viện có ghi chép về tía tô.' } }]
		});
	});

	const response = await POST({
		request: new Request('http://localhost/api/chat', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ message: 'Tía tô có công dụng nào khi cảm lạnh?' })
		}),
		platform: { env: { OPENROUTER_API_KEY: 'test-key' } }
	} as unknown as Parameters<typeof POST>[0]);

	const result = (await response.json()) as {
		answer: string;
		sources: Array<{ name: string }>;
	};
	const systemMessage = openRouterPayload?.messages[0]?.content ?? '';

	expect(response.status).toBe(200);
	expect(result.answer).toContain('tía tô');
	expect(result.sources.map((source: { name: string }) => source.name)).toEqual(['Tía tô']);
	expect(systemMessage).toContain('Perilla frutescens');
	expect(systemMessage).not.toContain('Gừng');
});
