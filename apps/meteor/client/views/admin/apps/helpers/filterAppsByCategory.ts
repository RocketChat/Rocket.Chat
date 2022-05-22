import { App } from '../types';

export const filterAppsByCategory = (app: App, category: string): boolean => !app.categories || app.categories.some((c) => c === category);
