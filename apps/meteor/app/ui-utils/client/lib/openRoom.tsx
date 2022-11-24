import React, { Suspense } from 'react';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import type { RoomType } from '@rocket.chat/core-typings';

import { appLayout } from '../../../../client/lib/appLayout';
import { waitUntilFind } from '../../../../client/lib/utils/waitUntilFind';
import { Messages, ChatSubscription, Rooms, Subscriptions } from '../../../models/client';
import { settings } from '../../../settings/client';
import { callbacks } from '../../../../lib/callbacks';
import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';
import { call } from '../../../../client/lib/utils/call';
import { RoomManager, RoomHistoryManager } from '..';
import { fireGlobalEvent } from '../../../../client/lib/utils/fireGlobalEvent';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
import MainLayout from '../../../../client/views/root/MainLayout';
import { omit } from '../../../../lib/utils/omit';
import { RoomSkeleton, RoomProvider, Room, RoomNotFound } from '../../../../client/views/room';

export async function openRoom(type: RoomType, name: string, render = true) {
	setTimeout(() => {
		RoomManager.currentTracker?.stop();
		RoomManager.currentTracker = Tracker.autorun(async function (c) {
			const user = Meteor.user();
			if ((user && user.username == null) || (user == null && settings.get('Accounts_AllowAnonymousRead') === false)) {
				appLayout.render(<MainLayout />);
				return;
			}

			try {
				const room = roomCoordinator.getRoomDirectives(type)?.findRoom(name) || (await call('getRoomByTypeAndName', type, name));
				Rooms.upsert({ _id: room._id }, omit(room, '_id'));

				if (room._id !== name && type === 'd') {
					// Redirect old url using username to rid
					RoomManager.close(type + name);
					return FlowRouter.go('direct', { rid: room._id }, FlowRouter.current().queryParams);
				}

				RoomManager.open({ typeName: type + name, rid: room._id });

				c.stop();
				if (room._id === Session.get('openedRoom') && !FlowRouter.getQueryParam('msg')) {
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

				if (RoomManager.currentTracker) {
					RoomManager.currentTracker = undefined;
				}

				fireGlobalEvent('room-opened', omit(room, 'usernames'));

				Session.set('editRoomTitle', false);
				// KonchatNotification.removeRoomNotification(params._id)
				// update user's room subscription
				const sub = ChatSubscription.findOne({ rid: room._id });
				if (sub && sub.open === false) {
					await callWithErrorHandling('openRoom', room._id);
				}

				if (FlowRouter.getQueryParam('msg')) {
					const messageId = FlowRouter.getQueryParam('msg');
					const msg = { _id: messageId, rid: room._id };

					const message = Messages.findOne({ _id: msg._id }) || (await callWithErrorHandling('getMessages', [msg._id]))[0];

					if (message && (message.tmid || message.tcount)) {
						return FlowRouter.setParams({ tab: 'thread', context: message.tmid || message._id });
					}

					RoomHistoryManager.getSurroundingMessages(msg);
					FlowRouter.setQueryParams({
						msg: null,
					});
				}

				return callbacks.run('enter-room', sub);
			} catch (error) {
				c.stop();

				if (FlowRouter.getQueryParam('msg')) {
					FlowRouter.setQueryParams({
						msg: null,
					});
				}

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
