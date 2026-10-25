import type { Keys as Icons } from '@rocket.chat/icons';
import { styled, Text, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { textIconColors } from '../../../Theme';
import { toCSSValue } from '../../../helpers/toCSSValue';
import { borderRadius, borderWidth, fontFamily, spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { Icon } from '../../Icon';
import { focusBorder, focusBorderRadius, sidebarColorFontActive, sidebarColorSurfaceHover, typography } from '../sidebarStyles';

const fontDefault = textIconColors['font-default'];

const SidebarItemActionFrame = styled(Text, {
	render: 'div',
	...focusBorder,
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'flex-start',
	alignItems: 'center',
	flexShrink: 1,
	minWidth: 0,
	minHeight: 0,
	margin: 0,
	paddingBlock: `calc(${spacing('x4')} - ${borderWidth('default')})`,
	paddingInline: `calc(${spacing('x16')} - ${borderWidth('default')})`,
	overflow: 'hidden',
	cursor: 'pointer',
	whiteSpace: 'nowrap',
	wordWrap: 'inherit',
	textOverflow: 'ellipsis',
	textDecorationLine: { 'default': 'none', 'focus-visible': 'none' },
	color: {
		'default': toCSSValue('--rcx-link-color', fontDefault),
		'focus': toCSSValue('--rcx-link-focus-color', fontDefault),
		'focus-within': toCSSValue('--rcx-link-focus-color', fontDefault),
		'press': sidebarColorFontActive,
	},
	borderRadius: { 'default': toCSSValue('--rcx-border-radius-small', borderRadius('small')), 'focus-visible': focusBorderRadius },
	backgroundColor: { hover: sidebarColorSurfaceHover },
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
	gap: spacing('x4'),
	...typography('p2'),
});

export type SidebarItemActionProps = {
	onClick: (e: Event) => void;
	icon?: Icons;
} & HTMLAttributes<HTMLDivElement>;

const SidebarItemActionBase = ({ children, className, icon = 'plus-small', ...props }: SidebarItemActionProps) => (
	<SidebarItemActionFrame
		role='button'
		tabIndex={0}
		className={['rcx-sidebar-item rcx-sidebar-item__action', className].filter(Boolean).join(' ')}
		{...(props as GetProps<typeof SidebarItemActionFrame>)}
	>
		<Icon name={icon} size='x20' />
		{children}
	</SidebarItemActionFrame>
);

export const SidebarItemAction = withFuselageProvider(SidebarItemActionBase);
