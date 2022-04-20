import { getNameAndDomain, isFullyQualified } from '../functions/helpers';
import { getFederationDomain } from '../lib/getFederationDomain';

const denormalizeMessage = (originalResource) => {
	const resource = { ...originalResource };

	const [username, domain] = getNameAndDomain(resource.u.username);

	const localDomain = getFederationDomain();

	// Denormalize username
	resource.u.username = domain === localDomain ? username : resource.u.username;

	// Denormalize mentions
	for (const mention of resource.mentions) {
		// Ignore if we are dealing with all, here or rocket.cat
		if (['all', 'here', 'rocket.cat'].indexOf(mention.username) !== -1) {
			continue;
		}

		const [username, domain] = getNameAndDomain(mention.username);

		if (domain === localDomain) {
			const originalUsername = mention.username;

			mention.username = username;

			resource.msg = resource.msg.split(originalUsername).join(username);
		}
	}

	// Denormalize channels
	for (const channel of resource.channels) {
		// Ignore if we are dealing with all, here or rocket.cat
		if (['all', 'here', 'rocket.cat'].indexOf(channel.name) !== -1) {
			continue;
		}

		const [username, domain] = getNameAndDomain(channel.name);

		if (domain === localDomain) {
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

	resource.u.username = !isFullyQualified(resource.u.username) ? `${resource.u.username}@${getFederationDomain()}` : resource.u.username;

	// Federation
	resource.federation = resource.federation || {
		origin: getFederationDomain(), // The origin of this resource, where it was created
	};

	// Normalize mentions
	for (const mention of resource.mentions || []) {
		// Ignore if we are dealing with all, here or rocket.cat
		if (['all', 'here', 'rocket.cat'].indexOf(mention.username) !== -1) {
			continue;
		}

		if (!isFullyQualified(mention.username)) {
			const originalUsername = mention.username;

			mention.username = `${mention.username}@${getFederationDomain()}`;

			resource.msg = resource.msg.split(originalUsername).join(mention.username);
		}
	}

	// Normalize channels
	for (const channel of resource.channels || []) {
		if (!isFullyQualified(channel.name)) {
			const originalUsername = channel.name;

			channel.name = `${channel.name}@${getFederationDomain()}`;

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
