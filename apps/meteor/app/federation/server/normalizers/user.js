import _ from 'underscore';

import { Users } from '../../../models/server';
import { getNameAndDomain, isFullyQualified } from '../functions/helpers';
import { getFederationDomain } from '../lib/getFederationDomain';

const denormalizeUser = (originalResource) => {
	const resource = { ...originalResource };

	// Only denormalize local emails
	if (resource.federation && resource.federation.origin === getFederationDomain()) {
		resource.emails = [
			{
				address: resource.federation.originalInfo.email,
			},
		];
	}

	const [username, domain] = getNameAndDomain(resource.username);

	resource.username = domain === getFederationDomain() ? username : resource.username;

	return resource;
};

const denormalizeAllUsers = (resources) => resources.map(denormalizeUser);

const normalizeUser = (originalResource) => {
	// Get only what we need, non-sensitive data
	const resource = _.pick(
		originalResource,
		'_id',
		'username',
		'type',
		'emails',
		'name',
		'federation',
		'isRemote',
		'createdAt',
		'_updatedAt',
	);

	resource.emails = [
		{
			address: `${resource._id}@${getFederationDomain()}`,
		},
	];
	const email = resource.emails[0].address;

	resource.active = true;
	resource.roles = ['user'];
	resource.status = 'online';
	resource.username = !isFullyQualified(resource.username) ? `${resource.username}@${getFederationDomain()}` : resource.username;

	// Federation
	resource.federation = resource.federation || {
		origin: getFederationDomain(),
		originalInfo: {
			email,
		},
	};

	resource.isRemote = resource.federation.origin !== getFederationDomain();

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
