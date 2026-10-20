import { styled, View, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';
import { useContext } from 'react';

import { ItemParentContext } from './ItemContext';
import { toRender } from './itemStyles';
import { cx, cxx } from '../../helpers/composeClassNames';
import { spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const revealDuration = '0.18s';

// Hidden until its row or group header is hovered, holds focus, has an open menu or sits on a touch screen, all of which
// `Item.styles.css` handles: a group clause would subscribe every row's actions to the row's state

// While hidden it takes no room, so it also cancels the gap in front of it
const cancelGap = (gap: 'x4' | 'x8') => ({
	marginInlineStart: `calc(${spacing(gap)} * -1)`,
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
				opacity: 0,
				gridTemplateColumns: '0fr',
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
	overflow: 'hidden',
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
