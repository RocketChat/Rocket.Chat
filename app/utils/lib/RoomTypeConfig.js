import { Random } from 'meteor/random';

export class RoomTypeRouteConfig {
	constructor({ name, path }) {
		if (typeof name !== 'undefined' && (typeof name !== 'string' || name.length === 0)) {
			throw new Error('The name must be a string.');
		}

		if (typeof path !== 'undefined' && (typeof path !== 'string' || path.length === 0)) {
			throw new Error('The path must be a string.');
		}

		this._name = name;
		this._path = path;
	}

	get name() {
		return this._name;
	}

	get path() {
		return this._path;
	}
}

export class RoomTypeConfig {
	constructor({ identifier = Random.id(), order, icon, header, label, route }) {
		if (typeof identifier !== 'string' || identifier.length === 0) {
			throw new Error('The identifier must be a string.');
		}

		if (typeof order !== 'number') {
			throw new Error('The order must be a number.');
		}

		if (typeof icon !== 'undefined' && (typeof icon !== 'string' || icon.length === 0)) {
			throw new Error('The icon must be a string.');
		}

		if (typeof header !== 'undefined' && (typeof header !== 'string' || header.length === 0)) {
			throw new Error('The header must be a string.');
		}

		if (typeof label !== 'undefined' && (typeof label !== 'string' || label.length === 0)) {
			throw new Error('The label must be a string.');
		}

		if (typeof route !== 'undefined' && !(route instanceof RoomTypeRouteConfig)) {
			throw new Error('Room\'s route is not a valid route configuration. Must be an instance of "RoomTypeRouteConfig".');
		}

		this._identifier = identifier;
		this._order = order;
		this._icon = icon;
		this._header = header;
		this._label = label;
		this._route = route;
	}

	supportMembersList(/* room */) {
		return true;
	}

	canAddUser(/* userId, room */) {
		return false;
	}

	userDetailShowAll(/* room */) {
		return true;
	}

	userDetailShowAdmin(/* room */) {
		return true;
	}

	includeInRoomSearch() {
		return false;
	}

	enableMembersListProfile() {
		return false;
	}

	/**
	 * Returns a text which can be used in generic UIs.
	 * @param context The role of the text in the UI-Element
	 * @return {string} A text or a translation key - the consumers of this method will pass the
	 * returned value to an internationalization library
	 */
	getUiText(/* context */) {
		return '';
	}

	getAvatarPath(/* roomData */) {
		return '';
	}

	openCustomProfileTab() {
		return false;
	}
}
