import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import type { FC, MouseEvent } from 'react';
import React from 'react';

type AnnouncementComponentParams = {
	onClickOpen: (e: MouseEvent<HTMLAnchorElement>) => void;
};

const AnnouncementComponent: FC<AnnouncementComponentParams> = ({ children, onClickOpen }) => {
	const announcementBar = css`
		background-color: ${Palette.status['status-background-info'].theme('announcement-background')};
		color: ${Palette.statusColor['status-font-on-info'].theme('announcement-text')};
		cursor: pointer;
		transition: transform 0.2s ease-out;
		a {
			color: ${Palette.statusColor['status-font-on-info'].theme('announcement-text')};
			text-decoration: underline !important;
		}
		> * {
			flex: auto;
		}
		&:hover,
		&:focus {
			background-color: ${colors.p300};
			background-color: var(--rc-color-announcement-background-hover, ${colors.p300});
			color: ${colors.p800};
			color: var(--rc-color-announcement-text-hover, ${colors.p800});
		}
	`;

	return (
		<Box
			onClick={onClickOpen}
			height='x40'
			pi='x24'
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
