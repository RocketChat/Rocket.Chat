declare module 'meteor/rocketchat:tap-i18n';
declare module 'meteor/littledata:synced-cron';
declare module 'meteor/promise';
declare module 'meteor/ddp-common';
declare module 'meteor/routepolicy';
declare module 'xml-encryption';
declare module 'webdav';

declare module 'meteor/konecty:multiple-instances-status' {
	namespace InstanceStatus {
		function getCollection(): Mongo.Collection<import('./definition/IInstanceStatus').IInstanceStatus>;
		function id(): string;
	}
}

declare const Package: {
	'disable-oplog': object;
};
