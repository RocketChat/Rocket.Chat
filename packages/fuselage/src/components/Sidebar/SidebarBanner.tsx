import { styled, Text, View, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { borderWidth, spacing } from '../../styleTokens';
import { IconButton } from '../Button';
import { boxFull, sidebarAccordionBorderColor, sidebarBannerColors, typography } from './sidebarStyles';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const SidebarBannerFrame = styled(View, {
	...boxFull,
	flexDirection: 'row',
	justifyContent: 'space-between',
	alignItems: 'center',
	padding: spacing('x16'),
	borderBottomWidth: borderWidth('default'),
	borderBottomColor: sidebarAccordionBorderColor,
	gap: spacing('x12'),
	...sidebarBannerColors.default,

	variants: {
		variant: {
			default: sidebarBannerColors.default,
			info: sidebarBannerColors.info,
			success: sidebarBannerColors.success,
			warning: sidebarBannerColors.warning,
			danger: sidebarBannerColors.danger,
		},
	} as const,
});

const SidebarBannerContent = styled(Text, {
	...boxFull,
	render: 'div',
	display: 'block',
	whiteSpace: 'inherit',
});

const SidebarBannerTitle = styled(Text, {
	...boxFull,
	render: 'h5',
	display: 'block',
	whiteSpace: 'inherit',
	...typography('h5'),
});

const SidebarBannerLink = styled(Text, {
	...boxFull,
	render: 'a',
	display: 'inline-block',
	whiteSpace: 'inherit',
	cursor: 'pointer',
	textDecorationLine: 'underline',
	...typography('p2m'),
});

const SidebarBannerAddon = styled(View, {
	...boxFull,
	flexDirection: 'row',
	alignItems: 'center',
});

export type SidebarBannerVariant = 'default' | 'info' | 'success' | 'warning' | 'danger';

export type SidebarBannerProps = {
	title?: ReactNode;
	linkText?: string;
	linkProps?: AllHTMLAttributes<HTMLAnchorElement>;
	onClick?: () => void;
	variant?: SidebarBannerVariant;
	onClose?: () => void;
	children?: ReactNode;
	addon?: ReactNode;
};

const SidebarBannerBase = ({ title, linkText, linkProps, variant = 'default', addon, onClose, children, ...props }: SidebarBannerProps) => (
	<SidebarBannerFrame variant={variant} className={`rcx-sidebar-banner rcx-sidebar-banner--${variant}`} {...props}>
		<SidebarBannerContent className='rcx-sidebar-banner__content'>
			{title && <SidebarBannerTitle className='rcx-sidebar-banner__title'>{title}</SidebarBannerTitle>}
			{linkText && (
				<SidebarBannerLink
					{...(linkProps as GetProps<typeof SidebarBannerLink>)}
					className={['rcx-sidebar-banner__link', linkProps?.className].filter(Boolean).join(' ')}
				>
					{linkText}
				</SidebarBannerLink>
			)}
			{children}
		</SidebarBannerContent>
		<SidebarBannerAddon className='rcx-sidebar-banner__addon'>
			{addon}
			{onClose && <IconButton onClick={onClose} tiny icon='cross' />}
		</SidebarBannerAddon>
	</SidebarBannerFrame>
);

export const SidebarBanner = withFuselageProvider(SidebarBannerBase);
