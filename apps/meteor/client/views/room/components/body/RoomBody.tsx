/* eslint-disable react/no-multi-comp */
import { useRole, useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import React, { memo, ReactElement, useCallback, useRef } from 'react';

import { RoomTemplateInstance } from '../../../../../app/ui/client/views/app/lib/RoomTemplateInstance';
import { useEmbeddedLayout } from '../../../../hooks/useEmbeddedLayout';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
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
	const hideFlexTab = useUserPreference('hideFlexTab');
	const tabBar = useTabBarAPI();
	const admin = useRole('admin');

	const [fileUploadTriggerProps, fileUploadOverlayProps] = useFileUploadDropTarget(room);

	const roomOldViewRef = useRef<Blaze.View>();
	const divRef = useCallback(
		(div: HTMLDivElement | null): void => {
			if (div?.parentElement) {
				roomOldViewRef.current = Blaze.renderWithData(
					Template.roomOld,
					{
						tabBar,
						rid: room._id,
						_id: room._id,
					},
					div.parentElement,
					div,
				);

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
		[fileUploadTriggerProps, room._id, tabBar],
	);

	const subscription = useReactiveValue(
		useCallback(
			() =>
				(roomOldViewRef.current &&
					(Blaze.getView(roomOldViewRef.current.firstNode() as HTMLElement).templateInstance() as RoomTemplateInstance).state.get(
						'subscription',
					)) ??
				undefined,
			[],
		),
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
