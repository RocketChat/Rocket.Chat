import { styled, Text, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';
import { useContext, useEffect, useId } from 'react';

import { ItemHighlightContext, useItemContext } from './ItemContext';
import { centeredSlotStyle, highlightVariant, toRender } from './itemStyles';
import { cx } from '../../helpers/composeClassNames';
import { size } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const ItemIconFrame = styled(Text, {
	...centeredSlotStyle,
	width: size('x20'),
	height: size('x20'),

	variants: {
		highlight: highlightVariant,
	} as const,
});

export type ItemIconProps = {
	is?: ElementType;
	/**
	 * Names what the icon conveys, such as "Private channel" or "Away".
	 * The label also describes the row's `ItemLink`, or the row itself when it is a menu item. Without it, the icon is decorative.
	 */
	label?: string;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'label'> &
	RefAttributes<HTMLElement>;

/**
 * A 20px slot for the room type icon or a user status, placed before the title.
 */
const ItemIcon = ({ is: Tag = 'div', label, id: propId, className, ...props }: ItemIconProps) => {
	const generatedId = useId();
	const id = propId ?? generatedId;
	const { registerDescription } = useItemContext();
	const highlight = useContext(ItemHighlightContext);

	useEffect(() => {
		if (!label) {
			return undefined;
		}

		return registerDescription(id);
	}, [id, label, registerDescription]);

	const a11yProps = label ? { 'role': 'img', 'aria-label': label } : { 'aria-hidden': true };

	return (
		<ItemIconFrame
			{...(a11yProps as GetProps<typeof ItemIconFrame>)}
			{...(props as GetProps<typeof ItemIconFrame>)}
			render={toRender(Tag)}
			highlight={highlight}
			id={id}
			className={cx('rcx-item__icon', className)}
		/>
	);
};

export default withFuselageProvider(ItemIcon);
