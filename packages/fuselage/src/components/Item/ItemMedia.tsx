import { styled, Text } from '@tamagui/web';
import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { centeredSlotStyle } from './itemStyles';
import { cx, cxx } from '../../helpers/composeClassNames';
import { size } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export const ItemMediaFrame = styled(Text, {
	...centeredSlotStyle,

	variants: {
		variant: {
			default: {},
			icon: {
				width: size('x20'),
				height: size('x20'),
			},
		},
	} as const,
});

export type ItemMediaProps = {
	is?: ElementType;
	/**
	 * `icon` centers its child in a 20px box, for icons and status bullets.
	 */
	variant?: 'default' | 'icon';
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * The leading avatar, icon or thumbnail of an `Item`. Its box fits its child, so the child's size sets the row height.
 */
const ItemMedia = ({ is: Tag = 'div', variant = 'default', className, children, ...props }: ItemMediaProps) => (
	<ItemMediaFrame
		render={<Tag {...props} />}
		variant={variant}
		className={cx(cxx('rcx-item__media')({ icon: variant === 'icon' }), className)}
	>
		{children}
	</ItemMediaFrame>
);

export default withFuselageProvider(ItemMedia);
