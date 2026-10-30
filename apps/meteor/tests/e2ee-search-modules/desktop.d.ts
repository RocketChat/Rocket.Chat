import type { IRocketChatDesktop } from '../../../../packages/desktop-api/src/index';

declare global {
	interface Window {
		RocketChatDesktop?: IRocketChatDesktop;
	}
}
