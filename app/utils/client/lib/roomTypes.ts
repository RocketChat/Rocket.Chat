import { FlowRouter } from 'meteor/kadira:flow-router';
import _ from 'underscore';

import { IRoomTypes, RoomTypesCommon } from '../../lib/RoomTypesCommon';
import { hasAtLeastOnePermission } from '../../../authorization/client/hasPermission';
import { ChatRoom, ChatSubscription } from '../../../models/client';
import { IRoomTypeConfig } from '../../lib/RoomTypeConfig';
import { IUser } from '../../../../definition/IUser';

interface IRoomTypesClient extends IRoomTypes {
	archived(rid: string): boolean;
	getIdentifiers(e: string): string[];
	getNotSubscribedTpl(rid: string): string;
	getReadOnlyTpl(rid: string): string;
	getRoomName(roomType: string, roomData: any): string;
	getRoomType(roomId: string): string | undefined;
	getSecondaryRoomName(roomType: string, roomData: any): string;
	getTypes(): IRoomTypeConfigClient[];
	getUserStatusText(roomType: string, roomId: string): string;
	readOnly(rid: string, user: IUser): boolean;
	verifyCanSendMessage(rid: string): boolean;
	verifyShowJoinLink(rid: string): boolean;
	openRouteLink(roomType: string, subData: any, queryParams: any): void;
}

interface IRoomTypeConfigClient extends IRoomTypeConfig {
	readOnly?: Function;
	showJoinLink?: Function;
	notSubscribedTpl?: string;
	readOnlyTpl?: string;
}

class RocketChatRoomTypes extends RoomTypesCommon implements IRoomTypesClient {
	protected roomTypes: { [key: string]: IRoomTypeConfigClient };

	constructor() {
		super();
		this.roomTypes = {};
	}

	getTypes(): IRoomTypeConfigClient[] {
		return _.sortBy(this.roomTypesOrder, 'order').map((type) => this.roomTypes[type.identifier]).filter((type) => !type.condition || type.condition());
	}

	getIcon(roomData: any): string {
		if (!roomData || !roomData.t || !this.roomTypes[roomData.t]) {
			return '';
		}
		// @ts-ignore
		return (this.roomTypes[roomData.t].getIcon && this.roomTypes[roomData.t].getIcon(roomData)) || this.roomTypes[roomData.t].icon;
	}

	getRoomName(roomType: string, roomData: any): string {
		return this.roomTypes[roomType] && this.roomTypes[roomType].roomName && this.roomTypes[roomType].roomName(roomData);
	}

	getSecondaryRoomName(roomType: string, roomData: any): string {
		return this.roomTypes[roomType] && this.roomTypes[roomType].secondaryRoomName(roomData);
	}

	getIdentifiers(e: string): string[] {
		const initial: string[] = [];
		const except = initial.concat(e);
		const list = _.reject(this.roomTypesOrder, (t) => except.indexOf(t.identifier) !== -1);
		return _.map(list, (t) => t.identifier);
	}

	getUserStatus(roomType: string, rid: string): string {
		return this.roomTypes[roomType] && this.roomTypes[roomType].getUserStatus(rid);
	}

	getRoomType(roomId: string): string | undefined {
		const fields = {
			t: 1,
		};
		const room = ChatRoom.findOne({
			_id: roomId,
		}, {
			fields,
		});
		return room && room.t;
	}

	getUserStatusText(roomType: string, rid: string): string {
		return this.roomTypes[roomType] && this.roomTypes[roomType].getUserStatusText(rid);
	}

	findRoom(roomType: string, identifier: string, user: IUser): any {
		return this.roomTypes[roomType] && this.roomTypes[roomType].findRoom(identifier);
	}

	canSendMessage(rid: string): boolean {
		return ChatSubscription.find({ rid }).count() > 0;
	}

	readOnly(rid: string, user: IUser): boolean {
		const fields: any = {
			ro: 1,
			t: 1,
		};
		if (user) {
			fields.muted = 1;
			fields.unmuted = 1;
		}
		const room = ChatRoom.findOne({
			_id: rid,
		}, {
			fields,
		});

		const roomType = room && room.t;
		if (roomType && this.roomTypes[roomType] && this.roomTypes[roomType].readOnly) {
			// @ts-ignore
			return this.roomTypes[roomType].readOnly(rid, user);
		}

		if (!user) {
			return room && room.ro;
		}

		if (room) {
			if (Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1) {
				return true;
			}

			if (room.ro === true) {
				if (Array.isArray(room.unmuted) && room.unmuted.indexOf(user.username) !== -1) {
					return false;
				}

				if (hasAtLeastOnePermission('post-readonly', room._id)) {
					return false;
				}

				return true;
			}
		}

		return false;
	}

	archived(rid: string): boolean {
		const room = ChatRoom.findOne({ _id: rid }, { fields: { archived: 1 } });
		return room && room.archived === true;
	}

	verifyCanSendMessage(rid: string): boolean {
		const room = ChatRoom.findOne({ _id: rid }, { fields: { t: 1 } });
		if (!room || !room.t) {
			return false;
		}

		const roomType = room.t;
		if (this.roomTypes[roomType] && this.roomTypes[roomType].canSendMessage) {
			// @ts-ignore
			return this.roomTypes[roomType].canSendMessage(rid);
		}
		return this.canSendMessage(rid);
	}

	verifyShowJoinLink(rid: string): boolean {
		const room = ChatRoom.findOne({ _id: rid, t: { $exists: true, $ne: null } }, { fields: { t: 1 } });
		if (!room || !room.t) {
			return false;
		}
		const roomType = room.t;
		if (this.roomTypes[roomType] && !this.roomTypes[roomType].showJoinLink) {
			return false;
		}
		// @ts-ignore
		return this.roomTypes[roomType].showJoinLink(rid);
	}

	getNotSubscribedTpl(rid: string): string {
		const room = ChatRoom.findOne({ _id: rid, t: { $exists: true, $ne: null } }, { fields: { t: 1 } });
		if (!room || !room.t) {
			return '';
		}
		const roomType = room.t;
		if (this.roomTypes[roomType] && !this.roomTypes[roomType].notSubscribedTpl) {
			return '';
		}
		// @ts-ignore
		return this.roomTypes[roomType].notSubscribedTpl;
	}

	getReadOnlyTpl(rid: string): string {
		const room = ChatRoom.findOne({ _id: rid, t: { $exists: true, $ne: null } }, { fields: { t: 1 } });
		if (!room || !room.t) {
			return '';
		}
		const roomType = room.t;
		// @ts-ignore
		return this.roomTypes[roomType] && this.roomTypes[roomType].readOnlyTpl;
	}

	openRouteLink(roomType: string, subData: any, queryParams: any): void {
		if (!this.roomTypes[roomType]) {
			return;
		}

		let routeData = {};
		if (this.roomTypes[roomType] && this.roomTypes[roomType].route && this.roomTypes[roomType].route.link) {
			// @ts-ignore
			routeData = this.roomTypes[roomType].route.link(subData);
		} else if (subData && subData.name) {
			routeData = {
				name: subData.name,
			};
		}

		return FlowRouter.go(this.roomTypes[roomType].route.name, routeData, queryParams);
	}
}

export const roomTypes: IRoomTypesClient = new RocketChatRoomTypes();
