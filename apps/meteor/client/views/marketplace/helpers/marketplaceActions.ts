import { installApp } from './installApp';
import { updateApp } from './updateApp';

export const marketplaceActions = {
	purchase: installApp,
	install: installApp,
	update: updateApp,
};
