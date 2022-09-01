import { useMethod, useRole, useToastMessageDispatch, useTranslation, useUser, useUserPreference } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import React, { memo, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Subscriptions, RoomRoles, ChatMessage } from '../../../../../app/models/client';
import { RoomTemplateInstance } from '../../../../../app/ui/client/views/app/lib/RoomTemplateInstance';
import { useEmbeddedLayout } from '../../../../hooks/useEmbeddedLayout';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import Announcement from '../../Announcement';
import { useRoom } from '../../contexts/RoomContext';
import { useTabBarAPI } from '../../providers/ToolboxProvider';
import ComposerContainer from './ComposerContainer';
import DropTargetOverlay from './DropTargetOverlay';
import { useFileUploadDropTarget } from './useFileUploadDropTarget';

const RoomBody = (): ReactElement => {
	const t = useTranslation();
	const isLayoutEmbedded = useEmbeddedLayout();
	const room = useRoom();
	const user = useUser();
	const hideFlexTab = useUserPreference('hideFlexTab');
	const tabBar = useTabBarAPI();
	const admin = useRole('admin');
	const subscription = useReactiveValue(useCallback(() => Subscriptions.findOne({ rid: room._id }), [room._id]));
	const [count, setCount] = useState(0);
	const [selectable, setSelectable] = useState(false);
	const [lastMessage, setLastMessage] = useState<Date | undefined>();
	const userDetail = useMemo(() => {
		if (room.t !== 'd') {
			return '';
		}

		if (roomCoordinator.getRoomDirectives(room.t)?.isGroupChat(room)) {
			return '';
		}

		const usernames = Array.from(new Set(room.usernames));

		return usernames.length === 1 ? usernames[0] : usernames.filter((username) => username !== user?.username)[0];
	}, [room, user?.username]);
	const [hideLeaderHeader, setHideLeaderHeader] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);

	const queryClient = useQueryClient();
	const getRoomRoles = useMethod('getRoomRoles');
	const dispatchToastMessage = useToastMessageDispatch();

	useEffect(() => {
		queryClient
			.fetchQuery({
				queryKey: ['room', room._id, 'roles'],
				queryFn: () => getRoomRoles(room._id),
				staleTime: 15_000,
			})
			.then((results) => {
				Array.from(results).forEach(({ _id, ...data }) => {
					const {
						rid,
						u: { _id: uid },
					} = data;
					RoomRoles.upsert({ rid, 'u._id': uid }, data);
				});
			})
			.catch((error) => {
				dispatchToastMessage({ type: 'error', message: error });
			});

		const rolesObserve = RoomRoles.find({ rid: room._id }).observe({
			added: (role) => {
				if (!role.u || !role.u._id) {
					return;
				}
				ChatMessage.update({ 'rid': room._id, 'u._id': role.u._id }, { $addToSet: { roles: role._id } }, { multi: true });
			}, // Update message to re-render DOM
			changed: (role) => {
				if (!role.u || !role.u._id) {
					return;
				}
				ChatMessage.update({ 'rid': room._id, 'u._id': role.u._id }, { $inc: { rerender: 1 } }, { multi: true });
			}, // Update message to re-render DOM
			removed: (role) => {
				if (!role.u || !role.u._id) {
					return;
				}
				ChatMessage.update({ 'rid': room._id, 'u._id': role.u._id }, { $pull: { roles: role._id } }, { multi: true });
			},
		});

		return (): void => {
			rolesObserve.stop();
		};
	}, [dispatchToastMessage, getRoomRoles, queryClient, room._id]);

	const [fileUploadTriggerProps, fileUploadOverlayProps] = useFileUploadDropTarget(room);

	const roomOldViewRef = useRef<Blaze.View>();
	const roomOldViewDataRef = useRef(
		new ReactiveVar<RoomTemplateInstance['data']>({
			tabBar,
			rid: room._id,
			_id: room._id,
			room,
			subscription,
			count,
			setCount,
			selectable,
			setSelectable,
			subscribed: !!subscription,
			lastMessage,
			setLastMessage,
			userDetail,
			hideLeaderHeader,
			setHideLeaderHeader,
			unreadCount,
			setUnreadCount,
		}),
	);

	useEffect(() => {
		roomOldViewDataRef.current.set({
			tabBar,
			rid: room._id,
			_id: room._id,
			room,
			subscription,
			count,
			setCount,
			selectable,
			setSelectable,
			subscribed: !!subscription,
			lastMessage,
			setLastMessage,
			userDetail,
			hideLeaderHeader,
			setHideLeaderHeader,
			unreadCount,
			setUnreadCount,
		});
	}, [count, hideLeaderHeader, lastMessage, room, selectable, subscription, tabBar, unreadCount, userDetail]);

	const divRef = useCallback(
		(div: HTMLDivElement | null): void => {
			if (div?.parentElement) {
				roomOldViewRef.current = Blaze.renderWithData(Template.roomOld, () => roomOldViewDataRef.current.get(), div.parentElement, div);

				div.parentElement.addEventListener(
					'dragenter',
					(event) => {
						fileUploadTriggerProps.onDragEnter(event as any); // TODO: WHY?
					},
					{ capture: true },
				);
				return;
			}

			if (roomOldViewRef.current) {
				Blaze.remove(roomOldViewRef.current);
				roomOldViewRef.current = undefined;
			}
		},
		[fileUploadTriggerProps],
	);

	const sendToBottomIfNecessary = useReactiveValue(
		useCallback(
			() =>
				(roomOldViewRef.current &&
					(Blaze.getView(roomOldViewRef.current.firstNode() as HTMLElement).templateInstance() as RoomTemplateInstance)
						.sendToBottomIfNecessary) ??
				undefined,
			[],
		),
	);

	return (
		<>
			{!isLayoutEmbedded && room.announcement && <Announcement announcement={room.announcement} announcementDetails={undefined} />}
			<div className='main-content-flex'>
				<section
					className={`messages-container flex-tab-main-content ${admin ? 'admin' : ''}`}
					id={`chat-window-${room._id}`}
					aria-label={t('Channel')}
					onClick={hideFlexTab ? tabBar.close : undefined}
				>
					<div className='messages-container-wrapper'>
						<div className='messages-container-main' {...fileUploadTriggerProps}>
							<DropTargetOverlay {...fileUploadOverlayProps} />
							<div ref={divRef} />
							<ComposerContainer rid={room._id} subscription={subscription} sendToBottomIfNecessary={sendToBottomIfNecessary} />
						</div>
					</div>
				</section>
			</div>
		</>
	);
};

export default memo(RoomBody);
