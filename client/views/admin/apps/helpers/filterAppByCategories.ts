import { App } from '../types';

export const filterAppByCategories = (app: App, categories: string[]): boolean =>
	!app.categories || categories.length === 0 || app.categories.some((c) => categories.includes(c));
