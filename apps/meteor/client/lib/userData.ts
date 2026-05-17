import type { ILivechatAgent, IUser, Serialized } from '@rocket.chat/core-typings';
import { createTransformFromUpdateFilter } from '@rocket.chat/mongo-adapter';
import { create } from 'zustand';

import { sdk } from '../../app/utils/client/lib/SDKClient';
import { Users } from '../stores';

export const useUserDataSyncReady = create(() => false);

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

	const { success: _success, ldap, lastLogin, services: rawServices, ...fromMe } = await sdk.rest.get('/v1/me');

	if (fromMe._id) {
		const existingUser = Users.state.get(uid);
		const { email: _meEmail, ...meFields } = fromMe;
		const { email, cloud, resume, email2fa, emailCode, ...services } = (rawServices ?? {}) as NonNullable<IUser['services']>;

		const mergedEmail2fa =
			email2fa &&
			(() => {
				const { changedAt: apiChangedAt, ...email2faRest } = email2fa;
				let changedAt: Date | undefined;
				if (apiChangedAt != null) {
					const parsed = new Date(apiChangedAt as string | number | Date);
					if (!Number.isNaN(parsed.getTime())) {
						changedAt = parsed;
					}
				}
				if (changedAt == null && existingUser?.services?.email2fa?.changedAt != null) {
					const prev = existingUser.services.email2fa.changedAt;
					changedAt = prev instanceof Date ? prev : new Date(prev);
				}
				return {
					...email2faRest,
					...(changedAt != null ? { changedAt } : {}),
				};
			})();

		updateUser({
			type: existingUser?.type ?? 'user',
			active: existingUser?.active ?? true,
			roles: existingUser?.roles ?? [],
			...existingUser,
			...meFields,
			...(rawServices && {
				services: {
					...(services ? { ...services } : {}),
					...(resume
						? {
								resume: {
									...(resume.loginTokens && {
										loginTokens: resume.loginTokens.map((token) => ({
											...token,
											when: new Date('when' in token && token.when ? token.when : 0),
											createdAt: 'createdAt' in token && token.createdAt ? new Date(token.createdAt) : new Date(0),
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
					...(mergedEmail2fa ? { email2fa: mergedEmail2fa } : {}),
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
			createdAt: meFields.createdAt != null ? new Date(meFields.createdAt) : (existingUser?.createdAt ?? new Date()),
			_updatedAt: new Date(meFields._updatedAt ?? existingUser?._updatedAt ?? Date.now()),
		} as IUser);
	}
	useUserDataSyncReady.setState(true);

	return fromMe as unknown as RawUserData;
};

export const removeLocalUserData = () => {
	Users.state.replaceAll([]);
	localStorage.clear();
};
