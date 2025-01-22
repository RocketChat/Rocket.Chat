import type { IFreeSwitchEventCallUser, IFreeSwitchEventUser } from '@rocket.chat/core-typings';

import { computeUserIdentifiers } from './computeUserIdentifiers';

export function makeEventCallUser(
	identifiers: (IFreeSwitchEventUser | undefined)[],
	data?: Partial<Omit<IFreeSwitchEventCallUser, 'identifiers'>>,
): IFreeSwitchEventCallUser | undefined {
	const computedIdentifiers = computeUserIdentifiers(identifiers);
	const filteredIdentifiers = computedIdentifiers.filter(({ type, value }) => type !== 'voicemail' && value !== 'voicemail');
	const isVoicemail = computedIdentifiers.length > filteredIdentifiers.length;

	if (!filteredIdentifiers.length && !data?.uid) {
		return undefined;
	}

	return {
		uid: data?.uid,
		workspaceUrl: data?.workspaceUrl,
		presumedWorkspaceUrl: data?.presumedWorkspaceUrl,
		identifiers: filteredIdentifiers,
		isVoicemail,
	};
}
