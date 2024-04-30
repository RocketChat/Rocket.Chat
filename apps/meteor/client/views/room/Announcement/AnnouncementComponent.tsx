import { RoomBanner, RoomBannerContent } from '@rocket.chat/ui-client';
import type { FC, MouseEvent } from 'react';
import React from 'react';

type AnnouncementComponentParams = {
	onClickOpen: (e: MouseEvent<HTMLAnchorElement>) => void;
};

const AnnouncementComponent: FC<AnnouncementComponentParams> = ({ children, onClickOpen }) => (
	<RoomBanner className='rcx-header-section' onClick={onClickOpen} role='note'>
		<RoomBannerContent data-qa='AnnouncementAnnoucementComponent'>{children}</RoomBannerContent>
	</RoomBanner>
);
export default AnnouncementComponent;
