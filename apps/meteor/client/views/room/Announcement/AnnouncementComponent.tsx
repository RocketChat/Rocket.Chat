import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React, { FC, MouseEvent } from 'react';

type AnnouncementComponentParams = {
	onClickOpen: (e: MouseEvent<HTMLAnchorElement>) => void;
};

const AnnouncementComponent: FC<AnnouncementComponentParams> = ({ children, onClickOpen }) => {
	const announcementBar = css`
		background-color: ${colors.b200};
		background-color: var(--rc-color-announcement-background, ${colors.b200});
		color: ${colors.b600};
		color: var(--rc-color-announcement-text, ${colors.b600});
		cursor: pointer;
		transition: transform 0.2s ease-out;
		a {
			color: ${colors.b600} !important;
			color: var(--rc-color-announcement-text, ${colors.b600}) !important;
			text-decoration: underline !important;
		}
		> * {
			flex: auto;
		}
		&:hover,
		&:focus {
			background-color: ${colors.b300};
			background-color: var(--rc-color-announcement-background-hover, ${colors.b300});
			color: ${colors.b800};
			color: var(--rc-color-announcement-text-hover, ${colors.b800});
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
