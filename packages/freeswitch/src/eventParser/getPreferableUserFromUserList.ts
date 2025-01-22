import type { IFreeSwitchEventCallUser } from '@rocket.chat/core-typings';

function replacePresumedWorkspaceUrl(user?: IFreeSwitchEventCallUser): IFreeSwitchEventCallUser | undefined {
	if (!user) {
		return;
	}

	if (!user.presumedWorkspaceUrl) {
		return user;
	}

	if (user.workspaceUrl === user.presumedWorkspaceUrl) {
		delete user.presumedWorkspaceUrl;
	} else if (!user.workspaceUrl && user.presumedWorkspaceUrl) {
		user.workspaceUrl = user.presumedWorkspaceUrl;
		delete user.presumedWorkspaceUrl;
	}

	return user;
}

export function getPreferableUserFromUserList(list: IFreeSwitchEventCallUser[]): IFreeSwitchEventCallUser | undefined {
	const rocketChatUser = list.find(({ uid }) => uid);
	if (rocketChatUser) {
		return replacePresumedWorkspaceUrl(rocketChatUser);
	}

	const userWithExtension = list.find(({ identifiers }) => identifiers.some(({ type }) => type === 'extension'));

	if (userWithExtension) {
		return replacePresumedWorkspaceUrl(userWithExtension);
	}

	return replacePresumedWorkspaceUrl(list[0]);
}
