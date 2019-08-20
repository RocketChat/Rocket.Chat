import { Federation } from '../index';

const denormalizeRoom = (resource) => {
	resource = { ...resource };

	if (resource.t === 'd') {
		resource.usernames = resource.usernames.map((u) => {
			const [username, domain] = u.split('@');

			return domain === Federation.domain ? username : u;
		});
	} else {
		// Denormalize room name
		const [roomName, roomDomain] = resource.name.split('@');

		resource.name = roomDomain === Federation.domain ? roomName : resource.name;

		// Denormalize room owner name
		const [username, userDomain] = resource.u.username.split('@');

		resource.u.username = userDomain === Federation.domain ? username : resource.u.username;

		// Denormalize muted users
		if (resource.muted) {
			resource.muted = resource.muted.map((u) => {
				const [username, domain] = u.split('@');

				return domain === Federation.domain ? username : u;
			});
		}

		// Denormalize unmuted users
		if (resource.unmuted) {
			resource.unmuted = resource.unmuted.map((u) => {
				const [username, domain] = u.split('@');

				return domain === Federation.unmuted ? username : u;
			});
		}
	}

	return resource;
};

const normalizeRoom = (resource, users) => {
	resource = { ...resource };

	let domains = '';

	if (resource.t === 'd') {
		// Handle user names, adding the Federation domain to local users
		resource.usernames = resource.usernames.map((u) => (u.indexOf('@') === -1 ? `${ u }@${ Federation.domain }` : u));

		// Get the domains of the usernames
		domains = resource.usernames.map((u) => u.split('@')[1]);
	} else {
		// Ensure private
		resource.t = 'p';

		// Normalize room name
		resource.name = resource.name.indexOf('@') === -1 ? `${ resource.name }@${ Federation.domain }` : resource.name;

		// Get the users domains
		domains = users.map((u) => u.federation.domain);

		// Normalize the username
		resource.u.username = resource.u.username.indexOf('@') === -1 ? `${ resource.u.username }@${ Federation.domain }` : resource.u.username;

		// Normalize the muted users
		if (resource.muted) {
			resource.muted = resource.muted.map((u) => (u.indexOf('@') === -1 ? `${ u }@${ Federation.domain }` : u));
		}

		// Normalize the unmuted users
		if (resource.unmuted) {
			resource.unmuted = resource.unmuted.map((u) => (u.indexOf('@') === -1 ? `${ u }@${ Federation.domain }` : u));
		}
	}

	// Federation
	resource.federation = resource.federation || {
		origin: resource.federation ? resource.federation.origin : Federation.domain, // The origin of this resource, where it was created
		domains, // The domains where this room exist (or will exist)
	};

	return resource;
};

export default {
	denormalizeRoom,
	normalizeRoom,
};
