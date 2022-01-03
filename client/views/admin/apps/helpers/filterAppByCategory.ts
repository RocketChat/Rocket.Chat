import { App } from '../types';

export const filterAppByCategory = (app: App, category: string): boolean => !app.categories || app.categories.some((c) => c === category);
