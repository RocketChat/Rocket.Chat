import type { ILivechatAgent, IUser, Serialized } from '@rocket.chat/core-typings';
import { createTransformFromUpdateFilter } from '@rocket.chat/mongo-adapter';
import { ReactiveVar } from 'meteor/reactive-var';

import { sdk } from '../../app/utils/client/lib/SDKClient';
import { Users } from '../stores';

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
	const user = Users.state.get(userData._id);

	if (!user?._updatedAt || user._updatedAt.getTime() < userData._updatedAt.getTime()) {
		Users.state.store(userData);
		return;
	}

	// delete data already on user's collection as those are newer
	for (const key of Object.keys(user)) {
		delete userData[key as keyof IUser];
	}

	Users.state.update(
		({ _id }) => _id === user._id,
		(user) => ({ ...user, ...userData }),
	);
};

let cancel: undefined | (() => void);
export const synchronizeUserData = async (uid: IUser['_id']): Promise<RawUserData | void> => {
	if (!uid) return;

	// Remove data from any other user that we may have retained
	Users.state.remove((record) => record._id !== uid);
	cancel?.();

	const result = sdk.stream('notify-user', [`${uid}/userData`], (data) => {
		switch (data.type) {
			case 'inserted': {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { type, id, ...user } = data;
				Users.state.store(user.data);
				break;
			}

			case 'updated': {
				const transform = createTransformFromUpdateFilter<IUser>({ $unset: data.unset as Record<string, 1>, $set: data.diff });
				Users.state.update(({ _id }) => _id === uid, transform);
				break;
			}

			case 'removed':
				Users.state.delete(uid);
				break;
		}
	});

	cancel = result.stop;
	await result.ready();

	const { ldap, lastLogin, services: rawServices, ...userData } = await sdk.rest.get('/v1/me');

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

export const removeLocalUserData = () => {
	Users.state.replaceAll([]);
	localStorage.clear();
};
