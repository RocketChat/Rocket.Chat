import type { IRocketChatDesktop } from '@rocket.chat/desktop-api';

declare global {
	interface Window {
		RocketChatDesktop?: IRocketChatDesktop;
	}
}
