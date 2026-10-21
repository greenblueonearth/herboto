<script lang="ts">
	import { resolve } from '$app/paths';
	import AppSidebar from '#lib/components/AppSidebar.svelte';
	import { tick } from 'svelte';

	type Source = { id: string; name: string; scientific_name?: string; category: string };
	type ChatResponse = { answer?: string; sources?: Source[]; error?: string };
	type ChatMessage = {
		id: string;
		role: 'user' | 'assistant';
		content: string;
		sources?: Source[];
	};

	const suggestions = [
		'Cây thuốc nào trong thư viện thường được dùng khi bị ho?',
		'Tía tô có những công dụng dân gian nào?',
		'Tôi nên lưu ý gì khi tìm hiểu cách dùng thuốc nam?'
	];

	let messages = $state<ChatMessage[]>([]);
	let draft = $state('');
	let isSending = $state(false);
	let errorMessage = $state('');
	let conversationEnd = $state<HTMLDivElement>();

	$effect(() => {
		const messageCount = messages.length;
		const pending = isSending;
		if (messageCount || pending) {
			void tick().then(() => conversationEnd?.scrollIntoView({ behavior: 'smooth', block: 'end' }));
		}
	});

	function startNewConversation() {
		messages = [];
		errorMessage = '';
		draft = '';
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		void sendMessage();
	}

	function handleComposerKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			void sendMessage();
		}
	}

	async function sendMessage(suggestedMessage = draft) {
		const content = suggestedMessage.trim();
		if (!content || isSending) return;

		const history = messages.map(({ role, content: messageContent }) => ({
			role,
			content: messageContent
		}));
		messages.push({ id: crypto.randomUUID(), role: 'user', content });
		draft = '';
		isSending = true;
		errorMessage = '';

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ message: content, history })
			});
			const result = (await response.json()) as ChatResponse;
			if (!response.ok) throw new Error(result.error || 'Chưa gửi được câu hỏi. Vui lòng thử lại.');
			if (!result.answer) throw new Error('Trợ lý trả về nội dung không hợp lệ.');

			messages.push({
				id: crypto.randomUUID(),
				role: 'assistant',
				content: result.answer,
				sources: result.sources ?? []
			});
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Kết nối chưa ổn định. Vui lòng thử lại.';
		} finally {
			isSending = false;
		}
	}
</script>

<svelte:head>
	<title>Trò chuyện cùng Herboto</title>
	<meta
		name="description"
		content="Hỏi đáp về cây thuốc nam dựa trên thư viện tri thức cộng đồng của Herboto."
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Noto+Serif:ital,wght@0,500;0,600;1,400&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="chat-shell">
	<AppSidebar activePage="chat" onNewChat={startNewConversation} />

	<main class="chat-main">
		<header class="topbar">
			<div class="chat-mode">
				<span class="mode-dot"></span> Trợ lý thuốc nam <span class="mode-separator">·</span> RAG
			</div>
			<a class="library-shortcut" href={resolve('/thuvien')}
				>Thư viện <span aria-hidden="true">↗</span></a
			>
		</header>

		<section class="conversation" aria-label="Cuộc trò chuyện với Herboto">
			{#if messages.length === 0}
				<div class="welcome">
					<div class="welcome-symbol" aria-hidden="true">✳</div>
					<div class="eyebrow">TRI THỨC CỘNG ĐỒNG · HỎI ĐÁP CÓ NGUỒN</div>
					<h1>Cùng tìm hiểu<br />cây thuốc quanh ta.</h1>
					<p class="welcome-copy">
						Đặt câu hỏi về vị thuốc nam. Herboto sẽ tìm trong thư viện cộng đồng và dẫn nguồn ghi
						chép liên quan.
					</p>
					<div class="suggestions-label">BẮT ĐẦU VỚI MỘT CÂU HỎI</div>
					<div class="suggestions">
						{#each suggestions as suggestion (suggestion)}
							<button class="suggestion" onclick={() => void sendMessage(suggestion)}>
								<span aria-hidden="true">↗</span>{suggestion}
							</button>
						{/each}
					</div>
				</div>
			{:else}
				<div class="message-list">
					{#each messages as message (message.id)}
						<article class:from-user={message.role === 'user'} class="message">
							{#if message.role === 'assistant'}
								<div class="assistant-mark" aria-hidden="true">H</div>
							{/if}
							<div class="message-body">
								<div class="message-author">{message.role === 'user' ? 'Bạn' : 'Herboto'}</div>
								<div class="message-text">{message.content}</div>
								{#if message.sources?.length}
									<div class="sources">
										<div class="sources-title">NGUỒN TRONG THƯ VIỆN</div>
										{#each message.sources as source (source.id)}
											<a class="source-link" href={resolve('/thuvien')}>
												<span>{source.name}</span>
												{#if source.scientific_name}<em>{source.scientific_name}</em>{/if}
												<small>{source.category}</small>
											</a>
										{/each}
									</div>
								{/if}
							</div>
						</article>
					{/each}
					{#if isSending}
						<div class="thinking">
							<span></span><span></span><span></span><small>Đang đối chiếu thư viện...</small>
						</div>
					{/if}
					<div bind:this={conversationEnd}></div>
				</div>
			{/if}
		</section>

		<div class="composer-wrap">
			{#if errorMessage}<div class="request-error" role="alert">{errorMessage}</div>{/if}
			<form class="composer" onsubmit={handleSubmit}>
				<textarea
					bind:value={draft}
					aria-label="Nhập câu hỏi về thuốc nam"
					placeholder="Hỏi về một cây thuốc hoặc công dụng dân gian..."
					maxlength="1200"
					rows="1"
					onkeydown={handleComposerKeydown}></textarea>
				<div class="composer-footer">
					<span>Enter để gửi · Shift + Enter để xuống dòng</span>
				</div>
				<button
					class="send-button"
					type="submit"
					aria-label="Gửi câu hỏi"
					title="Gửi câu hỏi"
					disabled={isSending || !draft.trim()}
				>
					<span aria-hidden="true">↑</span>
				</button>
			</form>
			<p class="disclaimer">
				Thông tin tham khảo từ ghi chép cộng đồng, không thay thế tư vấn y tế chuyên môn.
			</p>
		</div>
	</main>
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}
	:global(body) {
		margin: 0;
		background: #f7f7f2;
		color: #28362d;
		font-family: 'Be Vietnam Pro', sans-serif;
	}
	:global(button),
	:global(textarea) {
		font: inherit;
	}
	.chat-shell {
		min-height: 100vh;
		display: grid;
		grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
	}
	.mode-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #9ab58e;
	}
	.chat-main {
		min-width: 0;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	.topbar {
		height: 62px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 35px;
		border-bottom: 1px solid #e8e7df;
		background: rgb(255 255 255 / 0.5);
	}
	.chat-mode {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #56665a;
		font-size: 11px;
	}
	.mode-separator {
		color: #b1b5ab;
	}
	.library-shortcut {
		color: #9e6443;
		text-decoration: none;
		font-size: 11px;
	}
	.library-shortcut span {
		margin-left: 4px;
	}
	.conversation {
		width: 100%;
		flex: 1;
		min-height: 280px;
		display: flex;
		justify-content: center;
		padding: 28px 32px 20px;
		overflow-y: auto;
	}
	.welcome {
		width: min(100%, 610px);
		align-self: center;
		padding: 7px 0 15px;
		animation: rise-in 0.45s both;
	}
	.welcome-symbol {
		color: #bd7446;
		font-size: 27px;
		margin-bottom: 20px;
	}
	.eyebrow,
	.suggestions-label {
		color: #9a7855;
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 1.05px;
	}
	h1 {
		margin: 13px 0 10px;
		color: #294235;
		font:
			500 39px/1.2 'Noto Serif',
			Georgia,
			serif;
	}
	.welcome-copy {
		max-width: 490px;
		margin: 0;
		color: #778178;
		font-size: 13px;
		line-height: 1.8;
	}
	.suggestions-label {
		margin: 31px 0 9px;
		color: #969b91;
		font-size: 8px;
	}
	.suggestions {
		display: grid;
		gap: 7px;
	}
	.suggestion {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 42px;
		padding: 9px 11px;
		border: 1px solid #e4e4db;
		border-radius: 4px;
		background: #fff;
		color: #637067;
		text-align: left;
		font-size: 11px;
		cursor: pointer;
		transition:
			border-color 0.18s,
			transform 0.18s;
	}
	.suggestion:hover {
		border-color: #bdcaba;
		transform: translateX(2px);
	}
	.suggestion span {
		color: #be764a;
		font-size: 14px;
	}
	.message-list {
		width: min(100%, 760px);
		margin: auto;
		padding: 7px 0 24px;
	}
	.message {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		margin: 0 0 26px;
		animation: rise-in 0.25s both;
	}
	.message.from-user {
		justify-content: flex-end;
	}
	.assistant-mark {
		flex: 0 0 27px;
		width: 27px;
		height: 27px;
		display: grid;
		place-items: center;
		border-radius: 7px;
		color: #284135;
		background: #e8eee6;
		font:
			600 16px 'Noto Serif',
			Georgia,
			serif;
	}
	.message-body {
		min-width: 0;
		max-width: min(86%, 650px);
	}
	.from-user .message-body {
		padding: 11px 14px;
		border-radius: 7px 7px 2px 7px;
		background: #e9eee6;
	}
	.message-author {
		margin-bottom: 5px;
		color: #9b7854;
		font-size: 9px;
		font-weight: 700;
	}
	.from-user .message-author {
		color: #55705c;
	}
	.message-text {
		color: #4b5a4e;
		font-size: 12px;
		line-height: 1.85;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.sources {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
		margin-top: 13px;
		padding-top: 10px;
		border-top: 1px solid #e8e8df;
	}
	.sources-title {
		flex: 0 0 100%;
		color: #999f94;
		font-size: 8px;
		font-weight: 700;
		letter-spacing: 0.8px;
	}
	.source-link {
		display: grid;
		gap: 2px;
		min-width: 120px;
		padding: 7px 9px;
		border: 1px solid #e7e7de;
		border-radius: 4px;
		background: #fff;
		color: #4e6453;
		text-decoration: none;
		font-size: 10px;
	}
	.source-link em {
		color: #999e94;
		font:
			italic 9px Georgia,
			serif;
	}
	.source-link small {
		color: #a07b53;
		font-size: 8px;
	}
	.thinking {
		display: flex;
		align-items: center;
		gap: 4px;
		margin: 5px 0 18px 39px;
	}
	.thinking > span {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #bd8c5d;
		animation: pulse 1s infinite alternate;
	}
	.thinking > span:nth-child(2) {
		animation-delay: 0.2s;
	}
	.thinking > span:nth-child(3) {
		animation-delay: 0.4s;
	}
	.thinking small {
		margin-left: 5px;
		color: #92988f;
		font-size: 9px;
	}
	.composer-wrap {
		width: min(100%, 820px);
		align-self: center;
		padding: 0 28px 16px;
	}
	.composer {
		position: relative;
		border: 1px solid #dedfd5;
		border-radius: 6px;
		background: #fff;
		box-shadow: 0 3px 14px rgb(38 52 42 / 0.035);
	}
	.composer:focus-within {
		border-color: #9aaf99;
		box-shadow: 0 0 0 2px rgb(142 170 141 / 0.13);
	}
	.composer textarea {
		display: block;
		width: 100%;
		min-height: 96px;
		max-height: 160px;
		resize: vertical;
		padding: 14px 60px 40px 15px;
		border: 0;
		outline: 0;
		background: transparent;
		color: #37483b;
		font-size: 12px;
		line-height: 1.6;
	}
	.composer textarea::placeholder {
		color: #a0a69d;
	}
	.composer-footer {
		position: absolute;
		bottom: 17px;
		left: 15px;
		right: 62px;
	}
	.composer-footer > span {
		color: #a0a59c;
		font-size: 9px;
	}
	.send-button {
		position: absolute;
		top: 8px;
		right: 9px;
		width: 34px;
		height: 34px;
		display: grid;
		place-items: center;
		border: 0;
		border-radius: 4px;
		background: #bd7446;
		color: #fff;
		cursor: pointer;
	}
	.send-button:hover:not(:disabled) {
		background: #a95f37;
	}
	.send-button:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.send-button span {
		font-size: 18px;
		line-height: 1;
	}
	.disclaimer {
		margin: 8px 0 0;
		color: #a0a49b;
		text-align: center;
		font-size: 9px;
		line-height: 1.5;
	}
	.request-error {
		margin-bottom: 8px;
		padding: 9px 11px;
		border-left: 3px solid #bd7446;
		background: #fff1e7;
		color: #874b2b;
		font-size: 11px;
	}
	@keyframes rise-in {
		from {
			opacity: 0;
			transform: translateY(7px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	@keyframes pulse {
		from {
			opacity: 0.35;
			transform: translateY(0);
		}
		to {
			opacity: 1;
			transform: translateY(-3px);
		}
	}
	@media (max-width: 760px) {
		.chat-shell {
			display: block;
		}
		.chat-main {
			min-height: 100dvh;
		}
		.topbar {
			height: 55px;
			padding: 0 16px;
		}
		.chat-mode {
			font-size: 10px;
		}
		.library-shortcut {
			font-size: 10px;
		}
		.conversation {
			padding: 21px 18px 16px;
		}
		.welcome {
			padding: 8px 0;
		}
		h1 {
			font-size: 33px;
		}
		.welcome-copy {
			font-size: 12px;
		}
		.suggestions-label {
			margin-top: 24px;
		}
		.composer-wrap {
			padding: 0 12px 10px;
		}
		.composer textarea {
			min-height: 84px;
		}
		.disclaimer {
			font-size: 8px;
		}
		.message-list {
			padding-bottom: 18px;
		}
		.message-body {
			max-width: 90%;
		}
	}
	@media (max-width: 410px) {
		.chat-mode {
			gap: 5px;
			font-size: 9px;
		}
		.library-shortcut {
			font-size: 9px;
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
