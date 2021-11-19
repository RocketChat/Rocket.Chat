import { App } from '../types';

export const filterAppsInstalled = (text: string): ((app: App) => boolean) => {
	if (!text) {
		return (app): boolean => Boolean(app.installed);
	}

	return (app): boolean =>
		Boolean(app.installed && app.name.toLowerCase().indexOf(text.toLowerCase()) > -1);
};
