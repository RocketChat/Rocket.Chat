import { FlowRouter } from 'meteor/kadira:flow-router';
import type { RoomType } from '@rocket.chat/core-typings';

import type {
	IRoomTypeConfig,
	IRoomTypeClientDirectives,
	IRoomTypeServerDirectives,
	RoomIdentification,
} from '../../definition/IRoomTypeConfig';

export abstract class RoomCoordinator {
	protected roomTypes: Record<string, { config: IRoomTypeConfig; directives: IRoomTypeClientDirectives | IRoomTypeServerDirectives }> = {};

	protected validateRoomConfig(roomConfig: IRoomTypeConfig): void {
		const { identifier, order, icon, header, label } = roomConfig;

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
	}

	protected addRoomType(roomConfig: IRoomTypeConfig, directives: IRoomTypeClientDirectives | IRoomTypeServerDirectives): void {
		this.validateRoomConfig(roomConfig);

		if (this.roomTypes[roomConfig.identifier]) {
			return;
		}

		this.roomTypes[roomConfig.identifier] = { config: roomConfig, directives };
	}

	protected getRoomTypeConfig(identifier: RoomType): IRoomTypeConfig & Pick<Required<IRoomTypeConfig>, 'route'>;

	protected getRoomTypeConfig(identifier: string): IRoomTypeConfig | undefined;

	protected getRoomTypeConfig(identifier: string): IRoomTypeConfig | undefined {
		if (!this.roomTypes[identifier]) {
			throw new Error(`Room type with identifier ${identifier} does not exist.`);
		}

		return this.roomTypes[identifier].config;
	}

	public getRouteLink(roomType: string, subData: RoomIdentification): string | false {
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

	protected getRouteData(roomType: string, subData: RoomIdentification): Record<string, string> | false {
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

	public abstract openRoom(_type: string, _name: string): void;
}
