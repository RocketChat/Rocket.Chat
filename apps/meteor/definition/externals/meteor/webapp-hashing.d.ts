declare module 'meteor/webapp-hashing' {
	import type { IRocketChatAssetCache } from '@rocket.chat/core-typings';

	namespace WebAppHashing {
		function calculateClientHash(
			manifest: IRocketChatAssetCache[],
			includeFilter?: (type: IRocketChatAssetCache['type'], replaceable: boolean) => boolean,
			runtimeConfigOverride?: unknown,
		): string;
	}
}
