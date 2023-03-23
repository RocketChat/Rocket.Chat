import installApp from './installApp';
import updateApp from './updateApp';

const marketplaceActions = {
	purchase: installApp,
	install: installApp,
	update: updateApp,
};

export default marketplaceActions;
