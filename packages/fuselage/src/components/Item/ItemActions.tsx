import { styled, View, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';
import { useContext } from 'react';

import { ItemParentContext } from './ItemContext';
import { toRender } from './itemStyles';
import { cx, cxx } from '../../helpers/composeClassNames';
import { spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const revealDuration = '0.18s';

// Shown while its row or group header is hovered or holds focus; touch screens and open menus reveal it from `Item.styles.css`
const revealed = <T,>(value: T) => ({
	'group-hover/rcx-item': value,
	'group-focus-within/rcx-item': value,
	'group-hover/rcx-item-group-header': value,
	'group-focus-within/rcx-item-group-header': value,
});

// While hidden it takes no room, so it also cancels the gap in front of it
const cancelGap = (gap: 'x4' | 'x8') => ({
	marginInlineStart: { default: `calc(${spacing(gap)} * -1)`, ...revealed(0) },
});

const ItemActionsFrame = styled(View, {
	position: 'relative',
	zIndex: 1,
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	minWidth: 'auto',
	minHeight: 'auto',
	gap: spacing('x2'),

	variants: {
		reveal: {
			always: {},
			hover: {
				display: 'grid',
				transitionProperty: 'grid-template-columns, margin-inline-start, opacity',
				transitionDuration: revealDuration,
				transitionTimingFunction: 'ease',
				opacity: { default: 0, ...revealed(1) },
				gridTemplateColumns: { default: '0fr', ...revealed('1fr') },
			},
		},
		gapOffset: {
			none: {},
			x4: cancelGap('x4'),
			x8: cancelGap('x8'),
		},
		// Inside an `ItemRow` it overhangs the line instead of growing it, so the row keeps its text height
		overhang: {
			true: {
				alignContent: 'center',
				height: 0,
			},
		},
	} as const,
});

const ItemActionsInner = styled(View, {
	display: 'flex',
	flexDirection: 'row',
	overflow: { 'default': 'hidden', 'group-focus-within/rcx-item': 'visible' },
	alignItems: 'center',
	flexShrink: 1,
	minHeight: 'auto',
	gap: spacing('x2'),
});

export type ItemActionsProps = {
	is?: ElementType;
	/**
	 * `hover` hides the actions until the row is hovered, holds focus or has an expanded menu.
	 * They stay in the tab order, and touch screens always show them.
	 */
	reveal?: 'always' | 'hover';
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * The trailing buttons, icon buttons or menu trigger of an `Item` or `ItemGroupHeader`.
 * Placed as a direct child it spans every row; placed inside an `ItemRow` it only takes space from that row.
 */
const ItemActions = ({ is: Tag = 'div', reveal = 'always', className, children, ...props }: ItemActionsProps) => {
	const parent = useContext(ItemParentContext);

	return (
		<ItemActionsFrame
			{...(props as GetProps<typeof ItemActionsFrame>)}
			render={toRender(Tag)}
			reveal={reveal}
			gapOffset={reveal === 'hover' && parent ? parent.gap : 'none'}
			overhang={parent?.kind === 'row'}
			className={cx(cxx('rcx-item__actions')({ 'reveal-hover': reveal === 'hover' }), className)}
		>
			{reveal === 'hover' ? <ItemActionsInner className='rcx-item__actions-inner'>{children}</ItemActionsInner> : children}
		</ItemActionsFrame>
	);
};

export default withFuselageProvider(ItemActions);
