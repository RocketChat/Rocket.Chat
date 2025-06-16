import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import type { ISubscription, IUser, IRoom } from '@rocket.chat/core-typings';
import { Settings, Users, Subscriptions } from '@rocket.chat/models';

import { notifyOnSettingChangedById } from '../../../lib/server/lib/notifyListener';
import { STATUS_ENABLED, STATUS_REGISTERING } from '../constants';

export const getNameAndDomain = (fullyQualifiedName: string): string[] => fullyQualifiedName.split('@');

export const isFullyQualified = (name: string): boolean => name.indexOf('@') !== -1;

export async function isRegisteringOrEnabled(): Promise<boolean> {
	const value = await Settings.getValueById('FEDERATION_Status');
	return typeof value === 'string' && [STATUS_ENABLED, STATUS_REGISTERING].includes(value);
}

export async function updateStatus(status: string): Promise<void> {
	// No need to call ws listener because current function is called on startup
	await Settings.updateValueById('FEDERATION_Status', status);
}

export async function updateEnabled(enabled: boolean): Promise<void> {
	(await Settings.updateValueById('FEDERATION_Enabled', enabled)).modifiedCount && void notifyOnSettingChangedById('FEDERATION_Enabled');
}

export const checkRoomType = (room: IRoom): boolean => room.t === 'p' || room.t === 'd';
export const checkRoomDomainsLength = (domains: unknown[]): boolean => domains.length <= Number(process.env.FEDERATED_DOMAINS_LENGTH ?? 10);

export const hasExternalDomain = ({ federation }: { federation: { origin: string; domains: string[] } }): boolean => {
	// same test as isFederated(room)
	if (!federation) {
		return false;
	}

	return federation.domains.some((domain) => domain !== federation.origin);
};

export const isLocalUser = ({ federation }: { federation: { origin: string } }, localDomain: string): boolean =>
	!federation || federation.origin === localDomain;

export const getFederatedRoomData = async (
	room: IRoom,
): Promise<{
	hasFederatedUser: boolean;
	users: IUser[];
	subscriptions: { [k: string]: ISubscription } | undefined;
}> => {
	if (isDirectMessageRoom(room)) {
		// Check if there is a federated user on this room

		return {
			users: [],
			hasFederatedUser: room.usernames.some(isFullyQualified),
			subscriptions: undefined,
		};
	}

	// Find all subscriptions of this room
	const s = await Subscriptions.findByRoomIdWhenUsernameExists(room._id).toArray();
	const subscriptions = s.reduce(
		(acc, s) => {
			acc[s.u._id] = s;
			return acc;
		},
		{} as { [k: string]: ISubscription },
	);

	// Get all user ids
	const userIds = Object.keys(subscriptions);

	// Load all the users
	const users = await Users.findUsersWithUsernameByIds(userIds).toArray();

	// Check if there is a federated user on this room
	const hasFederatedUser = users.some((u) => u.username && isFullyQualified(u.username));

	return {
		hasFederatedUser,
		users,
		subscriptions,
	};
};
