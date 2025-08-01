import type { IRoom, RoomType, IUser, AtLeast, ValueOf, ISubscription } from '@rocket.chat/core-typings';
import type { RouteName } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../app/authorization/client';
import type {
	RoomSettingsEnum,
	RoomMemberActions,
	UiTextContext,
	IRoomTypeClientDirectives,
	RoomIdentification,
	IRoomTypeRouteConfig,
	IRoomTypeClientConfig,
} from '../../../definition/IRoomTypeConfig';
import { RoomCoordinator } from '../../../lib/rooms/coordinator';
import { router } from '../../providers/RouterProvider';
import { Subscriptions } from '../../stores';
import RoomRoute from '../../views/room/RoomRoute';
import MainLayout from '../../views/root/MainLayout';
import { appLayout } from '../appLayout';

class RoomCoordinatorClient extends RoomCoordinator {
	public add(roomConfig: IRoomTypeClientConfig, directives: Partial<IRoomTypeClientDirectives>): void {
		this.addRoomType(roomConfig, {
			allowRoomSettingChange(_room: Partial<IRoom>, _setting: ValueOf<typeof RoomSettingsEnum>): boolean {
				return true;
			},
			allowMemberAction(
				_room: Partial<IRoom>,
				_action: ValueOf<typeof RoomMemberActions>,
				_showingUserId: IUser['_id'],
				_userSubscription?: ISubscription,
			): boolean {
				return false;
			},
			roomName(_room: AtLeast<IRoom, '_id' | 'name' | 'fname' | 'prid'>): string {
				return '';
			},
			isGroupChat(_room: Partial<IRoom>): boolean {
				return false;
			},
			getUiText(_context: ValueOf<typeof UiTextContext>): string {
				return '';
			},
			condition(): boolean {
				return true;
			},
			getAvatarPath(_room): string {
				return '';
			},
			findRoom(_identifier: string): IRoom | undefined {
				return undefined;
			},
			showJoinLink(_roomId: string): boolean {
				return false;
			},
			isLivechatRoom(): boolean {
				return false;
			},
			canSendMessage(room: IRoom): boolean {
				return Subscriptions.state.count((record) => record.rid === room._id) > 0;
			},
			...directives,
			config: roomConfig,
		});
	}

	public getRoomDirectives(roomType: string): IRoomTypeClientDirectives {
		return this.roomTypes[roomType].directives as IRoomTypeClientDirectives;
	}

	public openRouteLink(
		roomType: RoomType,
		subData: RoomIdentification,
		queryParams?: Record<string, string>,
		options: { replace?: boolean } = {},
	): void {
		const config = this.getRoomTypeConfig(roomType);
		if (!config?.route) {
			return;
		}

		let routeData = {};
		if (config.route.link) {
			routeData = config.route.link(subData);
		} else if (subData?.name) {
			routeData = {
				name: subData.name,
			};
		} else {
			return;
		}

		router.navigate(
			{
				pattern: config.route.path ?? '/home',
				params: routeData,
				search: queryParams,
			},
			options,
		);
	}

	public isLivechatRoom(roomType: string): boolean {
		return Boolean(this.getRoomDirectives(roomType).isLivechatRoom());
	}

	public getRoomName(roomType: string, roomData: AtLeast<IRoom, '_id' | 'name' | 'fname' | 'prid'>): string {
		return this.getRoomDirectives(roomType).roomName(roomData) ?? '';
	}

	readOnly(room?: IRoom, user?: AtLeast<IUser, 'username'> | null): boolean {
		if (!room) {
			return false;
		}

		const directives = this.getRoomDirectives(room.t);
		if (directives?.readOnly) {
			return directives.readOnly(room, user);
		}

		if (!user?.username) {
			return Boolean(room.ro);
		}

		if (!room) {
			return false;
		}

		if (Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1) {
			return true;
		}

		if (room.ro) {
			if (Array.isArray(room.unmuted) && room.unmuted.indexOf(user.username) !== -1) {
				return false;
			}

			if (hasPermission('post-readonly', room._id)) {
				return false;
			}

			return true;
		}

		return false;
	}

	private validateRoute<TRouteName extends RouteName>(route: IRoomTypeRouteConfig<TRouteName>): void {
		const { name, path, link } = route;

		if (typeof name !== 'string' || name.length === 0) {
			throw new Error('The route name must be a string.');
		}

		if (path !== undefined && (typeof path !== 'string' || path.length === 0)) {
			throw new Error('The route path must be a string.');
		}

		if (!['undefined', 'function'].includes(typeof link)) {
			throw new Error('The route link must be a function.');
		}
	}

	protected validateRoomConfig(roomConfig: IRoomTypeClientConfig): void {
		super.validateRoomConfig(roomConfig);

		const { route, label } = roomConfig;

		if (route !== undefined) {
			this.validateRoute(route);
		}

		if (label !== undefined && (typeof label !== 'string' || label.length === 0)) {
			throw new Error('The label must be a string.');
		}
	}

	protected addRoomType(roomConfig: IRoomTypeClientConfig, directives: IRoomTypeClientDirectives): void {
		super.addRoomType(roomConfig, directives);

		if (roomConfig.route?.path && roomConfig.route.name && directives.extractOpenRoomParams) {
			const {
				route: { name, path },
			} = roomConfig;
			const { extractOpenRoomParams } = directives;
			router.defineRoutes([
				{
					path,
					id: name,
					element: appLayout.wrap(
						<MainLayout>
							<RoomRoute key={name} extractOpenRoomParams={extractOpenRoomParams} />
						</MainLayout>,
					),
				},
			]);
		}
	}

	public getURL(roomType: string, subData: RoomIdentification): string | false {
		const config = this.getRoomTypeConfig(roomType);
		if (!config?.route) {
			return false;
		}

		const routeData = this.getRouteData(roomType, subData);
		if (!routeData) {
			return false;
		}

		return Meteor.absoluteUrl(
			router.buildRoutePath({
				name: config.route.name,
				params: routeData,
			}),
		);
	}

	public isRouteNameKnown(routeName: string): boolean {
		return Boolean(this.getRouteNameIdentifier(routeName));
	}

	public getRouteNameIdentifier(routeName: string): string | undefined {
		if (!routeName) {
			return;
		}

		return Object.keys(this.roomTypes).find((key) => this.roomTypes[key].config.route?.name === routeName);
	}
}

export const roomCoordinator = new RoomCoordinatorClient();
