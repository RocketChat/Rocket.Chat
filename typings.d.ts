declare module 'meteor/rocketchat:tap-i18n';
declare module 'meteor/littledata:synced-cron';
declare module 'meteor/promise';
declare module 'meteor/ddp-common';
declare module 'meteor/routepolicy';
declare module 'xml-encryption';
declare module 'webdav';

declare module 'meteor/konecty:user-presence' {
	namespace UserPresenceMonitor {
		function processUserSession(userSession: any, event: string): void;
	}

	namespace UserPresence {
		function removeConnectionsByInstanceId(id: string): void;
	}
}

declare const Package: {
	'disable-oplog': object;
};

declare module 'meteor/meteorhacks:inject-initial' {
	namespace Inject {
		function rawBody(key: string, value: string): void;
	}
}
