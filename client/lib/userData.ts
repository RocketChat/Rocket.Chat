import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

import { Users } from '../../app/models/client';
import { Notifications } from '../../app/notifications/client';
import { APIClient } from '../../app/utils/client';
import type { IUser, IUserDataEvent } from '../../definition/IUser';
import { Serialized } from '../../definition/Serialized';

export const isSyncReady = new ReactiveVar(false);

type RawUserData = Serialized<
	Pick<
		IUser,
		| '_id'
		| 'type'
		| 'name'
		| 'username'
		| 'emails'
		| 'status'
		| 'statusDefault'
		| 'statusText'
		| 'statusConnection'
		| 'avatarOrigin'
		| 'utcOffset'
		| 'language'
		| 'settings'
		| 'roles'
		| 'active'
		| 'defaultRoom'
		| 'customFields'
		| 'statusLivechat'
		| 'oauth'
		| 'createdAt'
		| '_updatedAt'
		| 'avatarETag'
	>
>;

const updateUser = (userData: IUser): void => {
	const user: IUser = Users.findOne({ _id: userData._id });

	if (!user || !user._updatedAt || user._updatedAt.getTime() < userData._updatedAt.getTime()) {
		Meteor.users.upsert({ _id: userData._id }, userData);
		return;
	}

	// delete data already on user's collection as those are newer
	Object.keys(user).forEach((key) => {
		delete userData[key as keyof IUser];
	});
	Meteor.users.update({ _id: user._id }, { $set: userData });
};

let cancel: undefined | (() => void);
export const synchronizeUserData = async (uid: Meteor.User['_id']): Promise<RawUserData | void> => {
	if (!uid) {
		return;
	}

	// Remove data from any other user that we may have retained
	Meteor.users.remove({ _id: { $ne: uid } });

	cancel?.();

	cancel = await Notifications.onUser('userData', (data: IUserDataEvent) => {
		switch (data.type) {
			case 'inserted':
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { type, id, ...user } = data;
				Meteor.users.insert(user);
				break;

			case 'updated':
				Meteor.users.upsert({ _id: uid }, { $set: data.diff, $unset: data.unset });
				break;

			case 'removed':
				Meteor.users.remove({ _id: uid });
				break;
		}
	});

	const userData: RawUserData = await APIClient.v1.get('me');
	if (userData) {
		updateUser({
			...userData,
			createdAt: new Date(userData.createdAt),
			_updatedAt: new Date(userData._updatedAt),
		});
	}
	isSyncReady.set(true);

	return userData;
};

export const removeLocalUserData = (): number => Meteor.users.remove({});
