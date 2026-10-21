import { styled, Text, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';
import { useContext } from 'react';

import { ItemHighlightContext } from './ItemContext';
import { highlightVariant, itemColorFontSecondary, toRender, textStyle } from './itemStyles';
import { cx, cxx } from '../../helpers/composeClassNames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export const ItemMetaFrame = styled(Text, {
	display: 'block',
	flexGrow: 0,
	flexShrink: 0,
	flexBasis: 'auto',
	whiteSpace: 'nowrap',
	wordWrap: 'inherit',
	color: itemColorFontSecondary,
	...textStyle('c1'),

	variants: {
		truncate: {
			true: {
				overflow: 'hidden',
				flexShrink: 1,
				minWidth: 0,
				textOverflow: 'ellipsis',
			},
		},
		highlight: highlightVariant,
	} as const,
});

export type ItemMetaProps = {
	is?: ElementType;
	/**
	 * Lets longer trailing text, such as a command description, shrink and end in an ellipsis.
	 */
	truncate?: boolean;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * Short trailing text, such as a timestamp, count or file size. It never truncates unless `truncate` is set.
 */
const ItemMeta = ({ is: Tag = 'div', truncate, className, ...props }: ItemMetaProps) => {
	const highlight = useContext(ItemHighlightContext);

	return (
		<ItemMetaFrame
			{...(props as GetProps<typeof ItemMetaFrame>)}
			render={toRender(Tag)}
			truncate={!!truncate}
			highlight={highlight}
			className={cx(cxx('rcx-item__meta')({ truncate: !!truncate }), className)}
		/>
	);
};

export default withFuselageProvider(ItemMeta);
