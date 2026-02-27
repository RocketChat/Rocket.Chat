import type { ServerMethods } from '@rocket.chat/ddp-client';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		loadLocale(locale: string): string | undefined;
	}
}

// Locale loading for date formatting is now handled client-side with date-fns/Intl.
// This method is kept for backwards compatibility but returns undefined.
Meteor.methods<ServerMethods>({
	loadLocale(locale) {
		check(locale, String);
		return undefined;
	},
});
