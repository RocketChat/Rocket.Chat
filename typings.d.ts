/* eslint-disable @typescript-eslint/interface-name-prefix */
import 'mongodb';

declare module 'meteor/rocketchat:tap-i18n';
declare module 'meteor/littledata:synced-cron';
declare module 'meteor/promise';
declare module 'meteor/ddp-common';
declare module 'meteor/routepolicy';
declare module 'xml-encryption';
declare module 'webdav';

declare module 'mongodb' {
	export interface FindOneOptions<T> {
		awaitData?: boolean;
	}
}
