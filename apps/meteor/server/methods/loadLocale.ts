import type { ServerMethods } from '@rocket.chat/ddp-client';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';
import { getMomentLocale } from '../lib/getMomentLocale';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		loadLocale(locale: string): string | undefined;
	}
}

Meteor.methods<ServerMethods>({
	/**
	 * @deprecated Scheduled for removal in 9.0.0. No caller found in this repository — kept for external DDP clients only.
	 */
	loadLocale(locale) {
		methodDeprecationLogger.method('loadLocale', '9.0.0', []);
		check(locale, String);

		try {
			return getMomentLocale(locale);
		} catch (error: any) {
			throw new Meteor.Error(error.message, `Moment locale not found: ${locale}`);
		}
	},
});
