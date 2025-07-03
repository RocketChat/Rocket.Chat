import type { IFreeSwitchChannel } from '@rocket.chat/core-typings';

export function parseChannelKind(channelName?: string): IFreeSwitchChannel['kind'] {
	if (!channelName) {
		return 'unknown';
	}

	if (channelName.startsWith('sofia/internal/')) {
		return 'internal';
	}

	if (channelName.startsWith('sofia/external/')) {
		return 'external';
	}

	if (channelName.startsWith('loopback/voicemail')) {
		return 'voicemail';
	}

	return 'unknown';
}
