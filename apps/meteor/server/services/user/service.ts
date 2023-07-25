import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IUserService, UserDocOptions, CreateUserOptions } from '@rocket.chat/core-services';
import { Match } from 'meteor/check';
import { OAuthEncryption } from 'meteor/oauth-encryption';
import { Accounts } from 'meteor/accounts-base';
import { Roles, Users, Settings } from '@rocket.chat/models';
import type { InsertionModel } from '@rocket.chat/model-typings';
import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { escapeRegExp, escapeHTML } from '@rocket.chat/string-helpers';
import { hash as bcryptHash } from 'bcrypt';
import { SHA256 } from '@rocket.chat/sha256';
import { Random } from '@rocket.chat/random';

import { parseCSV } from '../../../lib/utils/parseCSV';
import { callbacks } from '../../../lib/callbacks';
import { settings } from '../../../app/settings/server';
import { getNewUserRoles } from './lib/getNewUserRoles';
import * as Mailer from '../../../app/mailer/server/api';
import { AppEvents, Apps } from '../../../ee/server/apps/orchestrator';
import { safeGetMeteorUser } from '../../../app/utils/server/functions/safeGetMeteorUser';
import { addUserToDefaultChannels } from '../../../app/lib/server/functions/addUserToDefaultChannels';
import { getAvatarSuggestionForUser } from '../../../app/lib/server/functions/getAvatarSuggestionForUser';
import { setAvatarFromServiceWithValidation } from '../../../app/lib/server/functions/setUserAvatar';
import { addUserRolesAsync } from '../../lib/roles/addUserRoles';
import { i18n } from '../../lib/i18n';
import { beforeCreateUserCallback } from '../../../lib/callbacks/beforeCreateUserCallback';

const emailTemplate = {
	subject() {
		const subject = i18n.t('Accounts_Admin_Email_Approval_Needed_Subject_Default');
		const siteName = settings.get('Site_Name');

		return `[${siteName}] ${subject}`;
	},

	html(options: UserDocOptions = {}) {
		const email = options.reason
			? 'Accounts_Admin_Email_Approval_Needed_With_Reason_Default'
			: 'Accounts_Admin_Email_Approval_Needed_Default';

		return Mailer.replace(i18n.t(email), {
			name: escapeHTML(options.name || ''),
			email: escapeHTML(options.email || ''),
			reason: escapeHTML(options.reason || ''),
		});
	},
};

export class UserService extends ServiceClassInternal implements IUserService {
	protected name = 'user';

	public async hashPassword(password: string | { algorithm: string; digest: string }): Promise<string> {
		if (typeof password !== 'string' && password.algorithm !== 'sha-256') {
			throw new Error(`Invalid password hash algorithm. Only 'sha-256' is allowed.`);
		}

		const passwordString = typeof password === 'string' ? SHA256(password) : password.digest;
		return bcryptHash(passwordString, Accounts._bcryptRounds());
	}

	private getNameFromProfile(profile: UserDocOptions['profile']): string | undefined {
		if (!profile) {
			return;
		}

		if (profile.name) {
			return profile.name;
		}

		if ('firstName' in profile && profile.firstName) {
			// LinkedIn old format
			if (typeof profile.firstName === 'string') {
				if (profile.lastName && typeof profile.lastName === 'string') {
					return `${profile.firstName} ${profile.lastName}`;
				}

				return profile.firstName;
			}

			const { firstName, lastName } = profile;

			// LinkedIn new format
			const { preferredLocale, localized: firstNameLocalized } = firstName;
			if (preferredLocale?.language && preferredLocale?.country && firstNameLocalized) {
				const locale = `${preferredLocale.language}_${preferredLocale.country}`;
				if (firstNameLocalized[locale]) {
					if (lastName && typeof lastName !== 'string' && lastName?.localized?.[locale]) {
						return `${firstNameLocalized[locale]} ${lastName.localized[locale]}`;
					}

					return firstNameLocalized[locale];
				}
			}
		}
	}

	private async notifyAdminOfNewUser(options: UserDocOptions, user: InsertionModel<IUser>): Promise<void> {
		const destinations: string[] = [];
		const usersInRole = await Roles.findUsersInRole('admin');
		await usersInRole.forEach((adminUser) => {
			if (Array.isArray(adminUser.emails)) {
				adminUser.emails.forEach((email) => {
					destinations.push(`${adminUser.name}<${email.address}>`);
				});
			}
		});

		const email = {
			to: destinations,
			from: settings.get<string>('From_Email'),
			subject: emailTemplate.subject(),
			html: emailTemplate.html({
				...options,
				name: options.name || options.profile?.name || user.name,
				email: options.email || user.emails?.[0].address,
			}),
		};

		await Mailer.send(email);
	}

	private async insertOne(user: InsertionModel<IUser>): Promise<IUser['_id']> {
		try {
			return (await Users.insertOne(user)).insertedId;
		} catch (e: any) {
			if (!e.errmsg) {
				throw e;
			}
			if (e.errmsg.includes('emails.address')) {
				throw new Meteor.Error(403, 'Email already exists.');
			}
			if (e.errmsg.includes('username')) {
				throw new Meteor.Error(403, 'Username already exists.');
			}

			throw e;
		}
	}

	public async create(options: UserDocOptions, doc: Partial<InsertionModel<IUser>>): Promise<IUser['_id']> {
		const globalRoles = [];

		if (Match.test(options.globalRoles, [String]) && options.globalRoles.length > 0) {
			globalRoles.push(...options.globalRoles);
		}

		delete options.globalRoles;

		if (doc.services && !doc.services.password) {
			const defaultAuthServiceRoles = parseCSV(settings.get('Accounts_Registration_AuthenticationServices_Default_Roles') || '');

			if (defaultAuthServiceRoles.length > 0) {
				globalRoles.push(...defaultAuthServiceRoles);
			}
		}

		const roles = getNewUserRoles(globalRoles);
		const { name = this.getNameFromProfile(options.profile) } = doc;

		const user: InsertionModel<IUser> = {
			createdAt: new Date(),
			_id: Random.id(),
			status: UserStatus.OFFLINE,

			...doc,
			type: doc.type || 'user',
			services: {
				...(doc.services || {}),
				...(settings.get<boolean>('Accounts_TwoFactorAuthentication_By_Email_Auto_Opt_In') ? { enabled: true, changedAt: new Date() } : {}),
			},
			active: doc.active ?? !settings.get('Accounts_ManuallyApproveNewUsers'),
			...(!!name && { name }),
			roles: [],
		};

		if (user.services) {
			const verified = settings.get<boolean>('Accounts_Verify_Email_For_External_Accounts');

			for (const service of Object.values(user.services) as Record<string, any>[]) {
				if (!user.name && typeof service === 'object' && ('name' in service || 'username' in service)) {
					user.name = service.name || service.username;
				}

				if (!user.emails && service.email) {
					user.emails = [
						{
							address: service.email,
							verified,
						},
					];
				}

				Object.keys(service).forEach((key) => {
					const value = service[key];
					// If there's any value that was encrypted without an userId, decrypt it and re-encrypt with the id.
					if (OAuthEncryption?.isSealed(value)) {
						service[key] = OAuthEncryption.seal(OAuthEncryption.open(value), user._id);
					}
				});
			}
		}

		await beforeCreateUserCallback.run(options, user);

		if (!user.active && settings.get('Accounts_ManuallyApproveNewUsers')) {
			await this.notifyAdminOfNewUser(options, user);
		}

		await callbacks.run('onCreateUser', options, user);

		// App IPostUserCreated event hook
		await Apps.triggerEvent(AppEvents.IPostUserCreated, { user, performedBy: await safeGetMeteorUser() });

		await this.validateNewUser(user);

		const _id = await this.insertOne(user);

		const newUser = await Users.findOne({
			_id,
		});

		if (!newUser) {
			throw new Error('error-user-not-found');
		}

		if (newUser.username) {
			await this.addUserToDefaultChannels(newUser, options);
			await this.callAfterCreateUser(newUser);
			await this.setDefaultAvatar(newUser);
		}

		const hasAdmin = await Users.findOneByRolesAndType('admin', 'user', { projection: { _id: 1 } });
		if (!roles.includes('admin') && !hasAdmin) {
			roles.push('admin');
			if (settings.get('Show_Setup_Wizard') === 'pending') {
				await Settings.updateValueById('Show_Setup_Wizard', 'in_progress');
			}
		}

		await addUserRolesAsync(_id, roles);
		return _id;
	}

	private async addUserToDefaultChannels(user: IUser, options: UserDocOptions): Promise<void> {
		if (options.joinDefaultChannels === false) {
			return;
		}

		return addUserToDefaultChannels(user, Boolean(options.joinDefaultChannelsSilenced));
	}

	private async callAfterCreateUser(user: IUser): Promise<void> {
		if (user.type === 'visitor') {
			return;
		}

		setImmediate(function () {
			return callbacks.run('afterCreateUser', user);
		});
	}

	private async setDefaultAvatar(user: IUser): Promise<void> {
		if (settings.get('Accounts_SetDefaultAvatar') === true) {
			const avatarSuggestions = await getAvatarSuggestionForUser(user);

			for await (const service of Object.keys(avatarSuggestions)) {
				const avatarData = avatarSuggestions[service];
				if (service !== 'gravatar') {
					return setAvatarFromServiceWithValidation(user._id, avatarData.blob, '', service);
				}
			}
		}
	}

	private async validateNewUser(user: InsertionModel<IUser>): Promise<void> {
		// validateNewUser
		await this.validateRegistrationDisabled(user);
		await this.validateDomainAllowList(user);
	}

	private async validateRegistrationDisabled(user: InsertionModel<IUser>): Promise<void> {
		if (user.type === 'visitor') {
			return;
		}

		if (
			settings.get('Accounts_Registration_AuthenticationServices_Enabled') === false &&
			settings.get('LDAP_Enable') === false &&
			!user.services?.password
		) {
			throw new Meteor.Error('registration-disabled-authentication-services', 'User registration is disabled for authentication services');
		}
	}

	private async validateDomainAllowList(user: InsertionModel<IUser>): Promise<void> {
		if (user.type === 'visitor') {
			return;
		}

		const allowedDomainList = settings.get<string>('Accounts_AllowedDomainsList')?.trim();
		if (!allowedDomainList?.length) {
			return;
		}

		const domainList = allowedDomainList.split(',').map((domain) => domain.trim());

		if (user.emails && user.emails.length > 0) {
			const email = user.emails[0].address;
			const inWhiteList = domainList.some((domain) => email.match(`@${escapeRegExp(domain)}$`));

			if (inWhiteList === false) {
				throw new Meteor.Error('error-invalid-domain');
			}
		}
	}

	public async createWithPassword(options: CreateUserOptions): Promise<IUser['_id']> {
		const { username, email, password } = options;
		if (!username && !email) {
			throw new Meteor.Error(400, 'Need to set a username or email');
		}

		// #TODO: Check if username and email are not already in use.

		const user = {
			...(username ? { username } : {}),
			...(email ? { emails: [{ address: email, verified: false }] } : {}),
			...(password ? { services: { password: { bcrypt: await this.hashPassword(password) } } } : {}),
		};

		return this.create(options, user);
	}
}
