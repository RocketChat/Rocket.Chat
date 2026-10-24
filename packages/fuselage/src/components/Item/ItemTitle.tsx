import { styled, Text, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';
import { useContext, useEffect, useId } from 'react';

import { ItemHighlightContext, useItemContext } from './ItemContext';
import { highlightVariant, toRender, truncatedTextStyle } from './itemStyles';
import { cx } from '../../helpers/composeClassNames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export const ItemTitleFrame = styled(Text, {
	...truncatedTextStyle,
	display: 'block',

	variants: {
		highlight: highlightVariant,
	} as const,
});

export type ItemTitleProps = {
	is?: ElementType;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * The main label of an `Item`. It truncates with an ellipsis.
 */
const ItemTitle = ({ is: Tag = 'div', id: propId, className, ...props }: ItemTitleProps) => {
	const generatedId = useId();
	const id = propId ?? generatedId;
	const { registerTitle } = useItemContext();
	const highlight = useContext(ItemHighlightContext);

	useEffect(() => registerTitle(id), [id, registerTitle]);

	return (
		<ItemTitleFrame
			{...(props as GetProps<typeof ItemTitleFrame>)}
			render={toRender(Tag)}
			highlight={highlight}
			id={id}
			className={cx('rcx-item__title', className)}
		/>
	);
};

export default withFuselageProvider(ItemTitle);
