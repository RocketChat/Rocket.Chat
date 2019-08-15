import { Federation } from '../index';

const denormalizeMessage = (resource) => {
	resource = { ...resource };

	const [username, domain] = resource.u.username.split('@');

	resource.u.username = domain === Federation.domain ? username : resource.u.username;

	return resource;
};

const denormalizeAllMessages = (resources) => resources.map(denormalizeMessage);

const normalizeMessage = (resource) => {
	resource = { ...resource };

	resource.u.username = resource.u.username.indexOf('@') === -1 ? `${ resource.u.username }@${ Federation.domain }` : resource.u.username;

	// Federation
	resource.federation = resource.federation || {
		origin: resource.federation ? resource.federation.origin : Federation.domain, // The origin of this resource, where it was created
	};

	return resource;
};

const normalizeAllMessages = (resources) => resources.map(normalizeMessage);

export default {
	denormalizeMessage,
	denormalizeAllMessages,
	normalizeMessage,
	normalizeAllMessages,
};
