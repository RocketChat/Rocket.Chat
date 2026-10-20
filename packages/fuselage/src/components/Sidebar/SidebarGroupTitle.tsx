import { styled, Text, View } from '@tamagui/web';
import type { AriaAttributes, HTMLAttributes, ReactNode } from 'react';

import { textIconColors } from '../../Theme';
import { cx } from '../../helpers/composeClassNames';
import { spacing } from '../../styleTokens';
import { Chevron } from '../Chevron';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { ItemGroupHeader, ItemGroupTitle } from '../Item';
import { focusBorder, focusBorderRadius, frameStyle, plainElement, textEllipsis, typography } from './sidebarStyles';
import { highlightVariant } from '../Item/itemStyles';

const SidebarGroupTitleHeading = styled(View, {
	...plainElement,
	flexDirection: 'row',
	alignItems: 'center',
	flexGrow: 1,
	flexBasis: 0,
	minWidth: 0,
	columnGap: spacing('x4'),
});

const SidebarGroupTitleTitle = styled(Text, {
	render: 'h4',
	...plainElement,
	display: 'block',
	margin: 0,
	whiteSpace: 'nowrap',
	...textEllipsis,
	...typography('c1'),

	variants: {
		unread: {
			true: typography('c2'),
		},
	} as const,
});

const barColor = {
	default: textIconColors['font-secondary-info'].toString(),
	empty: textIconColors['font-disabled'].toString(),
	unread: highlightVariant.sidebar.color,
};

const barButtonStyle = {
	display: 'flex',
	alignItems: 'center',
	flexGrow: 1,
	flexShrink: 1,
	flexBasis: 0,
	minWidth: 0,
	textAlign: 'start',
	columnGap: spacing('x4'),
};

const focusableBarButtonStyle = {
	...barButtonStyle,
	...focusBorder,
	cursor: 'pointer',
	borderRadius: { 'focus-visible': focusBorderRadius },
};

export type SidebarGroupTitleProps = {
	expanded?: boolean;
	empty?: boolean;
	title?: string;
	titleId?: string;
	badge?: ReactNode;
	menu?: ReactNode;
	barProps?: AriaAttributes;
} & HTMLAttributes<HTMLDivElement>;

/**
 * The header of a sidebar group. It renders an `ItemGroupHeader`, so its menu reveals on hover like a row's.
 */
const SidebarGroupTitleBase = ({
	title,
	titleId,
	badge,
	menu,
	barProps,
	expanded,
	empty,
	role,
	className,
	...props
}: SidebarGroupTitleProps) => {
	const isEmpty = !expanded && !!empty;
	const isUnread = !expanded && !!badge;
	const focusable = barProps && 'tabIndex' in barProps && barProps.tabIndex !== undefined;

	return (
		<ItemGroupHeader
			{...(props as Omit<HTMLAttributes<HTMLDivElement>, 'is'>)}
			{...frameStyle({
				paddingBlock: spacing('x8'),
				color: (isUnread && barColor.unread) || (isEmpty && barColor.empty) || barColor.default,
			})}
			inset='md'
			className={cx(
				'rcx-sidebar-collapse-group__bar',
				isEmpty && 'rcx-sidebar-collapse-group__bar--empty',
				isUnread && 'rcx-sidebar-collapse-group__bar--unread',
				className,
			)}
		>
			<ItemGroupTitle
				role={role}
				{...barProps}
				{...frameStyle(focusable ? focusableBarButtonStyle : barButtonStyle)}
				className='rcx-sidebar-collapse-group__bar-button'
			>
				<SidebarGroupTitleHeading className='rcx-sidebar-collapse-group__heading'>
					{title && (
						<SidebarGroupTitleTitle className='rcx-sidebar-collapse-group__title' id={titleId} unread={isUnread}>
							{title}
						</SidebarGroupTitleTitle>
					)}
					{expanded !== undefined && <Chevron size='x20' right={!expanded} />}
				</SidebarGroupTitleHeading>
				{!expanded && badge && badge}
			</ItemGroupTitle>
			{menu}
		</ItemGroupHeader>
	);
};

export const SidebarGroupTitle = withFuselageProvider(SidebarGroupTitleBase);
