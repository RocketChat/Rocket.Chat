import type { IFreeSwitchEventUser } from '@rocket.chat/core-typings';

export function makeEventUser(type: IFreeSwitchEventUser['type'], value?: string): IFreeSwitchEventUser | undefined {
	if (!value) {
		return undefined;
	}

	if (value === 'voicemail') {
		return {
			type: 'voicemail',
			value: 'voicemail',
		};
	}

	return {
		type,
		value,
	};
}
