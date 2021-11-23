import { App } from '../types';

export const filterAppsInstalled = (app: App): boolean => {
	return Boolean(app.installed);
};
