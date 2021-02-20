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
		background-color: ${ colors.b200 };
		background-color: var(--rc-color-announcement-background, ${ colors.b200 });
		color: ${ colors.b600 };
		color: var(--rc-color-announcement-text, ${ colors.b600 });
		cursor: pointer;
		transition: transform 0.2s ease-out;
		a{
			color: ${ colors.b600 } !important;
			color: var(--rc-color-announcement-text, ${ colors.b600 }) !important;
			text-decoration: underline !important;
		}
		> * {
			flex: auto;
		}
		&:hover,
		&:focus {
			background-color: ${ colors.b300 };
			background-color: var(--rc-color-announcement-background-hover, ${ colors.b300 });
			color: ${ colors.b800 };
			color: var(--rc-color-announcement-text-hover, ${ colors.b800 });
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

	return announcementWithoutBreaks ? <Announcement onClickOpen={handleClick}><MarkdownText variant='inlineWithoutBreaks' content={announcementWithoutBreaks} /></Announcement> : false;
};
