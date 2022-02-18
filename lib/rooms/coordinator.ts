import { FlowRouter } from 'meteor/kadira:flow-router';
import type { RouteOptions } from 'meteor/kadira:flow-router';

import type { IRoomTypeConfig, IRoomTypeClientDirectives, IRoomTypeServerDirectives, RoomData } from '../../definition/IRoomTypeConfig';
import type { IRoom } from '../../definition/IRoom';
import type { ISubscription } from '../../definition/ISubscription';
import type { SettingValue } from '../../definition/ISetting';

export abstract class RoomCoordinator {
	roomTypes: Record<string, { config: IRoomTypeConfig; directives: IRoomTypeClientDirectives | IRoomTypeServerDirectives }>;

	roomTypesOrder: Array<{ identifier: string; order: number }>;

	mainOrder: number;

	constructor() {
		this.roomTypes = {};
		this.roomTypesOrder = [];
		this.mainOrder = 1;
	}

	protected addRoomType(roomConfig: IRoomTypeConfig, directives: IRoomTypeClientDirectives | IRoomTypeServerDirectives): void {
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

		if (roomConfig.route && roomConfig.route.path && roomConfig.route.name && roomConfig.route.action) {
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

	getRoomTypeConfig(identifier: string): IRoomTypeConfig | undefined {
		return this.roomTypes[identifier]?.config;
	}

	getRouteLink(roomType: string, subData: RoomData): string | false {
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

	getURL(roomType: string, subData: IRoom | ISubscription): string | false {
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

	getRouteData(roomType: string, subData: RoomData): Record<string, string> | false {
		const config = this.getRoomTypeConfig(roomType);
		if (!config) {
			return false;
		}

		let routeData = {};
		if (config.route?.link) {
			routeData = config.route.link(subData);
		} else if (subData?.name) {
			routeData = {
				rid: (subData as ISubscription).rid || (subData as IRoom)._id,
				name: subData.name,
			};
		}

		return routeData;
	}

	abstract openRoom(_type: string, _name: string, _render?: boolean): void;
}
