import { RoomBanner, RoomBannerContent } from '@rocket.chat/ui-client';
import type { FC, MouseEvent } from 'react';

type AnnouncementComponenttParams = {
	onClickOpen: (e: MouseEvent<HTMLAnchorElement>) => void;
};

const AnnouncementComponent: FC<AnnouncementComponenttParams> = ({ children, onClickOpen }) => (
	<RoomBanner className='rcx-header-section rcx-announcement-section' onClick={onClickOpen}>
		<RoomBannerContent data-qa='AnnouncementAnnoucementComponent'>{children}</RoomBannerContent>
	</RoomBanner>
);
export default AnnouncementComponent;
