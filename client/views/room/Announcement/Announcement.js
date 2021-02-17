import React from 'react';
import { Box } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import AnnouncementModal from './AnnouncementModal';
import { useSetModal } from '../../../contexts/ModalContext';
import MarkdownText from '../../../components/MarkdownText';

export const Announcement = ({ children, onClickOpen }) => {
	const announcementBar = css`
		background-color: var(--rc-color-announcement-primary-background);
		color: var(--rc-color-announcement-primary);
		cursor: pointer;
		transition: transform 0.2s ease-out;
		a{
			color: ${ colors.b600 } !important;
			text-decoration: underline !important;
		}
		> * {
			flex: auto;
		}
		&:hover,
		&:focus {
			background-color: var(--rc-color-announcement-secondary-background);
			color: var(--rc-color-announcement-secondary);
		}`;

	return <Box onClick={onClickOpen} height='x40' pi='x24' alignItems='center' display='flex' fontScale='p2' textAlign='center' className={announcementBar}><Box withTruncatedText w='none'>{children}</Box></Box>;
};

export default ({ announcement, announcementDetails }) => {
	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal());
	const handleClick = (e) => {
		if (e.target.href) {
			return;
		}

		if (window.getSelection().toString() !== '') {
			return;
		}

		announcementDetails ? announcementDetails() : setModal(<AnnouncementModal onClose={closeModal}>{announcement}</AnnouncementModal>);
	};
	const announcementWithoutBreaks = announcement && announcement.replace(/(\r\n|\n|\r)/gm, ' ');

	return announcementWithoutBreaks ? <Announcement onClickOpen={handleClick}><MarkdownText content={announcementWithoutBreaks} /></Announcement> : false;
};
