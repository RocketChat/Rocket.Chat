import type { ILivechatAgent, IUser, Serialized } from '@rocket.chat/core-typings';
import { ReactiveVar } from 'meteor/reactive-var';

import { Users } from '../../app/models/client';
import { sdk } from '../../app/utils/client/lib/SDKClient';

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
	const user = Users.findOne({ _id: userData._id }) as IUser | undefined;

	if (!user?._updatedAt || user._updatedAt.getTime() < userData._updatedAt.getTime()) {
		Users.upsert({ _id: userData._id }, userData);
		return;
	}

	// delete data already on user's collection as those are newer
	Object.keys(user).forEach((key) => {
		delete userData[key as keyof IUser];
	});
	Users.update({ _id: user._id }, { $set: { ...userData } });
};

let cancel: undefined | (() => void);
export const synchronizeUserData = async (uid: IUser['_id']): Promise<RawUserData | void> => {
	if (!uid) {
		return;
	}

	// Remove data from any other user that we may have retained
	Users.remove({ _id: { $ne: uid } });

	cancel?.();

	const result = sdk.stream('notify-user', [`${uid}/userData`], (data) => {
		switch (data.type) {
			case 'inserted':
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { type, id, ...user } = data;
				Users.insert(user as unknown as IUser);
				break;

			case 'updated':
				Users.upsert({ _id: uid }, { $set: data.diff, $unset: data.unset as any });
				break;

			case 'removed':
				Users.remove({ _id: uid });
				break;
		}
	});

	cancel = result.stop;
	await result.ready();

	const { ldap, lastLogin, services: rawServices, ...userData } = await sdk.rest.get('/v1/me');

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
											when: new Date('when' in token ? token.when : ''),
											createdAt: ('createdAt' in token ? new Date(token.createdAt) : undefined) as Date,
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
					...(emailCode ? { ...emailCode, expire: new Date(emailCode.expire) } : {}),
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

export const removeLocalUserData = (): number => Users.remove({});
