import { useRole, useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement, useLayoutEffect, useMemo, useRef } from 'react';

import { useEmbeddedLayout } from '../../../../hooks/useEmbeddedLayout';
import Announcement from '../../Announcement';
import { useRoom } from '../../contexts/RoomContext';
import { useTabBarAPI } from '../../providers/ToolboxProvider';
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

	const ref = useRef<HTMLDivElement>(null);

	const props = useMemo(
		() => ({
			tabBar,
			rid: room._id,
			_id: room._id,
		}),
		[room._id, tabBar],
	);

	useLayoutEffect(() => {
		if (!ref.current || !ref.current.parentElement) {
			return;
		}

		const view = Blaze.renderWithData(Template.roomOld, props, ref.current.parentElement, ref.current);
		return (): void => {
			view && Blaze.remove(view);
		};
	}, [props]);

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
							<div ref={ref} />
						</div>
					</div>
				</section>
			</div>
		</>
	);
};

export default memo(RoomBody);
