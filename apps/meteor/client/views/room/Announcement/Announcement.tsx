import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';
import React, { FC, MouseEvent } from 'react';

import MarkdownText from '../../../components/MarkdownText';
import AnnouncementComponent from './AnnouncementComponent';
import AnnouncementModal from './AnnouncementModal';

type AnnouncementParams = {
	announcement: string;
	announcementDetails?: () => void;
};

const Announcement: FC<AnnouncementParams> = ({ announcement, announcementDetails }) => {
	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal(null));
	const handleClick = (e: MouseEvent<HTMLAnchorElement>): void => {
		if ((e.target as HTMLAnchorElement).href) {
			return;
		}

		if (window?.getSelection()?.toString() !== '') {
			return;
		}

		announcementDetails ? announcementDetails() : setModal(<AnnouncementModal onClose={closeModal}>{announcement}</AnnouncementModal>);
	};

	return announcement ? (
		<AnnouncementComponent onClickOpen={(e: MouseEvent<HTMLAnchorElement>): void => handleClick(e)}>
			<MarkdownText variant='inlineWithoutBreaks' content={announcement} withTruncatedText />
		</AnnouncementComponent>
	) : null;
};

export default Announcement;
