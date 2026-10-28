import { styled, Text, View } from '@tamagui/web';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ElementType, RefAttributes } from 'react';
import { useEffect, useId } from 'react';

import { useItemContext } from './ItemContext';
import { overlayStyle } from './itemStyles';
import { cx } from '../../helpers/composeClassNames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const ItemLinkFrame = styled(Text, {
	display: 'block',
	overflow: 'hidden',
	width: '100%',
	margin: 0,
	padding: 0,
	cursor: 'pointer',
	textAlign: 'start',
	whiteSpace: 'nowrap',
	wordWrap: 'inherit',
	textDecorationLine: 'none',
	textOverflow: 'ellipsis',
	color: 'inherit',
	borderWidth: 0,
	outlineWidth: 0,
	outlineStyle: 'none',
	backgroundColor: 'transparent',
	backgroundImage: 'none',
	fontFamily: 'inherit',
	fontSize: 'inherit',
	fontWeight: 'inherit',
	fontStyle: 'inherit',
	lineHeight: 'inherit',
	letterSpacing: 'inherit',
	fontVariantNumeric: 'inherit',
});

const ItemLinkOverlay = styled(View, overlayStyle);

type ItemLinkAnchorProps = {
	is?: 'a';
	href: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> &
	RefAttributes<HTMLAnchorElement>;

type ItemLinkButtonProps = {
	is: 'button';
} & ButtonHTMLAttributes<HTMLButtonElement> &
	RefAttributes<HTMLButtonElement>;

export type ItemLinkProps = ItemLinkAnchorProps | ItemLinkButtonProps;

/**
 * The primary target of an `Item`. It covers the whole row, so actions sit beside it instead of inside it.
 */
const ItemLink = (props: ItemLinkProps) => {
	const id = useId();
	const { descriptionIds, registerLink } = useItemContext();

	useEffect(() => registerLink(id), [id, registerLink]);

	const ariaDescribedBy = [props['aria-describedby'], ...descriptionIds].filter(Boolean).join(' ') || undefined;

	const { is: Tag = 'a', className, children, ...rest } = props;
	const Element = Tag as ElementType;
	const type = Tag === 'button' ? ((rest as ButtonHTMLAttributes<HTMLButtonElement>).type ?? 'button') : undefined;

	return (
		<ItemLinkFrame
			render={<Element {...rest} {...(type && { type })} />}
			aria-describedby={ariaDescribedBy}
			className={cx('rcx-item__link', className)}
		>
			{children}
			<ItemLinkOverlay aria-hidden className='rcx-item__link-overlay' />
		</ItemLinkFrame>
	);
};

export default withFuselageProvider(ItemLink);
