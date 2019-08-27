import { Federation } from '../index';
import { getNameAndDomain, isFullyQualified } from './helpers/federatedResources';

const denormalizeSubscription = (originalResource) => {
	const resource = { ...originalResource };

	const [username, domain] = getNameAndDomain(resource.u.username);

	resource.u.username = domain === Federation.domain ? username : resource.u.username;

	const [nameUsername, nameDomain] = getNameAndDomain(resource.name);

	resource.name = nameDomain === Federation.domain ? nameUsername : resource.name;

	return resource;
};

const denormalizeAllSubscriptions = (resources) => resources.map(denormalizeSubscription);

const normalizeSubscription = (originalResource) => {
	const resource = { ...originalResource };

	resource.u.username = !isFullyQualified(resource.u.username) ? `${ resource.u.username }@${ Federation.domain }` : resource.u.username;

	resource.name = !isFullyQualified(resource.name) ? `${ resource.name }@${ Federation.domain }` : resource.name;

	// Federation
	resource.federation = resource.federation || {
		origin: Federation.domain, // The origin of this resource, where it was created
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
