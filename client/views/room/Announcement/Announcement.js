import React from 'react';
import { Box } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import AnnouncementModal from './AnnouncementModal';
import { useSetModal } from '../../../contexts/ModalContext';

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

	return <Box onClick={onClickOpen} display='flex' p='x16' fontScale='p2' textAlign='center' className={clickable}><Box withTruncatedText w='none'>{children}</Box></Box>;
};

export default ({ announcement }) => {
	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal());
	const handleClick = () => setModal(<AnnouncementModal onClose={closeModal}>{announcement}</AnnouncementModal>);

	return announcement && <Announcement onClickOpen={handleClick}>{announcement}</Announcement>;
};
