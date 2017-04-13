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
	template: template name to render on sideNav
	icon: icon class
	route:
	name: route name
	action: route action function
	*/

	add(identifier = Random.id(), order, config) {
		if (this.roomTypes[identifier] != null) {
			return false;
		}
		if (order == null) {
			order = this.mainOrder + 10;
			this.mainOrder += 10;
		}
		this.roomTypesOrder.push({
			identifier,
			order
		});
		this.roomTypes[identifier] = config;
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
};
export default this.roomTypesCommon;
