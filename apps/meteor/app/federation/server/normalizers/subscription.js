import { getNameAndDomain, isFullyQualified } from '../functions/helpers';
import { getFederationDomain } from '../lib/getFederationDomain';

const denormalizeSubscription = (originalResource) => {
	const resource = { ...originalResource };

	const [username, domain] = getNameAndDomain(resource.u.username);

	resource.u.username = domain === getFederationDomain() ? username : resource.u.username;

	const [nameUsername, nameDomain] = getNameAndDomain(resource.name);

	resource.name = nameDomain === getFederationDomain() ? nameUsername : resource.name;

	return resource;
};

const denormalizeAllSubscriptions = (resources) => resources.map(denormalizeSubscription);

const normalizeSubscription = (originalResource) => {
	const resource = { ...originalResource };

	resource.u.username = !isFullyQualified(resource.u.username) ? `${resource.u.username}@${getFederationDomain()}` : resource.u.username;

	resource.name = !isFullyQualified(resource.name) ? `${resource.name}@${getFederationDomain()}` : resource.name;

	// Federation
	resource.federation = resource.federation || {
		origin: getFederationDomain(), // The origin of this resource, where it was created
	};

	return resource;
};

const normalizeAllSubscriptions = (resources) => resources.map(normalizeSubscription);

export default {
	denormalizeSubscription,
	denormalizeAllSubscriptions,
	normalizeSubscription,
	normalizeAllSubscriptions,
};
