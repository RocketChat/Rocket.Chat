import type { IImportUser, IImportUserRecord, IUser, IUserEmail } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { SHA256 } from '@rocket.chat/sha256';
import { hash as bcryptHash } from 'bcrypt';
import { Accounts } from 'meteor/accounts-base';

import { RecordConverter, type RecordConverterOptions } from './RecordConverter';
import { generateTempPassword } from './generateTempPassword';
import { callbacks as systemCallbacks } from '../../../../../lib/callbacks';
import { addUserToDefaultChannels } from '../../../../lib/server/functions/addUserToDefaultChannels';
import { generateUsernameSuggestion } from '../../../../lib/server/functions/getUsernameSuggestion';
import { saveUserIdentity } from '../../../../lib/server/functions/saveUserIdentity';
import { setUserActiveStatus } from '../../../../lib/server/functions/setUserActiveStatus';
import { notifyOnUserChange } from '../../../../lib/server/lib/notifyListener';
import type { IConversionCallbacks } from '../../definitions/IConversionCallbacks';

export type UserConverterOptions = {
	flagEmailsAsVerified?: boolean;
	skipExistingUsers?: boolean;
	skipNewUsers?: boolean;
	skipUserCallbacks?: boolean;
	skipDefaultChannels?: boolean;

	quickUserInsertion?: boolean;
	enableEmail2fa?: boolean;
};

export class UserConverter extends RecordConverter<IImportUserRecord, UserConverterOptions & RecordConverterOptions> {
	private insertedIds = new Set<IUser['_id']>();

	private updatedIds = new Set<IUser['_id']>();

	protected async convertRecord(record: IImportUserRecord): Promise<boolean | undefined> {
		const { data, _id } = record;

		data.importIds = data.importIds.filter((item) => item);

		if (!data.emails.length && !data.username) {
			throw new Error('importer-user-missing-email-and-username');
		}

		const existingUser = await this.findExistingUser(data);
		if (existingUser && this._options.skipExistingUsers) {
			await this.skipRecord(_id);
			return;
		}
		if (!existingUser && this._options.skipNewUsers) {
			await this.skipRecord(_id);
			return;
		}

		await this.insertOrUpdateUser(existingUser, data);
		return !existingUser;
	}

	async convertData(userCallbacks: IConversionCallbacks = {}): Promise<void> {
		this.insertedIds.clear();
		this.updatedIds.clear();

		if (this._options.quickUserInsertion) {
			await this.batchConversion(userCallbacks);
		} else {
			await super.convertData(userCallbacks);
		}

		await systemCallbacks.run('afterUserImport', {
			inserted: [...this.insertedIds],
			updated: [...this.updatedIds],
			skipped: this.skippedCount,
			failed: this.failedCount,
		});
	}

	public async batchConversion({ afterBatchFn, ...callbacks }: IConversionCallbacks = {}): Promise<void> {
		const batchToInsert = new Set<IImportUser>();

		await this.iterateRecords({
			...callbacks,
			processRecord: async (record: IImportUserRecord) => {
				const { data } = record;

				data.importIds = data.importIds.filter((item) => item);

				if (!data.emails.length && !data.username) {
					throw new Error('importer-user-missing-email-and-username');
				}

				batchToInsert.add(data);

				if (batchToInsert.size >= 50) {
					const usersToInsert = await this.buildUserBatch([...batchToInsert]);
					batchToInsert.clear();

					const newIds = await this.insertUserBatch(usersToInsert, { afterBatchFn });
					newIds.forEach((id) => this.insertedIds.add(id));
				}

				return undefined;
			},
		});

		if (batchToInsert.size > 0) {
			const usersToInsert = await this.buildUserBatch([...batchToInsert]);
			const newIds = await this.insertUserBatch(usersToInsert, { afterBatchFn });
			newIds.forEach((id) => this.insertedIds.add(id));
		}
	}

	private async insertUserBatch(users: IUser[], { afterBatchFn }: IConversionCallbacks): Promise<string[]> {
		let newIds: string[] | null = null;

		try {
			newIds = Object.values((await Users.insertMany(users, { ordered: false })).insertedIds);
			if (afterBatchFn) {
				await afterBatchFn(newIds.length, 0);
			}
		} catch (e: any) {
			newIds = (e.result?.result?.insertedIds || []) as string[];
			const errorCount = users.length - (e.result?.result?.nInserted || 0);

			if (afterBatchFn) {
				await afterBatchFn(Math.min(newIds.length, users.length - errorCount), errorCount);
			}
		}

		return newIds;
	}

	async findExistingUser(data: IImportUser): Promise<IUser | null | undefined> {
		if (data.emails.length) {
			const emailUser = await Users.findOneByEmailAddress(data.emails[0], {});

			if (emailUser) {
				return emailUser;
			}
		}

		// If we couldn't find one by their email address, try to find an existing user by their username
		if (data.username) {
			return Users.findOneByUsernameIgnoringCase<IUser>(data.username, {});
		}
	}

	addUserImportId(updateData: Record<string, any>, userData: IImportUser): void {
		if (userData.importIds?.length) {
			updateData.$addToSet = {
				importIds: {
					$each: userData.importIds,
				},
			};
		}
	}

	addUserEmails(updateData: Record<string, any>, userData: IImportUser, existingEmails: Array<IUserEmail>): void {
		if (!userData.emails?.length) {
			return;
		}

		const verifyEmails = Boolean(this._options.flagEmailsAsVerified);
		const newEmailList: Array<IUserEmail> = [];

		for (const email of userData.emails) {
			const verified = verifyEmails || existingEmails.find((ee) => ee.address === email)?.verified || false;

			newEmailList.push({
				address: email,
				verified,
			});
		}

		updateData.$set.emails = newEmailList;
	}

	addUserServices(updateData: Record<string, any>, userData: IImportUser): void {
		if (!userData.services) {
			return;
		}

		for (const serviceKey in userData.services) {
			if (!userData.services[serviceKey]) {
				continue;
			}

			const service = userData.services[serviceKey];

			for (const key in service) {
				if (!service[key]) {
					continue;
				}

				updateData.$set[`services.${serviceKey}.${key}`] = service[key];
			}
		}
	}

	addCustomFields(updateData: Record<string, any>, userData: IImportUser): void {
		if (!userData.customFields) {
			return;
		}

		const subset = (source: Record<string, any>, currentPath: string): void => {
			for (const key in source) {
				if (!source.hasOwnProperty(key) || source[key] === undefined) {
					continue;
				}

				const keyPath = `${currentPath}.${key}`;
				if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
					subset(source[key], keyPath);
					continue;
				}

				updateData.$set = {
					...updateData.$set,
					...{ [keyPath]: source[key] },
				};
			}
		};

		subset(userData.customFields, 'customFields');
	}

	async insertOrUpdateUser(existingUser: IUser | null | undefined, data: IImportUser): Promise<void> {
		if (!data.username && !existingUser?.username) {
			const emails = data.emails.filter(Boolean).map((email) => ({ address: email }));
			data.username = await generateUsernameSuggestion({
				name: data.name,
				emails,
			});
		}

		if (existingUser) {
			await this.updateUser(existingUser, data);
			this.updatedIds.add(existingUser._id);
		} else {
			if (!data.name && data.username) {
				data.name = this.guessNameFromUsername(data.username);
			}

			const userId = await this.insertUser(data);
			data._id = userId;
			this.insertedIds.add(userId);

			if (!this._options.skipDefaultChannels) {
				const insertedUser = await Users.findOneById(userId, {});
				if (!insertedUser) {
					throw new Error(`User not found: ${userId}`);
				}

				await addUserToDefaultChannels(insertedUser, true);
			}
		}
	}

	async updateUser(existingUser: IUser, userData: IImportUser): Promise<void> {
		const { _id } = existingUser;
		if (!_id) {
			return;
		}

		if (Boolean(userData.federated) !== Boolean(existingUser.federated)) {
			throw new Error("Local and Federated users can't be converted to each other.");
		}

		userData._id = _id;

		if (!userData.roles && !existingUser.roles) {
			userData.roles = ['user'];
		}
		if (!userData.type && !existingUser.type) {
			userData.type = 'user';
		}

		const updateData: Record<string, any> = Object.assign(Object.create(null), {
			$set: Object.assign(Object.create(null), {
				...(userData.roles && { roles: userData.roles }),
				...(userData.type && { type: userData.type }),
				...(userData.statusText && { statusText: userData.statusText }),
				...(userData.bio && { bio: userData.bio }),
				...(userData.services?.ldap && { ldap: true }),
				...(userData.avatarUrl && { _pendingAvatarUrl: userData.avatarUrl }),
			}),
		});

		this.addCustomFields(updateData, userData);
		this.addUserServices(updateData, userData);
		this.addUserImportId(updateData, userData);
		this.addUserEmails(updateData, userData, existingUser.emails || []);

		if (Object.keys(updateData.$set).length === 0) {
			delete updateData.$set;
		}
		if (Object.keys(updateData).length > 0) {
			await Users.updateOne({ _id }, updateData);
		}

		if (userData.utcOffset) {
			await Users.setUtcOffset(_id, userData.utcOffset);
		}

		const localUsername = userData.federated ? undefined : userData.username;
		if (userData.name || localUsername) {
			await saveUserIdentity({ _id, name: userData.name, username: localUsername } as Parameters<typeof saveUserIdentity>[0]);
		}

		if (userData.importIds.length) {
			this._cache.addUser(userData.importIds[0], existingUser._id, existingUser.username || userData.username);
		}

		// Deleted users are 'inactive' users in Rocket.Chat
		if (userData.deleted && existingUser?.active) {
			await setUserActiveStatus(_id, false, true);
		} else if (userData.deleted === false && existingUser?.active === false) {
			await setUserActiveStatus(_id, true);
		}

		void notifyOnUserChange({ clientAction: 'updated', id: _id, diff: updateData.$set });
	}

	async hashPassword(password: string): Promise<string> {
		return bcryptHash(SHA256(password), Accounts._bcryptRounds());
	}

	generateTempPassword(userData: IImportUser): string {
		return generateTempPassword(userData);
	}

	async buildNewUserObject(userData: IImportUser): Promise<Partial<IUser>> {
		return {
			type: userData.type || 'user',
			...(userData.username && { username: userData.username }),
			...(userData.emails.length && {
				emails: userData.emails.map((email) => ({ address: email, verified: !!this._options.flagEmailsAsVerified })),
			}),
			...(userData.statusText && { statusText: userData.statusText }),
			...(userData.name && { name: userData.name }),
			...(userData.bio && { bio: userData.bio }),
			...(userData.avatarUrl && { _pendingAvatarUrl: userData.avatarUrl }),
			...(userData.utcOffset !== undefined && { utcOffset: userData.utcOffset }),
			...{
				services: {
					// Add a password service if there's a password string, or if there's no service at all
					...((!!userData.password || !userData.services || !Object.keys(userData.services).length) && {
						password: { bcrypt: await this.hashPassword(userData.password || this.generateTempPassword(userData)) },
					}),
					...(userData.services || {}),
				},
			},
			...(userData.services?.ldap && { ldap: true }),
			...(userData.importIds?.length && { importIds: userData.importIds }),
			...(!!userData.customFields && { customFields: userData.customFields }),
			...(userData.deleted !== undefined && { active: !userData.deleted }),
			...(userData.voipExtension !== undefined && { freeSwitchExtension: userData.voipExtension }),
			...(userData.federated !== undefined && { federated: userData.federated }),
		};
	}

	private async buildUserBatch(usersData: IImportUser[]): Promise<IUser[]> {
		return Promise.all(
			usersData.map(async (userData) => {
				const user = await this.buildNewUserObject(userData);
				return {
					createdAt: new Date(),
					_id: Random.id(),

					status: 'offline',
					...user,
					roles: userData.roles?.length ? userData.roles : ['user'],
					active: !userData.deleted,
					services: {
						...user.services,
						...(this._options.enableEmail2fa
							? {
									email2fa: {
										enabled: true,
										changedAt: new Date(),
									},
								}
							: {}),
					},
				} as IUser;
			}),
		);
	}

	async insertUser(userData: IImportUser): Promise<IUser['_id']> {
		const user = await this.buildNewUserObject(userData);

		return Accounts.insertUserDoc(
			{
				joinDefaultChannels: false,
				skipEmailValidation: true,
				skipAdminCheck: true,
				skipAdminEmail: true,
				skipOnCreateUserCallback: this._options.skipUserCallbacks,
				skipBeforeCreateUserCallback: this._options.skipUserCallbacks,
				skipAfterCreateUserCallback: this._options.skipUserCallbacks,
				skipDefaultAvatar: true,
				skipAppsEngineEvent: !!process.env.IMPORTER_SKIP_APPS_EVENT,
			},
			{
				...user,
				...(userData.roles?.length ? { globalRoles: userData.roles } : {}),
			},
		);
	}

	protected guessNameFromUsername(username: string): string {
		return username
			.replace(/\W/g, ' ')
			.replace(/\s(.)/g, (u) => u.toUpperCase())
			.replace(/^(.)/, (u) => u.toLowerCase())
			.replace(/^\w/, (u) => u.toUpperCase());
	}

	protected getDataType(): 'user' {
		return 'user';
	}
}
