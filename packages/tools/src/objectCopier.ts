import type { IUser, IUserSettings, IUserServices } from '@rocket.chat/core-typings';

export const copyUserSettings = (setting: IUserSettings) => ({
	...setting,
	...(setting.preferences && { preferences: { ...setting.preferences } }),
});

export const copyUserBanners = (banners: NonNullable<IUser['banners']>): typeof banners => ({
	...Object.entries(banners).reduce((accum: NonNullable<IUser['banners']>, [key, value]) => {
		accum[key] = {
			...value,
			...(value.textArguments?.length && { textArguments: [...value.textArguments] }),
			...(value.modifiers?.length && { modifiers: [...value.modifiers] }),
		};
		return accum;
	}, {}),
});

export const copyUserServices = (services: IUserServices): IUserServices => ({
	...(services.password && { password: { ...services.password } }),
	...(services.passwordHistory?.length && { passwordHistory: [...services.passwordHistory] }),
	...(services.email && { email: { ...services.email } }),
	...(services.resume && {
		resume: { ...services.resume, loginTokens: services.resume.loginTokens ? [...services.resume.loginTokens] : [] },
	}),
	...(services.cloud && { cloud: { ...services.cloud } }),
	...(services.totp && { totp: { ...services.totp, hashedBackup: [...(services.totp.hashedBackup || [])] } }),
	...(services.email2fa && { email2fa: { ...services.email2fa } }),
	...(services.emailCode && { emailCode: { ...services.emailCode } }),
	...(services.google && { google: { ...services.google } }),
	...(services.facebook && { facebook: { ...services.facebook } }),
	...(services.github && { github: { ...services.github } }),
	...(services.linkedin && { linkedin: { ...services.linkedin } }),
	...(services.twitter && { twitter: { ...services.twitter } }),
	...(services.gitlab && { gitlab: { ...services.gitlab } }),
	...(services.saml && { saml: { ...services.saml } }),
	...(services.ldap && { ldap: { ...services.ldap } }),
	...(services.nextcloud && { nextcloud: { ...services.nextcloud } }),
	...(services.dolphin && { dolphin: { ...services.dolphin } }),
});

// ignores deprecated properties
export const copyUserObject = (user: IUser): IUser => ({
	...user,
	...(user.roles?.length && { roles: [...user.roles] }),
	...(user.services && { services: copyUserServices(user.services) }),
	...(user.emails?.length && { emails: user.emails.map((email) => ({ ...email })) }),
	...(user.oauth?.authorizedClients?.length && { oauth: { authorizedClients: [...user.oauth.authorizedClients] } }),
	...(user.e2e && { e2e: { ...user.e2e } }),
	...(user.customFields && { customFields: { ...user.customFields } }),
	...(user.settings && { settings: copyUserSettings(user.settings) }),
	...(user.banners && { banners: copyUserBanners(user.banners) }),
	...(user.importIds && { importIds: { ...user.importIds } }),
	...(user.roomRolePriorities && { roomRolePriorities: { ...user.roomRolePriorities } }),
});
