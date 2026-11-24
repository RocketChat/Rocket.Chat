import type { IUser, PasswordTokenRecord } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { escapeHTML } from '@rocket.chat/tools';

import { safeHtmlDots } from '../../../lib/utils/safeHtmlDots';
import { settings } from '../../settings';
import { i18n } from '../i18n';
import * as Mailer from '../notifications/email/api';
import { getWorkspaceURL } from '../utils/getURL';

let verifyEmailTemplate = '';
let enrollAccountTemplate = '';
let resetPasswordTemplate = '';
Mailer.getTemplateWrapped('Verification_Email', (value) => {
	verifyEmailTemplate = value;
});
Mailer.getTemplateWrapped('Accounts_Enrollment_Email', (value) => {
	enrollAccountTemplate = value;
});
Mailer.getTemplateWrapped('Forgot_Password_Email', (value) => {
	resetPasswordTemplate = value;
});

export const getAccountEmailSender = (): string => `${settings.get<string>('Site_Name')} <${settings.get<string>('From_Email')}>`;

export const getUserToActivateEmail = (options: { name?: string; email?: string; reason?: string }) => {
	const subject = i18n.t('Accounts_Admin_Email_Approval_Needed_Subject_Default');
	const email = options.reason
		? 'Accounts_Admin_Email_Approval_Needed_With_Reason_Default'
		: 'Accounts_Admin_Email_Approval_Needed_Default';

	return {
		subject: `[${settings.get<string>('Site_Name')}] ${subject}`,
		html: Mailer.replace(i18n.t(email), {
			name: escapeHTML(options.name ?? ''),
			email: escapeHTML(options.email ?? ''),
			reason: escapeHTML(options.reason ?? ''),
		}),
	};
};

export const getUserActivatedEmail = ({ active, name, username }: { active: boolean; name?: string; username?: string }) => {
	const activated = username ? 'Activated' : 'Approved';
	const bodyAction = active ? activated : 'Deactivated';
	// The subject has always said "approved", even when the body says "activated".
	const subjectAction = active ? 'Approved' : 'Deactivated';

	return {
		subject: `[${settings.get<string>('Site_Name')}] ${i18n.t(`Accounts_Email_${subjectAction}_Subject`)}`,
		html: Mailer.replace(i18n.t(`Accounts_Email_${bodyAction}`), {
			name: escapeHTML(name ?? ''),
		}),
	};
};

const logUrlInDevelopment = (label: string, url: string) => {
	if (process.env.NODE_ENV === 'development') {
		console.log(`\n${label} URL: ${url}`);
	}
};

const getUser = async (userId: IUser['_id']): Promise<IUser> => {
	const user = await Users.findOneById(userId);
	if (!user) {
		throw new Error("Can't find user");
	}
	return user;
};

const assertUserEmail = (user: IUser, email: string | undefined): string => {
	if (!email || !user.emails?.some(({ address }) => address === email)) {
		throw new Error('No such email for user.');
	}
	return email;
};

const createPasswordToken = async (user: IUser, email: string | undefined, reason: PasswordTokenRecord['reason']) => {
	const tokenRecord: PasswordTokenRecord = {
		token: Random.secret(),
		email: assertUserEmail(user, email ?? user.emails?.[0]?.address),
		when: new Date(),
		reason,
	};

	if (reason === 'enroll') {
		await Users.setPasswordEnrollToken(user._id, tokenRecord);
	} else {
		await Users.setPasswordResetToken(user._id, tokenRecord);
	}

	return tokenRecord;
};

/** Defaults to the user's first address; rejects an address the user doesn't have. */
export async function sendResetPasswordEmail(userId: IUser['_id'], email?: string): Promise<void> {
	const user = await getUser(userId);
	const { token, email: to } = await createPasswordToken(user, email, 'reset');
	const url = getWorkspaceURL(`reset-password/${token}`);

	await Mailer.sendNoWrap({
		to,
		from: getAccountEmailSender(),
		subject: Mailer.replace(settings.get<string>('Forgot_Password_Email_Subject') || '', { name: user.name }),
		html: Mailer.replacekey(Mailer.replace(resetPasswordTemplate, { name: user.name }), 'Forgot_Password_Url', url),
	});

	logUrlInDevelopment('Reset password', url);
}

/** Defaults to the user's first address; rejects an address the user doesn't have. */
export async function sendEnrollmentEmail(userId: IUser['_id'], email?: string): Promise<void> {
	const user = await getUser(userId);
	const { token, email: to } = await createPasswordToken(user, email, 'enroll');

	await Mailer.sendNoWrap({
		to,
		from: getAccountEmailSender(),
		subject: Mailer.replace(settings.get<string>('Accounts_Enrollment_Email_Subject'), { ...user }),
		html: Mailer.replace(enrollAccountTemplate, {
			name: escapeHTML(user.name ?? ''),
			email: user.emails?.[0] && escapeHTML(user.emails[0].address),
		}),
	});

	logUrlInDevelopment('Enrollment email', getWorkspaceURL(`#/enroll-account/${token}`));
}

/** Defaults to the user's first unverified address; rejects an address the user doesn't have. */
export async function sendVerificationEmail(userId: IUser['_id'], email?: string): Promise<void> {
	const user = await getUser(userId);

	const address = email ?? user.emails?.find(({ verified }) => !verified)?.address;
	if (!address) {
		throw new Error('That user has no unverified email addresses.');
	}

	const tokenRecord = { token: Random.secret(), address: assertUserEmail(user, address), when: new Date() };
	await Users.addEmailVerificationToken(user._id, tokenRecord);

	const url = getWorkspaceURL(`#/verify-email/${tokenRecord.token}`);

	await Mailer.sendNoWrap({
		to: tokenRecord.address,
		from: getAccountEmailSender(),
		subject: Mailer.replace(settings.get<string>('Verification_Email_Subject') || ''),
		html: Mailer.replace(verifyEmailTemplate, { Verification_Url: url, name: safeHtmlDots(user.name ?? '') }),
	});

	logUrlInDevelopment('Verification email', url);
}
