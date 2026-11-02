import { beforeEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import AppSidebar from './AppSidebar.svelte';

const navigation = vi.hoisted(() => ({
	goto: vi.fn(),
	resolve: vi.fn((path: string) => path)
}));

vi.mock('$app/navigation', () => ({ goto: navigation.goto }));
vi.mock('$app/paths', () => ({ resolve: navigation.resolve }));

function renderSidebar(activePage: 'chat' | 'library' = 'chat', onNewChat?: () => void) {
	render(AppSidebar, { activePage, onNewChat });
}

beforeEach(() => {
	vi.clearAllMocks();
});

it('renders the Herboto brand', async () => {
	renderSidebar();
	await expect
		.element(page.getByRole('link', { name: 'Herboto, trang chủ' }))
		.toHaveTextContent('herboto');
});

it('links the brand to the home page', async () => {
	renderSidebar();
	await expect
		.element(page.getByRole('link', { name: 'Herboto, trang chủ' }))
		.toHaveAttribute('href', '/');
});

it('exposes the primary navigation landmark', async () => {
	renderSidebar();
	await expect
		.element(page.getByRole('navigation', { name: 'Điều hướng chính' }))
		.toBeInTheDocument();
});

it('links the chat navigation item to home', async () => {
	renderSidebar();
	await expect
		.element(page.getByRole('link', { name: 'Trò chuyện AI' }))
		.toHaveAttribute('href', '/');
});

it('links the library shortcut to the library page', async () => {
	renderSidebar();
	await expect
		.element(page.getByRole('link', { name: 'Mở thư viện thuốc' }))
		.toHaveAttribute('href', '/thuvien');
});

it('gives the library shortcut a useful accessible name', async () => {
	renderSidebar();
	await expect
		.element(page.getByRole('link', { name: 'Mở thư viện thuốc' }))
		.toHaveAttribute('title', 'Thư viện thuốc');
});

it('marks chat as current when the chat page is active', async () => {
	renderSidebar('chat');
	await expect
		.element(page.getByRole('link', { name: 'Trò chuyện AI' }))
		.toHaveAttribute('aria-current', 'page');
});

it('styles chat as active on the chat page', async () => {
	renderSidebar('chat');
	await expect.element(page.getByRole('link', { name: 'Trò chuyện AI' })).toHaveClass(/active/);
});

it('marks the library shortcut as current on the library page', async () => {
	renderSidebar('library');
	await expect
		.element(page.getByRole('link', { name: 'Mở thư viện thuốc' }))
		.toHaveAttribute('aria-current', 'page');
});

it('styles the library shortcut as active on the library page', async () => {
	renderSidebar('library');
	await expect.element(page.getByRole('link', { name: 'Mở thư viện thuốc' })).toHaveClass(/active/);
});

it('does not mark chat as current on the library page', async () => {
	renderSidebar('library');
	await expect
		.element(page.getByRole('link', { name: 'Trò chuyện AI' }))
		.not.toHaveAttribute('aria-current', 'page');
});

it('does not mark library as current on the chat page', async () => {
	renderSidebar('chat');
	await expect
		.element(page.getByRole('link', { name: 'Mở thư viện thuốc' }))
		.not.toHaveAttribute('aria-current', 'page');
});

it('calls the provided new-chat callback', async () => {
	const onNewChat = vi.fn();
	renderSidebar('chat', onNewChat);
	await page.getByRole('button', { name: 'Cuộc trò chuyện mới' }).click();
	expect(onNewChat).toHaveBeenCalledOnce();
});

it('uses the callback instead of navigating when starting a new chat', async () => {
	const onNewChat = vi.fn();
	renderSidebar('chat', onNewChat);
	await page.getByRole('button', { name: 'Cuộc trò chuyện mới' }).click();
	expect(navigation.goto).not.toHaveBeenCalled();
});

it('navigates home when starting a new chat without a callback', async () => {
	renderSidebar('library');
	await page.getByRole('button', { name: 'Cuộc trò chuyện mới' }).click();
	expect(navigation.resolve).toHaveBeenCalledWith('/');
	expect(navigation.goto).toHaveBeenCalledWith('/');
});

it('renders the community knowledge note', async () => {
	renderSidebar();
	await expect.element(page.getByText(/Tri thức cây thuốc/)).toBeInTheDocument();
});
