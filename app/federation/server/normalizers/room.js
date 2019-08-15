import { Federation } from '../index';

const denormalizeRoom = (resource) => {
	resource = { ...resource };

	resource.usernames = resource.usernames.map((u) => {
		const [username, domain] = u.split('@');

		return domain === Federation.domain ? username : u;
	});

	return resource;
};

const denormalizeAllRooms = (resources) => resources.map(denormalizeRoom);

const normalizeRoom = (resource) => {
	resource = { ...resource };

	// Handle user names, adding the Federation domain to local users
	resource.usernames = resource.usernames.map((u) => (u.indexOf('@') === -1 ? `${ u }@${ Federation.domain }` : u));

	// Federation
	resource.federation = resource.federation || {
		origin: resource.federation ? resource.federation.origin : Federation.domain, // The origin of this resource, where it was created
		domains: resource.usernames.map((u) => u.split('@')[1]), // The domains where this room exist (or will exist)
	};

	return resource;
};

const normalizeAllRooms = (resources) => resources.map(normalizeRoom);

export default {
	denormalizeRoom,
	denormalizeAllRooms,
	normalizeRoom,
	normalizeAllRooms,
};
