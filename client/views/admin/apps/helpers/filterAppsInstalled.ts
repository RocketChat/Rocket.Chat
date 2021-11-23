import { App } from '../types';

export const filterAppsInstalled = (app: App): boolean => Boolean(app.installed);
