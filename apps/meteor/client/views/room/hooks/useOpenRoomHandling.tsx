import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import React, { Suspense, useEffect } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { Room, RoomSkeleton, RoomProvider, RoomNotFound } from '..';
import { Messages, Rooms, Subscriptions, ChatSubscription } from '../../../../app/models/client';
import { settings } from '../../../../app/settings/client';
import { RoomManager, RoomHistoryManager } from '../../../../app/ui-utils/client';
import * as openRoom from '../../../../app/ui-utils/client/lib/openRoom';
import { callbacks } from '../../../../lib/callbacks';
import { omit } from '../../../../lib/utils/omit';
import { appLayout } from '../../../lib/appLayout';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { call } from '../../../lib/utils/call';
import { callWithErrorHandling } from '../../../lib/utils/callWithErrorHandling';
import { fireGlobalEvent } from '../../../lib/utils/fireGlobalEvent';
import { queueMicrotask } from '../../../lib/utils/queueMicrotask';
import { waitUntilFind } from '../../../lib/utils/waitUntilFind';
import MainLayout from '../../root/MainLayout';

export const useOpenRoomHandling = (): void => {
	const openRoomParams = useSyncExternalStore(openRoom.subscribe, openRoom.getSnapshot);

	useEffect(() => {
		if (!openRoomParams) {
			return;
		}

		const { name, type, render } = openRoomParams;

		let currentTracker: Tracker.Computation | undefined;

		queueMicrotask(() => {
			currentTracker = Tracker.autorun(async (c) => {
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

					if (currentTracker) {
						currentTracker = undefined;
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
					Session.set('roomNotFound', { type, name, error });
					appLayout.render(
						<MainLayout>
							<RoomNotFound />
						</MainLayout>,
					);
				}
			});
		});

		return () => {
			currentTracker?.stop();
		};
	}, [openRoomParams]);
};
