import type { css as cssFn } from '@rocket.chat/css-in-js';
import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes, ReactNode, MouseEvent } from 'react';

export type AnnouncementBannerProps = {
	children: ReactNode;
	onClick?: (e: MouseEvent) => void;
	/** Composed with the banner's own styles, so `css` output is as welcome as a plain class name. */
	className?: string | ReturnType<typeof cssFn>;
} & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is' | 'className'>;

const AnnouncementBanner = ({ children, className, onClick, ...props }: AnnouncementBannerProps) => {
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
		&:hover {
			text-decoration: underline;
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
			borderRadius={0}
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
