import { Federation } from '../index';

const denormalizeMessage = (resource) => {
	resource = { ...resource };

	const [username, domain] = resource.u.username.split('@');

	// Denormalize username
	resource.u.username = domain === Federation.domain ? username : resource.u.username;

	// Denormalize mentions
	for (const mention of resource.mentions) {
		// Ignore if we are dealing with all, here or rocket.cat
		if (['all', 'here', 'rocket.cat'].indexOf(mention.username) !== -1) { continue; }

		const [username, domain] = mention.username.split('@');

		if (domain === Federation.domain) {
			const originalUsername = mention.username;

			mention.username = username;

			resource.msg = resource.msg.split(originalUsername).join(username);
		}
	}

	// Denormalize channels
	for (const channel of resource.channels) {
		// Ignore if we are dealing with all, here or rocket.cat
		if (['all', 'here', 'rocket.cat'].indexOf(channel.name) !== -1) { continue; }

		const [username, domain] = channel.name.split('@');

		if (domain === Federation.domain) {
			const originalUsername = channel.name;

			channel.name = username;

			resource.msg = resource.msg.split(originalUsername).join(username);
		}
	}

	return resource;
};

const denormalizeAllMessages = (resources) => resources.map(denormalizeMessage);

const normalizeMessage = (resource) => {
	resource = { ...resource };

	resource.u.username = resource.u.username.indexOf('@') === -1 ? `${ resource.u.username }@${ Federation.domain }` : resource.u.username;

	// Federation
	resource.federation = resource.federation || {
		origin: Federation.domain, // The origin of this resource, where it was created
	};

	// Normalize mentions
	for (const mention of resource.mentions) {
		// Ignore if we are dealing with all, here or rocket.cat
		if (['all', 'here', 'rocket.cat'].indexOf(mention.username) !== -1) { continue; }

		if (mention.username.indexOf('@') === -1) {
			const originalUsername = mention.username;

			mention.username = `${ mention.username }@${ Federation.domain }`;

			resource.msg = resource.msg.split(originalUsername).join(mention.username);
		}
	}

	// Normalize channels
	for (const channel of resource.channels) {
		if (channel.name.indexOf('@') === -1) {
			const originalUsername = channel.name;

			channel.name = `${ channel.name }@${ Federation.domain }`;

			resource.msg = resource.msg.split(originalUsername).join(channel.name);
		}
	}

	return resource;
};

const normalizeAllMessages = (resources) => resources.map(normalizeMessage);

export default {
	denormalizeMessage,
	denormalizeAllMessages,
	normalizeMessage,
	normalizeAllMessages,
};
