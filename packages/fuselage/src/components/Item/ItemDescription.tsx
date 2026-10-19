import { styled, Text, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { itemColorFontSecondary, toRender, truncatedTextStyle, textStyle } from './itemStyles';
import { cx, cxx } from '../../helpers/composeClassNames';
import { spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

// The narrow-list layout of `inline` stays in SCSS, as a container query.
const ItemDescriptionFrame = styled(Text, {
	...truncatedTextStyle,
	display: 'block',
	color: itemColorFontSecondary,
	...textStyle('c1'),

	variants: {
		span: {
			true: { display: 'inline' },
		},
		inline: {
			true: {
				display: 'inline',
				marginInlineStart: spacing('x4'),
			},
		},
	} as const,
});

export type ItemDescriptionProps = {
	is?: ElementType;
	/**
	 * Places the description right after the title, as with a username after a name.
	 * In narrow lists it moves to its own line.
	 */
	inline?: boolean;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * The secondary line of an `Item`, such as a last message preview or a username.
 */
const ItemDescription = ({ is, inline, className, ...props }: ItemDescriptionProps) => {
	const Tag = is ?? (inline ? 'span' : 'div');

	return (
		<ItemDescriptionFrame
			{...(props as GetProps<typeof ItemDescriptionFrame>)}
			render={toRender(Tag)}
			span={Tag === 'span'}
			inline={!!inline}
			className={cx(cxx('rcx-item__description')({ inline: !!inline }), className)}
		/>
	);
};

export default withFuselageProvider(ItemDescription);
