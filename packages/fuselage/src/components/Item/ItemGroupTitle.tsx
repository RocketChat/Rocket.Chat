import { styled, Text, View, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';
import { useContext, useEffect, useId } from 'react';

import { ItemGroupHeaderContext } from './ItemContext';
import { useItemGroupContext } from './ItemGroupContext';
import { overlayStyle, toRender } from './itemStyles';
import { cx } from '../../helpers/composeClassNames';
import { spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const ItemGroupTitleFrame = styled(Text, {
	display: 'block',
	overflow: 'hidden',
	flexGrow: 1,
	flexShrink: 1,
	flexBasis: 'auto',
	minWidth: 0,
	margin: 0,
	whiteSpace: 'nowrap',
	wordWrap: 'inherit',
	textOverflow: 'ellipsis',
	color: 'inherit',
	fontFamily: 'inherit',
	fontSize: 'inherit',
	fontWeight: 'inherit',
	fontStyle: 'inherit',
	lineHeight: 'inherit',
	letterSpacing: 'inherit',
	fontVariantNumeric: 'inherit',

	variants: {
		button: {
			true: {
				display: 'flex',
				flexDirection: 'row',
				alignItems: 'center',
				padding: 0,
				cursor: 'pointer',
				textAlign: 'start',
				borderWidth: 0,
				outlineWidth: 0,
				outlineStyle: 'none',
				backgroundColor: 'transparent',
				backgroundImage: 'none',
				gap: spacing('x4'),
			},
		},
	} as const,
});

const ItemGroupTitleOverlay = styled(View, overlayStyle);

export type ItemGroupTitleProps = {
	/**
	 * The element to render. Use a heading level, or `button` when the owner makes the group collapsible.
	 */
	is?: ElementType;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * The text of an `ItemGroupHeader`. Inside an `ItemGroup`, it becomes the group's accessible name.
 */
const ItemGroupTitle = ({ is: Tag = 'div', id: propId, className, type, children, ...props }: ItemGroupTitleProps) => {
	const generatedId = useId();
	const id = propId ?? generatedId;
	const { registerTitle } = useItemGroupContext();
	const registerButtonTitle = useContext(ItemGroupHeaderContext);
	const isButton = Tag === 'button';

	useEffect(() => registerTitle(id), [id, registerTitle]);

	useEffect(() => (isButton ? registerButtonTitle(id) : undefined), [id, isButton, registerButtonTitle]);

	return (
		<ItemGroupTitleFrame
			{...(props as GetProps<typeof ItemGroupTitleFrame>)}
			{...((isButton || type) && ({ type: isButton ? (type ?? 'button') : type } as GetProps<typeof ItemGroupTitleFrame>))}
			render={toRender(Tag)}
			button={isButton}
			id={id}
			className={cx('rcx-item-group-title', className)}
		>
			{children}
			{isButton && <ItemGroupTitleOverlay aria-hidden className='rcx-item-group-title__overlay' />}
		</ItemGroupTitleFrame>
	);
};

export default withFuselageProvider(ItemGroupTitle);
