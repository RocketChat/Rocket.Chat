import { App } from '../types';

export const filterAppsMarketplace =
	(text: string) =>
	({ name, marketplace }: App): boolean =>
		marketplace !== false && name.toLowerCase().indexOf(text.toLowerCase()) > -1;
