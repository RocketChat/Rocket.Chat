import type { IImportUser } from '@rocket.chat/core-typings';

export function generateTempPassword(userData: IImportUser): string {
	return `${Date.now()}${userData.name || ''}${userData.emails.length ? userData.emails[0].toUpperCase() : ''}`;
}
