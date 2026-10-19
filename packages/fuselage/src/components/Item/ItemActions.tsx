import { styled, View, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { toRender } from './itemStyles';
import { cx, cxx } from '../../helpers/composeClassNames';
import { spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

// The `reveal-hover` modifier stays in SCSS with the hover, focus and touch rules that reveal it.
const ItemActionsFrame = styled(View, {
	position: 'relative',
	zIndex: 1,
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	minWidth: 'auto',
	minHeight: 'auto',
	gap: spacing('x2'),
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
const ItemActions = ({ is: Tag = 'div', reveal = 'always', className, children, ...props }: ItemActionsProps) => (
	<ItemActionsFrame
		{...(props as GetProps<typeof ItemActionsFrame>)}
		render={toRender(Tag)}
		className={cx(cxx('rcx-item__actions')({ 'reveal-hover': reveal === 'hover' }), className)}
	>
		{reveal === 'hover' ? <ItemActionsInner className='rcx-item__actions-inner'>{children}</ItemActionsInner> : children}
	</ItemActionsFrame>
);

export default withFuselageProvider(ItemActions);
