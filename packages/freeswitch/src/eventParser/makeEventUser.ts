import type { IFreeSwitchEventUser } from '@rocket.chat/core-typings';

export function makeEventUser(type: IFreeSwitchEventUser['type'], value?: string): IFreeSwitchEventUser | undefined {
	if (!value) {
		return undefined;
	}

	// If the value includes spaces, it can't be any of the id types, so switch it to 'unknown'
	// This may happen for example in the inbound loopback channel of a call that ends on voicemail
	// (Events from the inbound loopback channel are ignored as a whole, but we keep this check here for safeguard)
	if (value.includes(' ')) {
		return {
			type: 'unknown',
			value,
		};
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
