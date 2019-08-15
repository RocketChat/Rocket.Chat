import { Federation } from '../index';
import { Users } from '../../../models/server';

const denormalizeUser = (resource) => {
	resource = { ...resource };

	resource.emails = [{
		address: resource.federation.originalInfo.email,
	}];

	const [username, domain] = resource.username.split('@');

	resource.username = domain === Federation.domain ? username : resource.username;

	return resource;
};

const denormalizeAllUsers = (resources) => resources.map(denormalizeUser);

const normalizeUser = (resource) => {
	resource = { ...resource };

	const email = resource.emails[0].address;

	resource.emails = [{
		address: `${ resource._id }@${ Federation.domain }`,
	}];

	resource.roles = ['user'];
	resource.status = 'online';
	resource.username = resource.username.indexOf('@') === -1 ? `${ resource.username }@${ Federation.domain }` : resource.username;

	// Federation
	resource.federation = resource.federation || {
		domain: Federation.domain,
		originalInfo: {
			email,
		},
	};

	// Persist the normalization
	Users.update({ _id: resource._id }, { $set: { federation: resource.federation } });

	return resource;
};

const normalizeAllUsers = (resources) => resources.map(normalizeUser);

export default {
	denormalizeUser,
	denormalizeAllUsers,
	normalizeUser,
	normalizeAllUsers,
};
