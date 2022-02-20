import _ from 'underscore';

export const normalizers = {
	// Set 'id' to '_id' for any sources that provide it
	_id(identity) {
		if (identity._id && !identity.id) {
			identity.id = identity._id;
		}
	},

	// Fix for Reddit
	redit(identity) {
		if (identity.result) {
			return identity.result;
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

	characterid(identity) {
		if (identity.CharacterID && !identity.id) {
			identity.id = identity.CharacterID;
		}
	},

	// Fix Dataporten having 'user.userid' instead of 'id'
	dataporten(identity) {
		if (identity.user && identity.user.userid && !identity.id) {
			if (identity.user.userid_sec && identity.user.userid_sec[0]) {
				identity.id = identity.user.userid_sec[0];
			} else {
				identity.id = identity.user.userid;
			}
			identity.email = identity.user.email;
		}
	},

	// Fix for Xenforo [BD]API plugin for 'user.user_id; instead of 'id'
	xenforo(identity) {
		if (identity.user && identity.user.user_id && !identity.id) {
			identity.id = identity.user.user_id;
			identity.email = identity.user.user_email;
		}
	},

	// Fix general 'phid' instead of 'id' from phabricator
	phabricator(identity) {
		if (identity.phid && !identity.id) {
			identity.id = identity.phid;
		}
	},

	// Fix Keycloak-like identities having 'sub' instead of 'id'
	kaycloak(identity) {
		if (identity.sub && !identity.id) {
			identity.id = identity.sub;
		}
	},

	// Fix OpenShift identities where id is in 'metadata' object
	openshift(identity) {
		if (!identity.id && identity.metadata && identity.metadata.uid) {
			identity.id = identity.metadata.uid;
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
		if (!identity.id && identity.ocs && identity.ocs.data && identity.ocs.data.id) {
			identity.id = identity.ocs.data.id;
			identity.name = identity.ocs.data.displayname;
			identity.email = identity.ocs.data.email;
		}
	},

	// Fix when authenticating from a meteor app with 'emails' field
	meteor(identity) {
		if (!identity.email && identity.emails && Array.isArray(identity.emails) && identity.emails.length >= 1) {
			identity.email = identity.emails[0].address ? identity.emails[0].address : undefined;
		}
	},
};

const IDENTITY_PROPNAME_FILTER = /(\.)/g;
export const renameInvalidProperties = (input) => {
	if (Array.isArray(input)) {
		return input.map(renameInvalidProperties);
	}
	if (!_.isObject(input)) {
		return input;
	}

	return Object.entries(input).reduce(
		(result, [name, value]) => ({
			...result,
			[name.replace(IDENTITY_PROPNAME_FILTER, '_')]: renameInvalidProperties(value),
		}),
		{},
	);
};

export const getNestedValue = (propertyPath, source) =>
	propertyPath.split('.').reduce((prev, curr) => (prev ? prev[curr] : undefined), source);

// /^(.+)@/::email
const REGEXP_FROM_FORMULA = /^\/((?!\/::).*)\/::(.+)/;
export const getRegexpMatch = (formula, data) => {
	const regexAndPath = REGEXP_FROM_FORMULA.exec(formula);
	if (!regexAndPath) {
		return getNestedValue(formula, data);
	}
	if (regexAndPath.length !== 3) {
		throw new Error(`expected array of length 3, got ${regexAndPath.length}`);
	}

	const [, regexString, path] = regexAndPath;
	const nestedValue = getNestedValue(path, data);
	const regex = new RegExp(regexString);
	const matches = regex.exec(nestedValue);

	// regexp does not match nested value
	if (!matches) {
		return undefined;
	}

	// we only support regular expressions with a single capture group
	const [, value] = matches;

	// this could mean we return `undefined` (e.g. when capture group is empty)
	return value;
};

const templateStringRegex = /{{((?:(?!}}).)+)}}/g;
export const fromTemplate = (template, data) => {
	if (!templateStringRegex.test(template)) {
		return getNestedValue(template, data);
	}

	return template.replace(templateStringRegex, (fullMatch, match) => getRegexpMatch(match, data));
};
