export interface ISettingsService {
	get<T>(settingId: string): Promise<T>;
}
