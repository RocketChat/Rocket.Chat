import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';

import { APIClient } from '../../app/utils/client';
import { Users } from '../../app/models/client';
import { Notifications } from '../../app/notifications/client';
import type { IUser, IUserDataEvent } from '../../definition/IUser';

export const isSyncReady = new ReactiveVar(false);

type RawUserData = Omit<IUser, '_updatedAt'> & {
	_updatedAt: string;
};

const updateUser = (userData: IUser & { _updatedAt: Date }): void => {
	const user: IUser = Users.findOne({ _id: userData._id });

	if (!user || !user._updatedAt || (user._updatedAt.getTime() < userData._updatedAt.getTime())) {
		Meteor.users.upsert({ _id: userData._id }, userData);
		return;
	}

	// delete data already on user's collection as those are newer
	Object.keys(user).forEach((key) => {
		delete userData[key as keyof IUser];
	});
	Meteor.users.update({ _id: user._id }, { $set: userData });
};

export const synchronizeUserData = async (uid: Meteor.User['_id']): Promise<unknown> => {
	if (!uid) {
		return;
	}

	await Notifications.onUser('userData', (data: IUserDataEvent) => {
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
			_updatedAt: new Date(userData._updatedAt),
		});
	}
	isSyncReady.set(true);

	return userData;
};
