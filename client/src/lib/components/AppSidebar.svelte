<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	type Props = {
		activePage: 'chat' | 'library';
		onNewChat?: () => void;
	};

	let { activePage, onNewChat }: Props = $props();

	function startNewChat() {
		if (onNewChat) {
			onNewChat();
		} else {
			void goto(resolve('/'));
		}
	}
</script>

<aside class="sidebar">
	<div class="brand-row">
		<a class="brand" href={resolve('/')} aria-label="Herboto, trang chủ">
			<span class="brand-mark" aria-hidden="true">H</span>
			<span class="brand-name">herboto<span class="brand-period">.</span></span>
		</a>
		<a
			class:active={activePage === 'library'}
			class="library-icon"
			href={resolve('/thuvien')}
			aria-label="Mở thư viện thuốc"
			aria-current={activePage === 'library' ? 'page' : undefined}
			title="Thư viện thuốc"
		>
			<span aria-hidden="true">▤</span>
		</a>
	</div>

	<button class="new-chat" onclick={startNewChat}>
		<span aria-hidden="true">＋</span><span class="new-chat-label">Cuộc trò chuyện mới</span>
	</button>

	<div class="side-label">KHÔNG GIAN</div>
	<nav aria-label="Điều hướng chính">
		<a
			class:active={activePage === 'chat'}
			href={resolve('/')}
			aria-current={activePage === 'chat' ? 'page' : undefined}
		>
			<span class="nav-icon" aria-hidden="true">◌</span><span>Trò chuyện AI</span>
		</a>
	</nav>

	<div class="sidebar-note">
		<span class="note-mark" aria-hidden="true">✳</span>
		<p>Tri thức cây thuốc<br />được gìn giữ cùng nhau.</p>
	</div>
	<div class="sidebar-footer">HERBOTO · THƯ VIỆN CỘNG ĐỒNG</div>
</aside>

<style>
	.sidebar {
		position: sticky;
		top: 0;
		width: var(--sidebar-width);
		min-width: var(--sidebar-width);
		max-width: var(--sidebar-width);
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		height: 100vh;
		padding: 25px 18px 21px;
		background: #203a32;
		color: #f4f3e9;
	}
	.brand-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 8px;
		color: inherit;
		text-decoration: none;
		font-size: 20px;
		font-weight: 700;
	}
	.brand-mark {
		display: grid;
		place-items: center;
		width: 31px;
		height: 31px;
		flex: 0 0 31px;
		border-radius: 8px;
		background: #db9c55;
		color: #203a32;
		font:
			600 20px 'Noto Serif',
			Georgia,
			serif;
	}
	.brand-period {
		color: #dfaa67;
	}
	.library-icon {
		width: 31px;
		height: 31px;
		flex: 0 0 31px;
		display: grid;
		place-items: center;
		border: 1px solid #607267;
		border-radius: 5px;
		color: #e3ab6a;
		text-decoration: none;
		font-size: 14px;
		transition:
			background 0.18s ease,
			color 0.18s ease;
	}
	.library-icon:hover,
	.library-icon.active {
		background: #365348;
		color: #fff;
	}
	.new-chat {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 45px 0 30px;
		padding: 11px 12px;
		border: 1px solid #607267;
		border-radius: 4px;
		background: transparent;
		color: #fff;
		text-align: left;
		font-size: 12px;
		cursor: pointer;
	}
	.new-chat:hover {
		background: #2c493d;
	}
	.new-chat > span:first-child {
		color: #e3ab6a;
		font-size: 18px;
	}
	.side-label {
		margin: 0 10px 12px;
		color: #9eafa4;
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 1px;
	}
	nav {
		display: grid;
		gap: 5px;
	}
	nav a {
		display: flex;
		align-items: center;
		gap: 11px;
		padding: 10px 11px;
		border-radius: 4px;
		color: #c7d1ca;
		text-decoration: none;
		font-size: 12px;
	}
	nav a:hover {
		background: #2c493d;
	}
	nav a.active {
		background: #365348;
		color: white;
	}
	.nav-icon {
		width: 18px;
		color: #dba160;
		text-align: center;
		font-size: 17px;
	}
	.sidebar-note {
		margin-top: auto;
		padding: 17px 8px 16px;
		border-top: 1px solid #456056;
	}
	.note-mark {
		color: #e1a45f;
		font-size: 20px;
	}
	.sidebar-note p {
		margin: 9px 0 0;
		color: #d6ddd6;
		font:
			500 15px/1.5 'Noto Serif',
			Georgia,
			serif;
	}
	.sidebar-footer {
		padding: 0 8px;
		color: #96a69d;
		font-size: 9px;
		letter-spacing: 0.7px;
	}
	@media (max-width: 760px) {
		.sidebar {
			position: static;
			z-index: 2;
			width: 100%;
			min-width: 0;
			max-width: none;
			min-height: 0;
			height: auto;
			flex-direction: row;
			align-items: center;
			gap: 10px;
			padding: 10px 14px;
		}
		.brand {
			flex: 0 0 auto;
			gap: 7px;
			padding: 0;
			font-size: 17px;
		}
		.brand-row {
			gap: 5px;
		}
		.library-icon {
			width: 27px;
			height: 27px;
			flex-basis: 27px;
		}
		.brand-mark {
			width: 27px;
			height: 27px;
			flex-basis: 27px;
			font-size: 17px;
		}
		.new-chat {
			width: 31px;
			height: 31px;
			flex: 0 0 31px;
			justify-content: center;
			margin: 0;
			padding: 0;
		}
		.new-chat-label,
		.side-label,
		.sidebar-note,
		.sidebar-footer {
			display: none;
		}
		nav {
			grid-auto-flow: column;
			grid-auto-columns: max-content;
			gap: 2px;
			margin-left: auto;
		}
		nav a {
			gap: 5px;
			padding: 8px 7px;
			font-size: 10px;
			white-space: nowrap;
		}
		.nav-icon {
			width: 14px;
			font-size: 14px;
		}
	}
	@media (max-width: 390px) {
		.sidebar {
			gap: 7px;
			padding-inline: 10px;
		}
		.brand-name {
			font-size: 0;
		}
		nav a {
			gap: 3px;
			padding-inline: 5px;
			font-size: 9px;
		}
	}
</style>
