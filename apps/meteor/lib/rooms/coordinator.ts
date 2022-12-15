import { FlowRouter } from 'meteor/kadira:flow-router';
import type { RouteOptions } from 'meteor/kadira:flow-router';
import type { SettingValue, RoomType } from '@rocket.chat/core-typings';

import type {
	IRoomTypeConfig,
	IRoomTypeRouteConfig,
	IRoomTypeClientDirectives,
	IRoomTypeServerDirectives,
	RoomIdentification,
} from '../../definition/IRoomTypeConfig';

export abstract class RoomCoordinator {
	roomTypes: Record<string, { config: IRoomTypeConfig; directives: IRoomTypeClientDirectives | IRoomTypeServerDirectives }>;

	roomTypesOrder: Array<{ identifier: string; order: number }>;

	mainOrder: number;

	constructor() {
		this.roomTypes = {};
		this.roomTypesOrder = [];
		this.mainOrder = 1;
	}

	protected validateRoute(route: IRoomTypeRouteConfig): void {
		const { name, path, action, link } = route;

		if (typeof name !== 'string' || name.length === 0) {
			throw new Error('The route name must be a string.');
		}

		if (path !== undefined && (typeof path !== 'string' || path.length === 0)) {
			throw new Error('The route path must be a string.');
		}

		if (!['undefined', 'function'].includes(typeof action)) {
			throw new Error('The route action must be a function.');
		}

		if (!['undefined', 'function'].includes(typeof link)) {
			throw new Error('The route link must be a function.');
		}
	}

	protected validateRoomConfig(roomConfig: IRoomTypeConfig): void {
		const { identifier, order, icon, header, label, route } = roomConfig;

		if (typeof identifier !== 'string' || identifier.length === 0) {
			throw new Error('The identifier must be a string.');
		}

		if (typeof order !== 'number') {
			throw new Error('The order must be a number.');
		}

		if (icon !== undefined && (typeof icon !== 'string' || icon.length === 0)) {
			throw new Error('The icon must be a string.');
		}

		if (header !== undefined && (typeof header !== 'string' || header.length === 0)) {
			throw new Error('The header must be a string.');
		}

		if (label !== undefined && (typeof label !== 'string' || label.length === 0)) {
			throw new Error('The label must be a string.');
		}

		if (route !== undefined) {
			this.validateRoute(route);
		}
	}

	protected addRoomType(roomConfig: IRoomTypeConfig, directives: IRoomTypeClientDirectives | IRoomTypeServerDirectives): void {
		this.validateRoomConfig(roomConfig);

		if (this.roomTypes[roomConfig.identifier]) {
			return;
		}

		if (!roomConfig.order) {
			roomConfig.order = this.mainOrder + 10;
			this.mainOrder += 10;
		}

		this.roomTypesOrder.push({
			identifier: roomConfig.identifier,
			order: roomConfig.order,
		});

		this.roomTypes[roomConfig.identifier] = { config: roomConfig, directives };

		if (roomConfig.route?.path && roomConfig.route.name && roomConfig.route.action) {
			const routeConfig = {
				name: roomConfig.route.name,
				action: roomConfig.route.action,
			};

			return this.addRoute(roomConfig.route.path, routeConfig);
		}
	}

	protected addRoute(path: string, routeConfig: RouteOptions): void {
		FlowRouter.route(path, routeConfig);
	}

	getSetting(_settingId: string): SettingValue {
		return undefined;
	}

	getRoomTypeConfig(identifier: RoomType): IRoomTypeConfig & Pick<Required<IRoomTypeConfig>, 'route'>;

	getRoomTypeConfig(identifier: string): IRoomTypeConfig | undefined;

	getRoomTypeConfig(identifier: string): IRoomTypeConfig | undefined {
		if (!this.roomTypes[identifier]) {
			throw new Error(`Room type with identifier ${identifier} does not exist.`);
		}

		return this.roomTypes[identifier].config;
	}

	getRouteLink(roomType: string, subData: RoomIdentification): string | false {
		const config = this.getRoomTypeConfig(roomType);
		if (!config?.route) {
			return false;
		}

		const routeData = this.getRouteData(roomType, subData);
		if (!routeData) {
			return false;
		}

		return FlowRouter.path(config.route.name, routeData);
	}

	getURL(roomType: string, subData: RoomIdentification): string | false {
		const config = this.getRoomTypeConfig(roomType);
		if (!config?.route) {
			return false;
		}

		const routeData = this.getRouteData(roomType, subData);
		if (!routeData) {
			return false;
		}

		return FlowRouter.url(config.route.name, routeData);
	}

	getRouteData(roomType: string, subData: RoomIdentification): Record<string, string> | false {
		if (!subData.rid && (subData as Record<string, string>)._id) {
			console.warn('Deprecated: RoomCoordinator.getRouteData received a room object');
			subData.rid = (subData as Record<string, string>)._id;
		}

		const config = this.getRoomTypeConfig(roomType);
		if (!config) {
			return false;
		}

		let routeData = {};
		if (config.route?.link) {
			routeData = config.route.link(subData);
		} else if (subData?.name) {
			routeData = {
				rid: subData.rid,
				name: subData.name,
			};
		}

		return routeData;
	}

	getRouteNames(): Array<string> {
		return Object.values(this.roomTypes)
			.map(({ config }) => config.route?.name)
			.filter(Boolean) as Array<string>;
	}

	getRouteNameIdentifier(routeName: string): string | undefined {
		if (!routeName) {
			return;
		}

		return Object.keys(this.roomTypes).find((key) => this.roomTypes[key].config.route?.name === routeName);
	}

	isRouteNameKnown(routeName: string): boolean {
		return Boolean(this.getRouteNameIdentifier(routeName));
	}

	getRoomTypes(): Array<string> {
		return Object.keys(this.roomTypes);
	}

	abstract openRoom(_type: string, _name: string, _render?: boolean): void;
}
