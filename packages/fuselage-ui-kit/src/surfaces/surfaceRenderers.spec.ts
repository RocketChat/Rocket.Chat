import * as UiKit from '@rocket.chat/ui-kit';

import { bannerParser, contextualBarParser, messageParser, modalParser } from '.';

it.each([
	['message', messageParser, UiKit.messageSurfaceLayoutBlockTypes],
	['modal', modalParser, UiKit.modalSurfaceLayoutBlockTypes],
	['banner', bannerParser, UiKit.bannerSurfaceLayoutBlockTypes],
	['contextual bar', contextualBarParser, UiKit.contextualBarSurfaceLayoutBlockTypes],
] as const)('the %s renderer can draw every block its surface accepts', (_surface, renderer, allowedTypes) => {
	const methods = renderer as unknown as Record<string, unknown>;

	expect(allowedTypes.filter((type) => typeof methods[type] !== 'function')).toEqual([]);
});
