import React, { Suspense } from 'react';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import type { RoomType } from '@rocket.chat/core-typings';

import { appLayout } from '../../../../client/lib/appLayout';
import { waitUntilFind } from '../../../../client/lib/utils/waitUntilFind';
import { ChatSubscription, Rooms, Subscriptions } from '../../../models/client';
import { settings } from '../../../settings/client';
import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';
import { call } from '../../../../client/lib/utils/call';
import { LegacyRoomManager } from '..';
import { fireGlobalEvent } from '../../../../client/lib/utils/fireGlobalEvent';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
import MainLayout from '../../../../client/views/root/MainLayout';
import { omit } from '../../../../lib/utils/omit';
import { RoomSkeleton, RoomProvider, Room, RoomNotFound } from '../../../../client/views/room';
import { RoomManager } from '../../../../client/lib/RoomManager';
import { readMessage } from './readMessages';

export async function openRoom(type: RoomType, name: string, render = true) {
	setTimeout(() => {
		LegacyRoomManager.currentTracker?.stop();
		LegacyRoomManager.currentTracker = Tracker.autorun(async function (c) {
			const user = await Meteor.userAsync();
			if ((user && user.username == null) || (user == null && settings.get('Accounts_AllowAnonymousRead') === false)) {
				appLayout.render(<MainLayout />);
				return;
			}

			try {
				const room = roomCoordinator.getRoomDirectives(type).findRoom(name) || (await call('getRoomByTypeAndName', type, name));
				if (!room._id) {
					return;
				}

				Rooms.upsert({ _id: room._id }, { $set: room });

				if (room._id !== name && type === 'd') {
					// Redirect old url using username to rid
					await LegacyRoomManager.close(type + name);
					FlowRouter.go('direct', { rid: room._id }, FlowRouter.current().queryParams);
					return;
				}

				LegacyRoomManager.open({ typeName: type + name, rid: room._id });

				c.stop();

				if (room._id === RoomManager.opened) {
					return;
				}

				if (render) {
					appLayout.render(
						<MainLayout>
							<Suspense fallback={<RoomSkeleton />}>
								<RoomProvider rid={room._id}>
									<Room />
								</RoomProvider>
							</Suspense>
						</MainLayout>,
					);
				}

				if (LegacyRoomManager.currentTracker) {
					LegacyRoomManager.currentTracker = undefined;
				}

				fireGlobalEvent('room-opened', omit(room, 'usernames'));

				Session.set('editRoomTitle', false);
				// KonchatNotification.removeRoomNotification(params._id)
				// update user's room subscription
				const sub = ChatSubscription.findOne({ rid: room._id });
				if (sub && sub.open === false) {
					await callWithErrorHandling('openRoom', room._id);
				}

				if (sub) {
					const { rid } = sub;
					setTimeout(() => readMessage.read(rid), 1000);
				}
			} catch (error) {
				c.stop();

				FlowRouter.setQueryParams({ msg: null });

				if (type === 'd') {
					try {
						const { rid } = await call('createDirectMessage', ...name.split(', '));
						await waitUntilFind(() => Subscriptions.findOne({ rid }));
						return FlowRouter.go('direct', { rid }, FlowRouter.current().queryParams);
					} catch (error) {
						console.error(error);
					}
				}

				appLayout.render(
					<MainLayout>
						<RoomNotFound />
					</MainLayout>,
				);
			}
		});
	});
}
