import _ from 'underscore';

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
	// Get only what we need, non-sensitive data
	resource = _.pick(resource, '_id', 'username', 'type', 'emails', 'name', 'federation', 'isRemote', 'createdAt', '_updatedAt');

	const email = resource.emails[0].address;

	resource.emails = [{
		address: `${ resource._id }@${ Federation.domain }`,
	}];

	resource.active = true;
	resource.roles = ['user'];
	resource.status = 'online';
	resource.username = resource.username.indexOf('@') === -1 ? `${ resource.username }@${ Federation.domain }` : resource.username;

	// Federation
	resource.federation = resource.federation || {
		origin: Federation.domain,
		originalInfo: {
			email,
		},
	};

	resource.isRemote = resource.federation.origin !== Federation.domain;

	// Persist the normalization
	Users.update({ _id: resource._id }, { $set: { isRemote: resource.isRemote, federation: resource.federation } });

	return resource;
};

const normalizeAllUsers = (resources) => resources.map(normalizeUser);

export default {
	denormalizeUser,
	denormalizeAllUsers,
	normalizeUser,
	normalizeAllUsers,
};
