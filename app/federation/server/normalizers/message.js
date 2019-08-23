import { Federation } from '../index';
import { getNameAndDomain, isFullyQualified } from './helpers/federatedResources';

const denormalizeMessage = (originalResource) => {
	const resource = { ...originalResource };

	const [username, domain] = getNameAndDomain(resource.u.username);

	// Denormalize username
	resource.u.username = domain === Federation.domain ? username : resource.u.username;

	// Denormalize mentions
	for (const mention of resource.mentions) {
		// Ignore if we are dealing with all, here or rocket.cat
		if (['all', 'here', 'rocket.cat'].indexOf(mention.username) !== -1) { continue; }

		const [username, domain] = getNameAndDomain(mention.username);

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

		const [username, domain] = getNameAndDomain(channel.name);

		if (domain === Federation.domain) {
			const originalUsername = channel.name;

			channel.name = username;

			resource.msg = resource.msg.split(originalUsername).join(username);
		}
	}

	return resource;
};

const denormalizeAllMessages = (resources) => resources.map(denormalizeMessage);

const normalizeMessage = (originalResource) => {
	const resource = { ...originalResource };

	resource.u.username = !isFullyQualified(resource.u.username) ? `${ resource.u.username }@${ Federation.domain }` : resource.u.username;

	// Federation
	resource.federation = resource.federation || {
		origin: Federation.domain, // The origin of this resource, where it was created
	};

	// Normalize mentions
	for (const mention of resource.mentions) {
		// Ignore if we are dealing with all, here or rocket.cat
		if (['all', 'here', 'rocket.cat'].indexOf(mention.username) !== -1) { continue; }

		if (!isFullyQualified(mention.username)) {
			const originalUsername = mention.username;

			mention.username = `${ mention.username }@${ Federation.domain }`;

			resource.msg = resource.msg.split(originalUsername).join(mention.username);
		}
	}

	// Normalize channels
	for (const channel of resource.channels) {
		if (!isFullyQualified(channel.name)) {
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
