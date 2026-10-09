import type { VirtualBackgroundSnapshot } from '@rocket.chat/media-processors';
import { getVirtualBackgroundSnapshot, subscribeVirtualBackground } from '@rocket.chat/media-processors';
import { useSyncExternalStore } from 'react';

export const useVirtualBackground = (): VirtualBackgroundSnapshot =>
	useSyncExternalStore(subscribeVirtualBackground, getVirtualBackgroundSnapshot);
