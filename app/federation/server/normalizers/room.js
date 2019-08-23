import { Federation } from '../index';
import { getNameAndDomain, isFullyQualified } from './helpers/federatedResources';

const denormalizeRoom = (originalResource) => {
	const resource = { ...originalResource };

	if (resource.t === 'd') {
		resource.usernames = resource.usernames.map((u) => {
			const [username, domain] = getNameAndDomain(u);

			return domain === Federation.domain ? username : u;
		});
	} else {
		// Denormalize room name
		const [roomName, roomDomain] = getNameAndDomain(resource.name);

		resource.name = roomDomain === Federation.domain ? roomName : resource.name;

		// Denormalize room owner name
		const [username, userDomain] = getNameAndDomain(resource.u.username);

		resource.u.username = userDomain === Federation.domain ? username : resource.u.username;

		// Denormalize muted users
		if (resource.muted) {
			resource.muted = resource.muted.map((u) => {
				const [username, domain] = getNameAndDomain(u);

				return domain === Federation.domain ? username : u;
			});
		}

		// Denormalize unmuted users
		if (resource.unmuted) {
			resource.unmuted = resource.unmuted.map((u) => {
				const [username, domain] = getNameAndDomain(u);

				return domain === Federation.unmuted ? username : u;
			});
		}
	}

	return resource;
};

const normalizeRoom = (originalResource, users) => {
	const resource = { ...originalResource };

	let domains = '';

	if (resource.t === 'd') {
		// Handle user names, adding the Federation domain to local users
		resource.usernames = resource.usernames.map((u) => (!isFullyQualified(u) ? `${ u }@${ Federation.domain }` : u));

		// Get the domains of the usernames
		domains = resource.usernames.map((u) => getNameAndDomain(u)[1]);
	} else {
		// Ensure private
		resource.t = 'p';

		// Normalize room name
		resource.name = !isFullyQualified(resource.name) ? `${ resource.name }@${ Federation.domain }` : resource.name;

		// Get the users domains
		domains = users.map((u) => u.federation.origin);

		// Normalize the username
		resource.u.username = !isFullyQualified(resource.u.username) ? `${ resource.u.username }@${ Federation.domain }` : resource.u.username;

		// Normalize the muted users
		if (resource.muted) {
			resource.muted = resource.muted.map((u) => (!isFullyQualified(u) ? `${ u }@${ Federation.domain }` : u));
		}

		// Normalize the unmuted users
		if (resource.unmuted) {
			resource.unmuted = resource.unmuted.map((u) => (!isFullyQualified(u) ? `${ u }@${ Federation.domain }` : u));
		}
	}

	// Federation
	resource.federation = resource.federation || {
		origin: Federation.domain, // The origin of this resource, where it was created
		domains, // The domains where this room exist (or will exist)
	};

	return resource;
};

export default {
	denormalizeRoom,
	normalizeRoom,
};
