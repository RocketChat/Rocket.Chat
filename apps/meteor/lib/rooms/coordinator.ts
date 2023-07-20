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
		const { identifier } = roomConfig;

		if (typeof identifier !== 'string' || identifier.length === 0) {
			throw new Error('The identifier must be a string.');
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

		if (!config.route.path) {
			console.warn(`The route for the room type ${roomType} does not have a path`);
			return false;
		}

		const pathDef = config.route.path;
		const fields = routeData;

		const regExp = /(:[\w\(\)\\\+\*\.\?]+)+/g;
		let path = pathDef.replace(regExp, function (key) {
			const firstRegexpChar = key.indexOf('(');
			// get the content behind : and (\\d+/)
			key = key.substring(1, firstRegexpChar > 0 ? firstRegexpChar : undefined);
			// remove +?*
			key = key.replace(/[\+\*\?]+/g, '');

			return fields[key] || '';
		});

		path = path.replace(/\/\/+/g, '/'); // Replace multiple slashes with single slash

		// remove trailing slash
		// but keep the root slash if it's the only one
		path = path.match(/^\/{1}$/) ? path : path.replace(/\/$/, '');

		return path;
	}

	protected getRouteData(roomType: string, { ...subData }: RoomIdentification): Record<string, string> | false {
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
}
