import type { IFreeSwitchEventCallUser } from '@rocket.chat/core-typings';

export function mergeUsers(
	target: IFreeSwitchEventCallUser,
	source: IFreeSwitchEventCallUser,
	modifyExisting = true,
): IFreeSwitchEventCallUser {
	const newIdentifiers = source.identifiers.filter(
		(identifier) => !target.identifiers.some((id) => id.value === identifier.value && id.type === identifier.type),
	);

	const identifiers = [...target.identifiers, ...newIdentifiers];
	const uid = target.uid || source.uid;
	const workspaceUrl = target.workspaceUrl || source.workspaceUrl;
	const reached = target.reached || source.reached;
	const channelUniqueId = target.channelUniqueId || source.channelUniqueId;
	const presumedWorkspaceUrl = target.presumedWorkspaceUrl || source.presumedWorkspaceUrl;
	const isVoicemail = target.isVoicemail || source.isVoicemail;

	if (modifyExisting) {
		target.identifiers = identifiers;
		target.uid = uid;
		target.workspaceUrl = workspaceUrl;
		target.reached = reached;
		target.channelUniqueId = channelUniqueId;
		target.presumedWorkspaceUrl = presumedWorkspaceUrl;
		target.isVoicemail = isVoicemail;

		if (target.workspaceUrl && target.presumedWorkspaceUrl === target.workspaceUrl) {
			delete target.presumedWorkspaceUrl;
		}

		return target;
	}

	return {
		...target,
		identifiers,

		uid,
		workspaceUrl,
		reached,
		channelUniqueId,
		isVoicemail,

		...(presumedWorkspaceUrl && presumedWorkspaceUrl !== workspaceUrl && { presumedWorkspaceUrl }),
	};
}
