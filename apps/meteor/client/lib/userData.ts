import type { ILivechatAgent, IUser, IUserDataEvent, Serialized } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

import { Users } from '../../app/models/client';
import { Notifications } from '../../app/notifications/client';
import { APIClient } from '../../app/utils/client';

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
		| 'oauth'
		| 'createdAt'
		| '_updatedAt'
		| 'avatarETag'
	> & { statusLivechat?: ILivechatAgent['statusLivechat'] }
>;

const updateUser = (userData: IUser): void => {
	const user: IUser = Users.findOne({ _id: userData._id });

	if (!user || !user._updatedAt || user._updatedAt.getTime() < userData._updatedAt.getTime()) {
		Meteor.users.upsert({ _id: userData._id }, userData as Meteor.User);
		return;
	}

	// delete data already on user's collection as those are newer
	Object.keys(user).forEach((key) => {
		delete userData[key as keyof IUser];
	});
	Meteor.users.update({ _id: user._id }, { $set: userData as Meteor.User });
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
				Meteor.users.insert(user as Meteor.User);
				break;

			case 'updated':
				Meteor.users.upsert({ _id: uid }, { $set: data.diff as Meteor.User, $unset: data.unset });
				break;

			case 'removed':
				Meteor.users.remove({ _id: uid });
				break;
		}
	});

	const { ldap, lastLogin, services: rawServices, ...userData } = await APIClient.get('/v1/me');

	// email?: {
	// 	verificationTokens?: IUserEmailVerificationToken[];
	// };
	// export interface IUserEmailVerificationToken {
	// 	token: string;
	// 	address: string;
	// 	when: Date;
	// }

	if (userData) {
		const { email, cloud, resume, email2fa, emailCode, ...services } = rawServices || {};

		updateUser({
			...userData,
			...(rawServices && {
				services: {
					...(services ? { ...services } : {}),
					...(resume
						? {
								resume: {
									...(resume.loginTokens && {
										loginTokens: resume.loginTokens.map((token) => ({
											...token,
											when: new Date(token.when),
											createdAt: (token.createdAt ? new Date(token.createdAt) : undefined) as Date,
											twoFactorAuthorizedUntil: token.twoFactorAuthorizedUntil ? new Date(token.twoFactorAuthorizedUntil) : undefined,
										})),
									}),
								},
						  }
						: {}),
					...(cloud
						? {
								cloud: {
									...cloud,
									expiresAt: new Date(cloud.expiresAt),
								},
						  }
						: {}),
					emailCode: emailCode?.map(({ expire, ...data }) => ({ expire: new Date(expire), ...data })) || [],
					...(email2fa ? { email2fa: { ...email2fa, changedAt: new Date(email2fa.changedAt) } } : {}),
					...(email?.verificationTokens && {
						email: {
							verificationTokens: email.verificationTokens.map((token) => ({
								...token,
								when: new Date(token.when),
							})),
						},
					}),
				},
			}),
			...(lastLogin && {
				lastLogin: new Date(lastLogin),
			}),
			ldap: Boolean(ldap),
			createdAt: new Date(userData.createdAt),
			_updatedAt: new Date(userData._updatedAt),
		});
	}
	isSyncReady.set(true);

	return userData;
};

export const removeLocalUserData = (): number => Meteor.users.remove({});
