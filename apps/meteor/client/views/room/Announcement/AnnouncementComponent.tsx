import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { FC, MouseEvent } from 'react';
import React from 'react';

type AnnouncementComponentParams = {
	onClickOpen: (e: MouseEvent<HTMLAnchorElement>) => void;
};

const AnnouncementComponent: FC<AnnouncementComponentParams> = ({ children, onClickOpen }) => {
	const announcementBar = css`
		background-color: ${Palette.status['status-background-info'].theme('announcement-background')};
		color: ${Palette.text['font-pure-black'].theme('announcement-text')};
		cursor: pointer;
		transition: transform 0.2s ease-out;
		a:link {
			color: ${Palette.text['font-pure-black'].theme('announcement-text')};
			text-decoration: underline;
		}
		> * {
			flex: auto;
		}
		&:hover,
		&:focus {
			text-decoration: underline;
		}
	`;

	return (
		<Box
			onClick={onClickOpen}
			height='x40'
			pi={24}
			alignItems='center'
			display='flex'
			fontScale='p2m'
			textAlign='center'
			className={announcementBar}
		>
			<Box withTruncatedText w='none' data-qa='AnnouncementAnnoucementComponent'>
				{children}
			</Box>
		</Box>
	);
};

export default AnnouncementComponent;
