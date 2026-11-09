import type { IAppContactsConverter } from './IAppContactsConverter.js';
import type { IAppDepartmentsConverter } from './IAppDepartmentsConverter.js';
import type { IAppMessagesConverter } from './IAppMessagesConverter.js';
import type { IAppRolesConverter } from './IAppRolesConverter.js';
import type { IAppRoomsConverter } from './IAppRoomsConverter.js';
import type { IAppSettingsConverter } from './IAppSettingsConverter.js';
import type { IAppThreadsConverter } from './IAppThreadsConverter.js';
import type { IAppUploadsConverter } from './IAppUploadsConverter.js';
import type { IAppUsersConverter } from './IAppUsersConverter.js';
import type { IAppVideoConferencesConverter } from './IAppVideoConferencesConverter.js';
import type { IAppVisitorsConverter } from './IAppVisitorsConverter.js';

type AppConverters = {
	contacts: IAppContactsConverter;
	departments: IAppDepartmentsConverter;
	messages: IAppMessagesConverter;
	rooms: IAppRoomsConverter;
	roles: IAppRolesConverter;
	settings: IAppSettingsConverter;
	threads: IAppThreadsConverter;
	uploads: IAppUploadsConverter;
	users: IAppUsersConverter;
	visitors: IAppVisitorsConverter;
	videoConferences: IAppVideoConferencesConverter;
};

export interface IAppConvertersMap extends Map<keyof AppConverters, AppConverters[keyof AppConverters]> {
	get<T extends keyof AppConverters>(key: T): AppConverters[T];
}
