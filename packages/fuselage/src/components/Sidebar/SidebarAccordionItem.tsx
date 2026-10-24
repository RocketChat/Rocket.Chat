import { styled, Text, View, type GetProps } from '@tamagui/web';
import type { HTMLAttributes, ReactNode } from 'react';

import { surfaceColors, textIconColors } from '../../Theme';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, borderWidth, size, spacing } from '../../styleTokens';
import { Chevron } from '../Chevron';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { useCollapse } from './hooks/useCollapse';
import {
	boxFull,
	focusBorder,
	focusBorderRadius,
	frameStyle,
	plainElement,
	sidebarAccordionBorderColor,
	sidebarColorSurfaceDefault,
	textEllipsis,
	typography,
} from './sidebarStyles';

const SidebarAccordionItemFrame = styled(View, {
	render: 'section',
	...boxFull,
	flexWrap: 'nowrap',
	flexBasis: 0,
	borderWidth: borderWidth('medium'),
	borderColor: 'transparent',
	borderBottomWidth: borderWidth('default'),
	borderBottomColor: sidebarAccordionBorderColor,
});

const barRadius = toCSSValue('--rcx-border-radius-small', borderRadius('small'));

const SidebarAccordionItemBar = styled(View, {
	...boxFull,
	group: 'rcx-sidebar-accordion-item-bar' as never,
	position: 'sticky',
	zIndex: 1,
	top: 0,
	flexDirection: 'row',
	flexWrap: 'nowrap',
	alignItems: 'center',
	minHeight: size('x24'),
	paddingBlock: `calc(${spacing('x8')} - ${borderWidth('default')})`,
	paddingInline: `calc(${spacing('x16')} - ${borderWidth('default')})`,
	textAlign: 'start',
	color: textIconColors['font-default'].toString(),
	borderRadius: barRadius,
	backgroundColor: sidebarColorSurfaceDefault,
	columnGap: spacing('x4'),

	variants: {
		// Only a bar that takes focus toggles its panel
		clickable: {
			true: {
				...focusBorder,
				cursor: 'pointer',
				borderRadius: { 'default': barRadius, 'focus-visible': focusBorderRadius },
				backgroundColor: { default: sidebarColorSurfaceDefault, hover: surfaceColors['surface-tint'].toString() },
			},
		},
		isDisabled: {
			true: {
				cursor: 'not-allowed',
				color: textIconColors['font-disabled'].toString(),
			},
		},
	} as const,
});

// The chevron only shows while its bar is hovered or holds keyboard focus
const chevronStyle = frameStyle({
	visibility: {
		'default': 'hidden',
		'group-hover/rcx-sidebar-accordion-item-bar': 'visible',
		'group-focus-visible/rcx-sidebar-accordion-item-bar': 'visible',
	},
});

const SidebarAccordionItemTitle = styled(Text, {
	render: 'h5',
	...plainElement,
	display: 'block',
	margin: 0,
	whiteSpace: 'nowrap',
	...textEllipsis,
	...typography('h5'),
});

const SidebarAccordionItemPanel = styled(View, {
	...plainElement,
	display: 'block',
	visibility: 'hidden',
	overflow: 'hidden',
	height: size('none'),
	margin: 0,
	padding: 0,
	listStyle: 'none',

	variants: {
		expanded: {
			true: {
				visibility: 'visible',
				flexGrow: 1,
				height: '100%',
				paddingTop: spacing('x4'),
				paddingBottom: spacing('x8'),
			},
		},
	} as const,
});

export type SidebarAccordionItemProps = {
	children?: ReactNode;
	className?: string;
	defaultExpanded?: boolean;
	disabled?: boolean;
	expanded?: boolean;
	title: ReactNode;
	noncollapsible?: boolean;
	badge?: ReactNode;
} & HTMLAttributes<HTMLElement>;

const SidebarAccordionItem = ({
	children,
	title,
	badge,
	noncollapsible,
	disabled,
	expanded: propExpanded,
	defaultExpanded,
	tabIndex,
	className,
	...props
}: SidebarAccordionItemProps) => {
	const { barProps, expanded, panelExpanded, panelId, titleId } = useCollapse({
		expanded: propExpanded,
		defaultExpanded,
		tabIndex,
		disabled,
		noncollapsible,
	});

	return (
		<SidebarAccordionItemFrame
			className={['rcx-sidebar-accordion-item', className].filter(Boolean).join(' ')}
			{...(props as GetProps<typeof SidebarAccordionItemFrame>)}
		>
			<SidebarAccordionItemBar
				role='button'
				clickable={'tabIndex' in barProps && barProps.tabIndex !== undefined}
				isDisabled={!!disabled}
				className={['rcx-sidebar-accordion-item__bar rcx-box--animated', disabled && 'rcx-sidebar-accordion-item__bar--disabled']
					.filter(Boolean)
					.join(' ')}
				{...(barProps as unknown as GetProps<typeof SidebarAccordionItemBar>)}
			>
				{!noncollapsible && <Chevron className='rcx-sidebar-accordion-item__chevron' size='x16' right={!expanded} {...chevronStyle} />}
				{title && (
					<SidebarAccordionItemTitle className='rcx-sidebar-accordion-item__title' id={titleId}>
						{title}
					</SidebarAccordionItemTitle>
				)}
				{!expanded && badge && badge}
			</SidebarAccordionItemBar>
			<SidebarAccordionItemPanel
				expanded={!!panelExpanded}
				className={[
					'rcx-sidebar-accordion-item__panel',
					'rcx-box--animated',
					panelExpanded && 'rcx-sidebar-accordion-item__panel--expanded',
				]
					.filter(Boolean)
					.join(' ')}
				id={panelId}
			>
				{children}
			</SidebarAccordionItemPanel>
		</SidebarAccordionItemFrame>
	);
};

export default withFuselageProvider(SidebarAccordionItem);
