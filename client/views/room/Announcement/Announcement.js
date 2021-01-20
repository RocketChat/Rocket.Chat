import React from 'react';
import { Box } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import AnnouncementModal from './AnnouncementModal';
import { useSetModal } from '../../../contexts/ModalContext';
import MarkdownText from '../../../components/MarkdownText';

export const Announcement = ({ children, onClickOpen }) => {
	const clickable = css`
		background-color: ${ colors.b200 };
		color: ${ colors.b600 };
		cursor: pointer;
		transition: transform 0.2s ease-out;
		> * {
			flex: auto;
		}
		&:hover,
		&:focus {
			background-color: ${ colors.b300 };
			color: ${ colors.b800 };
		}`;

	return <Box onClick={onClickOpen} height='x40' alignItems='center' display='flex' fontScale='p2' textAlign='center' className={clickable}><Box withTruncatedText w='none'>{children}</Box></Box>;
};

export default ({ announcement, announcementDetails }) => {
	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal());
	const handleClick = () => {
		announcementDetails ? announcementDetails() : setModal(<AnnouncementModal onClose={closeModal}>{announcement}</AnnouncementModal>);
	};

	return announcement ? <Announcement onClickOpen={handleClick}><MarkdownText content={announcement} /></Announcement> : false;
};
