import { styled, Text, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { toRender } from './itemStyles';
import { cx } from '../../helpers/composeClassNames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const ItemRowFrame = styled(Text, {
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	minWidth: 0,
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	gap: 'var(--rcx-item-gap)',
});

export type ItemRowProps = {
	is?: ElementType;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * A horizontal line inside `ItemContent`, such as a title with a timestamp or a description with a badge.
 */
const ItemRow = ({ is: Tag = 'div', className, ...props }: ItemRowProps) => (
	<ItemRowFrame {...(props as GetProps<typeof ItemRowFrame>)} render={toRender(Tag)} className={cx('rcx-item__row', className)} />
);

export default withFuselageProvider(ItemRow);
