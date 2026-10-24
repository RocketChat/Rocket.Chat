import { styled, Text, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { ItemParentContext, type ItemParent } from './ItemContext';
import { toRender } from './itemStyles';
import { cx } from '../../helpers/composeClassNames';
import { spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export const ItemRowFrame = styled(Text, {
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	minWidth: 0,
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	gap: spacing('x4'),
});

const rowParent: ItemParent = { kind: 'row', gap: 'x4' };

export type ItemRowProps = {
	is?: ElementType;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * A horizontal line inside `ItemContent`, such as a title with a timestamp or a description with a badge.
 */
const ItemRow = ({ is: Tag = 'div', className, ...props }: ItemRowProps) => (
	<ItemParentContext.Provider value={rowParent}>
		<ItemRowFrame {...(props as GetProps<typeof ItemRowFrame>)} render={toRender(Tag)} className={cx('rcx-item__row', className)} />
	</ItemParentContext.Provider>
);

export default withFuselageProvider(ItemRow);
