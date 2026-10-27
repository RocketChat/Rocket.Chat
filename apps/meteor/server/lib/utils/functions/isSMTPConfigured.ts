import { settings } from '../../../settings';

export const isSMTPConfigured = (): boolean => Boolean(settings.get('SMTP_Host') || process.env.MAIL_URL);
