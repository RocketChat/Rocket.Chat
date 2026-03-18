import { isObject } from '../../../../lib/utils/isObject';
import type { NormalizedIdentity } from './types';

type Identity = Record<string, unknown>;

type Normalizer = (identity: Identity) => Identity | void;

export const normalizers: Record<string, Normalizer> = {
	// Set 'id' to '_id' for any sources that provide it
	_id(identity) {
		if (identity._id && !identity.id) {
			identity.id = identity._id;
		}
	},

	// Fix for Reddit
	reddit(identity) {
		if (identity.result && typeof identity.result === 'object') {
			return identity.result as Identity;
		}
	},

	// Fix WordPress-like identities having 'ID' instead of 'id'
	wordpress(identity) {
		if (identity.ID && !identity.id) {
			identity.id = identity.ID;
		}
	},

	// Fix Auth0-like identities having 'user_id' instead of 'id'
	user_id(identity) {
		if (identity.user_id && !identity.id) {
			identity.id = identity.user_id;
		}
	},

	// Fix for CharacterID (EVE Online, etc.)
	characterid(identity) {
		if (identity.CharacterID && !identity.id) {
			identity.id = identity.CharacterID;
		}
	},

	// Fix Dataporten having 'user.userid' instead of 'id'
	dataporten(identity) {
		const user = identity.user as Record<string, unknown> | undefined;
		if (user && user.userid && !identity.id) {
			const useridSec = user.userid_sec as string[] | undefined;
			if (useridSec && useridSec[0]) {
				identity.id = useridSec[0];
			} else {
				identity.id = user.userid;
			}
			identity.email = user.email;
		}
	},

	// Fix for Xenforo [BD]API plugin for 'user.user_id' instead of 'id'
	xenforo(identity) {
		const user = identity.user as Record<string, unknown> | undefined;
		if (user && user.user_id && !identity.id) {
			identity.id = user.user_id;
			identity.email = user.user_email;
		}
	},

	// Fix general 'phid' instead of 'id' from phabricator
	phabricator(identity) {
		if (identity.phid && !identity.id) {
			identity.id = identity.phid;
		}
	},

	// Fix Keycloak-like identities having 'sub' instead of 'id'
	keycloak(identity) {
		if (identity.sub && !identity.id) {
			identity.id = identity.sub;
		}
	},

	// Fix OpenShift identities where id is in 'metadata' object
	openshift(identity) {
		const metadata = identity.metadata as Record<string, unknown> | undefined;
		if (!identity.id && metadata && metadata.uid) {
			identity.id = metadata.uid;
			identity.name = identity.fullName;
		}
	},

	// Fix general 'userid' instead of 'id' from provider
	userid(identity) {
		if (identity.userid && !identity.id) {
			identity.id = identity.userid;
		}
	},

	// Fix Nextcloud provider
	nextcloud(identity) {
		const ocs = identity.ocs as { data?: Record<string, unknown> } | undefined;
		if (!identity.id && ocs?.data?.id) {
			identity.id = ocs.data.id;
			identity.name = ocs.data.displayname;
			identity.email = ocs.data.email;
		}
	},

	// Fix when authenticating from a meteor app with 'emails' field
	meteor(identity) {
		const emails = identity.emails as Array<{ address?: string }> | undefined;
		if (!identity.email && emails && Array.isArray(emails) && emails.length >= 1) {
			identity.email = emails[0].address || undefined;
		}
	},
};

const IDENTITY_PROPNAME_FILTER = /\./g;

export const renameInvalidProperties = <T>(input: T): T => {
	if (Array.isArray(input)) {
		return input.map((item) => renameInvalidProperties(item)) as unknown as T;
	}
	if (!isObject(input)) {
		return input;
	}

	return Object.entries(input as Record<string, unknown>).reduce(
		(result, [name, value]) => ({
			...result,
			[name.replace(IDENTITY_PROPNAME_FILTER, '_')]: isObject(value) ? renameInvalidProperties(value as Record<string, unknown>) : value,
		}),
		{} as Record<string, unknown>,
	) as T;
};

export const getNestedValue = (propertyPath: string, source: Record<string, unknown>): unknown =>
	propertyPath.split('.').reduce<unknown>((prev, curr) => {
		if (prev && typeof prev === 'object' && curr in prev) {
			return (prev as Record<string, unknown>)[curr];
		}
		return undefined;
	}, source);

// /^(.+)@/::email
const REGEXP_FROM_FORMULA = /^\/((?!\/::).*)\/::(.+)/;

export const getRegexpMatch = (formula: string, data: Record<string, unknown>): string | undefined => {
	const regexAndPath = REGEXP_FROM_FORMULA.exec(formula);
	if (!regexAndPath) {
		const value = getNestedValue(formula, data);
		return typeof value === 'string' ? value : undefined;
	}
	if (regexAndPath.length !== 3) {
		throw new Error(`expected array of length 3, got ${regexAndPath.length}`);
	}

	const [, regexString, path] = regexAndPath;
	const nestedValue = getNestedValue(path, data);
	if (typeof nestedValue !== 'string') {
		return undefined;
	}

	const regex = new RegExp(regexString);
	const matches = regex.exec(nestedValue);

	if (!matches) {
		return undefined;
	}

	const [, value] = matches;
	return value;
};

const templateStringRegex = /{{((?:(?!}}).)+)}}/g;

export const fromTemplate = (template: string, data: Record<string, unknown>): string | undefined => {
	if (!templateStringRegex.test(template)) {
		const value = getNestedValue(template, data);
		return typeof value === 'string' ? value : undefined;
	}

	templateStringRegex.lastIndex = 0;
	return template.replace(templateStringRegex, (fullMatch, match: string) => getRegexpMatch(match, data) || '');
};

export const normalizeIdentity = (
	identity: Record<string, unknown>,
	options: {
		usernameField?: string;
		emailField?: string;
		nameField?: string;
		avatarField?: string;
	},
): NormalizedIdentity => {
	let normalizedIdentity = { ...identity };

	for (const normalizer of Object.values(normalizers)) {
		const result = normalizer(normalizedIdentity);
		if (result) {
			normalizedIdentity = result;
		}
	}

	if (options.usernameField) {
		const username = fromTemplate(options.usernameField, normalizedIdentity);
		if (username) {
			normalizedIdentity.username = username;
		}
	}

	if (options.emailField) {
		const email = fromTemplate(options.emailField, normalizedIdentity);
		if (email) {
			normalizedIdentity.email = email;
		}
	}

	if (options.avatarField) {
		const avatarUrl = fromTemplate(options.avatarField, normalizedIdentity);
		if (avatarUrl) {
			normalizedIdentity.avatarUrl = avatarUrl;
		}
	}

	if (options.nameField) {
		const name = fromTemplate(options.nameField, normalizedIdentity);
		if (name) {
			normalizedIdentity.name = name;
		}
	}

	if (!normalizedIdentity.name) {
		normalizedIdentity.name =
			normalizedIdentity.name ||
			normalizedIdentity.username ||
			normalizedIdentity.nickname ||
			normalizedIdentity.CharacterName ||
			normalizedIdentity.userName ||
			normalizedIdentity.preferred_username ||
			(normalizedIdentity.user && typeof normalizedIdentity.user === 'object' && (normalizedIdentity.user as Record<string, unknown>).name);
	}

	return renameInvalidProperties(normalizedIdentity) as NormalizedIdentity;
};
