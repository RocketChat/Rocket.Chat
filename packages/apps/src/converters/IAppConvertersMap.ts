import type { IAppDepartmentsConverter } from './IAppDepartmentsConverter';
import type { IAppMessagesConverter } from './IAppMessagesConverter';
import type { IAppRolesConverter } from './IAppRolesConverter';
import type { IAppRoomsConverter } from './IAppRoomsConverter';
import type { IAppSettingsConverter } from './IAppSettingsConverter';
import type { IAppThreadsConverter } from './IAppThreadsConverter';
import type { IAppUploadsConverter } from './IAppUploadsConverter';
import type { IAppUsersConverter } from './IAppUsersConverter';
import type { IAppVideoConferencesConverter } from './IAppVideoConferencesConverter';
import type { IAppVisitorsConverter } from './IAppVisitorsConverter';

type AppConverters = {
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
