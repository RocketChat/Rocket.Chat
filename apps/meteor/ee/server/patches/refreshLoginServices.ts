import { refreshLoginServices } from '../../../server/lib/refreshLoginServices';
import { loadSamlServiceProviders } from '../lib/saml/lib/settings';

refreshLoginServices.patch(async (next) => {
	await next();
	await loadSamlServiceProviders();
});
