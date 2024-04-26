import type { IRocketChatDesktop } from './IRocketChatDesktop';

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Window {
		RocketChatDesktop?: IRocketChatDesktop;
	}
}
