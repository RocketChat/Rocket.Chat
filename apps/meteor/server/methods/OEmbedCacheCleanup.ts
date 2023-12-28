import { OEmbedCache } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { settings } from '../../app/settings/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		OEmbedCacheCleanup(): { message: string };
	}
}

export const executeClearOEmbedCache = async () => {
	const date = new Date();
	const expirationDays = settings.get<number>('API_EmbedCacheExpirationDays');
	date.setDate(date.getDate() - expirationDays);
	await OEmbedCache.removeBeforeDate(date);
};

Meteor.methods<ServerMethods>({
	async OEmbedCacheCleanup() {
		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'clear-oembed-cache'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'OEmbedCacheCleanup',
			});
		}

		await executeClearOEmbedCache();
		return {
			message: 'cache_cleared',
			params: [],
		};
	},
});
