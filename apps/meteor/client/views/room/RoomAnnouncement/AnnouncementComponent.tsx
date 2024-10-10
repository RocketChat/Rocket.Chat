import { RoomBanner, RoomBannerContent } from '@rocket.chat/ui-client';
import type { MouseEvent, ReactNode } from 'react';
import React from 'react';

type AnnouncementComponentProps = {
	children: ReactNode;
	onClickOpen: (e: MouseEvent<HTMLAnchorElement>) => void;
};

const AnnouncementComponent = ({ children, onClickOpen }: AnnouncementComponentProps) => (
	<RoomBanner className='rcx-header-section' onClick={onClickOpen}>
		<RoomBannerContent data-qa='AnnouncementAnnoucementComponent'>{children}</RoomBannerContent>
	</RoomBanner>
);

export default AnnouncementComponent;
