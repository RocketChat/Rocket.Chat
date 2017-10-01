/* globals roomExit*/
this.roomTypesCommon = class {
	constructor() {
		this.roomTypes = {};
		this.roomTypesOrder = [];
		this.mainOrder = 1;
	}

	/* Adds a room type to app
	@param identifier An identifier to the room type. If a real room, MUST BE the same of `db.rocketchat_room.t` field, if not, can be null
	@param order Order number of the type
	@param config
	icon: icon class
	label: i18n label
	route:
	name: route name
	action: route action function
	identifier: room type identifier

	Optional methods which can be redefined
		getDisplayName(room): return room's name for the UI
		allowChangeChannelSettings(room): Whether it's possible to use the common channel-settings-tab to change a room's settings
		canBeDeleted(userId, room): Custom authorizations for whether a room can be deleted. If not implemented, `delete-{identifier}` will be checked for
		supportMembersList(room): Whether the generic members list for managing a room's members shall be available
		isGroupChat(): Whether the room type is a chat of a group of members
		canAddUser(userId, room): Whether the given user is allowed to add users to the specified room
		userDetailShowAll(room): Whether all room members' details be shown in the user info
		userDetailShowAdmin(room): Whether admin-controls (change role etc.) shall be shown in the user info
		preventRenaming(room): Whether it shall be impossible to rename the room
		includeInRoomSearch(): Whether rooms of this type shall be included into the result list when searching for "rooms"
	*/
	add(identifier = Random.id(), order, config) {
		if (this.roomTypes[identifier] != null) {
			return false;
		}

		// apart from the structure, the config may optionally override default behaviour.
		// In order to simplify implementation, default implementeations are added unless "redefined"
		this._addDefaultImplementations(config);

		if (order == null) {
			order = this.mainOrder + 10;
			this.mainOrder += 10;
		}
		this.roomTypesOrder.push({
			identifier,
			order
		});
		this.roomTypes[identifier] = {...config, identifier};
		if (config.route && config.route.path && config.route.name && config.route.action) {
			const routeConfig = {
				name: config.route.name,
				action: config.route.action
			};
			if (Meteor.isClient) {
				routeConfig.triggersExit = [roomExit];
			}
			return FlowRouter.route(config.route.path, routeConfig);
		}
	}

	hasCustomLink(roomType) {
		return this.roomTypes[roomType] && this.roomTypes[roomType].route && this.roomTypes[roomType].route.link != null;
	}

	/*
	@param roomType: room type (e.g.: c (for channels), d (for direct channels))
	@param subData: the user's subscription data
	*/

	getRouteLink(roomType, subData) {
		if (this.roomTypes[roomType] == null) {
			return false;
		}
		let routeData = {};
		if (this.roomTypes[roomType] && this.roomTypes[roomType].route && this.roomTypes[roomType].route.link) {
			routeData = this.roomTypes[roomType].route.link(subData);
		} else if (subData && subData.name) {
			routeData = {
				name: subData.name
			};
		}
		return FlowRouter.path(this.roomTypes[roomType].route.name, routeData);
	}

	openRouteLink(roomType, subData, queryParams) {
		if (this.roomTypes[roomType] == null) {
			return false;
		}
		let routeData = {};
		if (this.roomTypes[roomType] && this.roomTypes[roomType].route && this.roomTypes[roomType].route.link) {
			routeData = this.roomTypes[roomType].route.link(subData);
		} else if (subData && subData.name) {
			routeData = {
				name: subData.name
			};
		}
		return FlowRouter.go(this.roomTypes[roomType].route.name, routeData, queryParams);
	}

	_addDefaultImplementations(config) {
		if (!config.getDisplayName) {
			config.getDisplayName = function(room) {
				return room.name;
			};
		}

		if (!config.allowChangeChannelSettings) {
			config.allowChangeChannelSettings = function() {
				return true;
			};
		}

		if (!config.canBeDeleted) {
			config.canBeDeleted = function(room) {
				return Meteor.isServer ?
					RocketChat.authz.hasAtLeastOnePermission(Meteor.userId(), [`delete-${ room.t }`], room._id) :
					RocketChat.authz.hasAtLeastOnePermission([`delete-${ room.t }`], room._id);
			};
		}

		if (!config.supportMembersList) {
			config.supportMembersList = function() {
				return true;
			};
		}

		if (!config.isGroupChat) {
			config.isGroupChat = function() {
				return false;
			};
		}

		if (!config.canAddUser) {
			config.canAddUser = function() {
				return false;
			};
		}

		if (!config.userDetailShowAll) {
			config.userDetailShowAll = function() {
				return true;
			};
		}

		if (!config.userDetailShowAdmin) {
			config.userDetailShowAdmin = function() {
				return true;
			};
		}

		if (!config.preventRenaming) {
			config.preventRenaming = function() {
				return false;
			};
		}

		if (!config.includeInRoomSearch) {
			config.includeInRoomSearch = function() {
				return false;
			};
		}
	}

};
export default this.roomTypesCommon;
