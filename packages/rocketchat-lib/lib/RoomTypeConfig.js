export const RoomSettingsEnum = {
	NAME: 'roomName',
	TOPIC: 'roomTopic',
	ANNOUNCEMENT: 'roomAnnouncement',
	DESCRIPTION: 'roomDescription',
	READ_ONLY: 'readOnly',
	REACT_WHEN_READ_ONLY: 'reactWhenReadOnly',
	ARCHIVE_OR_UNARCHIVE: 'archiveOrUnarchive',
	JOIN_CODE: 'joinCode',
	BROADCAST: 'broadcast'
};

export const UiTextContext = {
	CLOSE_WARNING: 'closeWarning',
	HIDE_WARNING: 'hideWarning',
	LEAVE_WARNING: 'leaveWarning',
	NO_ROOMS_SUBSCRIBED: 'noRoomsSubscribed'
};

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
	constructor({
		identifier = Random.id(),
		order,
		icon,
		header,
		label,
		route
	}) {
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

	/**
	 * The room type's internal identifier.
	 */
	get identifier() {
		return this._identifier;
	}

	/**
	 * The order of this room type for the display.
	 */
	get order() {
		return this._order;
	}

	/**
	 * Sets the order of this room type for the display.
	 *
	 * @param {number} order the number value for the order
	 */
	set order(order) {
		if (typeof order !== 'number') {
			throw new Error('The order must be a number.');
		}

		this._order = order;
	}

	/**
	 * The icon class, css, to use as the visual aid.
	 */
	get icon() {
		return this._icon;
	}

	/**
	 * The header name of this type.
	 */
	get header() {
		return this._header;
	}

	/**
	 * The i18n label for this room type.
	 */
	get label() {
		return this._label;
	}

	/**
	 * The route config for this room type.
	 */
	get route() {
		return this._route;
	}

	/**
	 * Gets the room's name to display in the UI.
	 *
	 * @param {object} room
	 */
	getDisplayName(room) {
		return room.name;
	}

	allowRoomSettingChange(/* room, setting */) {
		return true;
	}

	canBeCreated() {
		return Meteor.isServer ?
			RocketChat.authz.hasAtLeastOnePermission(Meteor.userId(), [`create-${ this._identifier }`]) :
			RocketChat.authz.hasAtLeastOnePermission([`create-${ this._identifier }`]);
	}

	canBeDeleted(room) {
		return Meteor.isServer ?
			RocketChat.authz.hasAtLeastOnePermission(Meteor.userId(), [`delete-${ room.t }`], room._id) :
			RocketChat.authz.hasAtLeastOnePermission([`delete-${ room.t }`], room._id);
	}

	supportMembersList(/* room */) {
		return true;
	}

	isGroupChat() {
		return false;
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

	preventRenaming(/* room */) {
		return false;
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
}
