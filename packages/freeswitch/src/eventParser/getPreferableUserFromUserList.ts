import type { IFreeSwitchEventCallUser } from '@rocket.chat/core-typings';

export function getPreferableUserFromUserList(list: IFreeSwitchEventCallUser[]): IFreeSwitchEventCallUser | undefined {
	const user = identifyPreferableUser(list);
	if (!user) {
		return;
	}

	return fillMissingData(user);
}

// Replaces missing top-priority attributes with data that has lower priority
function fillMissingData(user: IFreeSwitchEventCallUser): IFreeSwitchEventCallUser | undefined {
	const uid = user.uid || user.identifiers.find((id) => id.type === 'uid')?.value;

	const { workspaceUrl, presumedWorkspaceUrl, ...userData } = user;

	return {
		...userData,
		uid,
		workspaceUrl: workspaceUrl || presumedWorkspaceUrl,
		...(workspaceUrl && presumedWorkspaceUrl && workspaceUrl !== presumedWorkspaceUrl && { presumedWorkspaceUrl }),
	};
}

function identifyPreferableUser(list: IFreeSwitchEventCallUser[]): IFreeSwitchEventCallUser | undefined {
	const rocketChatUser = list.find(({ uid }) => uid);
	if (rocketChatUser) {
		return rocketChatUser;
	}

	const preferentialOrder = ['uid', 'extension', 'contact', 'unknown'];
	for (const idType of preferentialOrder) {
		const userWithThisType = list.find(({ identifiers }) => identifiers.some(({ type }) => type === idType));
		if (userWithThisType) {
			return userWithThisType;
		}
	}

	const userWithAnything = list.find(({ identifiers }) => identifiers.length);

	if (userWithAnything) {
		return userWithAnything;
	}

	return list[0];
}
