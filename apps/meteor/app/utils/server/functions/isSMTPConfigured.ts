import { settings } from '../../../settings/server';

export const isSMTPConfigured = (): boolean => {
	const isMailURLSet = !(process.env.MAIL_URL === 'undefined' || process.env.MAIL_URL === undefined);
	return Boolean(settings.get('SMTP_Host')) || isMailURLSet;
};
