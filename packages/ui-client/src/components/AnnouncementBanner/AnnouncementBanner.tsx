import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes, ReactNode, MouseEvent } from 'react';

export type AnnouncementBannerProps = {
	children: ReactNode;
	onClick?: (e: MouseEvent) => void;
} & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>;

const AnnouncementBanner = ({ children, className, onClick, ...props }: AnnouncementBannerProps) => {
	// A banner with nothing to click is not a control, and already says so elsewhere — `tabIndex` and `role`
	// below both ask the same question. The pointer and the hover underline are the rest of that answer: they
	// promise something happens on click, and on a banner that only announces, nothing does.
	const clickable = Boolean(onClick);

	const announcementBar = css`
		background-color: ${Palette.status['status-background-info'].theme('announcement-background')};
		color: ${Palette.text['font-pure-black'].theme('announcement-text')};
		cursor: ${clickable ? 'pointer' : 'default'};
		transition: transform 0.2s ease-out;
		a:link {
			color: ${Palette.text['font-pure-black'].theme('announcement-text')};
			text-decoration: underline;
		}
		> * {
			flex: auto;
		}
		&:hover {
			text-decoration: ${clickable ? 'underline' : 'none'};
		}
	`;

	return (
		<Box
			focusable
			height='x40'
			paddingInline={24}
			alignItems='center'
			display='flex'
			fontScale='p2m'
			textAlign='center'
			borderRadius='none'
			className={[announcementBar, className]}
			tabIndex={onClick ? 0 : -1}
			role={onClick ? 'button' : 'banner'}
			onClick={onClick}
			{...props}
		>
			<Box withTruncatedText width='none'>
				{children}
			</Box>
		</Box>
	);
};

export default AnnouncementBanner;
