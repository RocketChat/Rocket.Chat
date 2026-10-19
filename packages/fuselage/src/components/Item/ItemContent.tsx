import { styled, Text, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { toRender } from './itemStyles';
import { cx } from '../../helpers/composeClassNames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const ItemContentFrame = styled(Text, {
	display: 'flex',
	flexDirection: 'column',
	flexGrow: 1,
	flexShrink: 1,
	flexBasis: 'auto',
	minWidth: 0,
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
});

export type ItemContentProps = {
	is?: ElementType;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * The flexible, truncating column that holds the title and description, or one `ItemRow` per line.
 */
const ItemContent = ({ is: Tag = 'div', className, ...props }: ItemContentProps) => (
	<ItemContentFrame
		{...(props as GetProps<typeof ItemContentFrame>)}
		render={toRender(Tag)}
		className={cx('rcx-item__content', className)}
	/>
);

export default withFuselageProvider(ItemContent);
