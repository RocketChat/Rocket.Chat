import { styled, Text } from '@tamagui/web';
import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { ItemGroupHeaderContext, ItemHighlightContext, ItemParentContext, type ItemParent } from './ItemContext';
import { itemColorFontSecondary, itemColorSurfaceHover, itemRowStyle, textStyle } from './itemStyles';
import type { ItemInset } from './types';
import { useIdRegistry } from './useIdRegistry';
import { surfaceColors } from '../../Theme';
import { cx, cxx } from '../../helpers/composeClassNames';
import { toCSSValue } from '../../helpers/toCSSValue';
import { size, spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const ItemGroupHeaderFrame = styled(Text, {
	...itemRowStyle,
	minHeight: size('x28'),
	color: itemColorFontSecondary,
	...textStyle('c2'),
	gap: spacing('x4'),

	variants: {
		sticky: {
			true: {
				position: 'sticky',
				zIndex: 2,
				top: 0,
				backgroundColor: { default: toCSSValue('--rcx-item-group-header-color-surface', surfaceColors['surface-light']) },
			},
		},
		// A button title makes the whole header a target
		interactive: {
			true: { backgroundColor: { hover: itemColorSurfaceHover } },
		},
	} as const,
});

const headerParent: ItemParent = { kind: 'header', gap: 'x4' };

export type ItemGroupHeaderProps = {
	/**
	 * The element to render. Inside an `ItemGroup` rendered as `ul`, pass `li` with `aria-hidden`:
	 * the title still names the list, and the list reports only its rows.
	 * A header with interactive content, such as a collapse button, goes outside the list.
	 */
	is?: ElementType;
	/**
	 * Aligns the header with the rows below it. Use the same value as their `Item`.
	 */
	inset?: ItemInset;
	/**
	 * Pins the header to the top of its scroll container.
	 */
	sticky?: boolean;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * The label row of a group, such as Favorites, Recent or Moderators. It holds an `ItemGroupTitle` and optional trailing content.
 */
const ItemGroupHeader = ({ is: Tag = 'div', inset = 'none', sticky, className, children, ...props }: ItemGroupHeaderProps) => {
	const [buttonTitleIds, registerButtonTitle] = useIdRegistry();

	return (
		<ItemGroupHeaderContext.Provider value={registerButtonTitle}>
			<ItemParentContext.Provider value={headerParent}>
				<ItemHighlightContext.Provider value={undefined}>
					<ItemGroupHeaderFrame
						render={<Tag {...props} />}
						sticky={!!sticky}
						interactive={buttonTitleIds.length > 0}
						className={cx(
							cxx('rcx-item-group-header')({
								[`inset-${inset}`]: inset !== 'none',
								sticky: !!sticky,
							}),
							className,
						)}
					>
						{children}
					</ItemGroupHeaderFrame>
				</ItemHighlightContext.Provider>
			</ItemParentContext.Provider>
		</ItemGroupHeaderContext.Provider>
	);
};

export default withFuselageProvider(ItemGroupHeader);
