import { Federation } from '../index';

const denormalizeSubscription = (resource) => {
	resource = { ...resource };

	const [username, domain] = resource.u.username.split('@');

	resource.u.username = domain === Federation.domain ? username : resource.u.username;

	const [nameUsername, nameDomain] = resource.name.split('@');

	resource.name = nameDomain === Federation.domain ? nameUsername : resource.name;

	return resource;
};

const denormalizeAllSubscriptions = (resources) => resources.map(denormalizeSubscription);

const normalizeSubscription = (resource) => {
	resource = { ...resource };

	resource.u.username = resource.u.username.indexOf('@') === -1 ? `${ resource.u.username }@${ Federation.domain }` : resource.u.username;

	resource.name = resource.name.indexOf('@') === -1 ? `${ resource.name }@${ Federation.domain }` : resource.name;

	// Federation
	resource.federation = resource.federation || {
		origin: resource.federation ? resource.federation.origin : Federation.domain, // The origin of this resource, where it was created
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
