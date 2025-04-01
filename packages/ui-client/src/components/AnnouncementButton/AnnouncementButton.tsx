import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes, MouseEvent, ReactNode } from 'react';

type AnnouncementButtonProps = {
	children: ReactNode;
	onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
} & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>;

const AnnouncementButton = ({ children, onClick, ...props }: AnnouncementButtonProps) => {
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
			tabIndex={onClick ? 0 : -1}
			height='x40'
			pi={24}
			alignItems='center'
			display='flex'
			fontScale='p2m'
			textAlign='center'
			className={announcementBar}
			role={onClick ? 'button' : 'banner'}
			onClick={onClick}
			{...props}
		>
			<Box withTruncatedText w='none'>
				{children}
			</Box>
		</Box>
	);
};

export default AnnouncementButton;
