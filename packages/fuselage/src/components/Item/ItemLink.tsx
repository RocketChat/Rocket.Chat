import type { AnchorHTMLAttributes, ButtonHTMLAttributes, RefAttributes } from 'react';

import { useItemContext } from './ItemContext';
import { cx } from '../../helpers/composeClassNames';

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
 * The primary target of an `Item`. It covers the whole row, so actions sit beside it instead of inside it,
 * and clicks on the row's other non-interactive content, such as an avatar, activate it too.
 */
const ItemLink = (props: ItemLinkProps) => {
	const { descriptionIds } = useItemContext();

	const ariaDescribedBy = [props['aria-describedby'], ...descriptionIds].filter(Boolean).join(' ') || undefined;

	if (props.is === 'button') {
		const { is: _is, className, type = 'button', ...rest } = props;

		return <button {...rest} type={type} aria-describedby={ariaDescribedBy} className={cx('rcx-item__link', className)} />;
	}

	const { is: _is, className, children, ...rest } = props;

	return (
		<a {...rest} aria-describedby={ariaDescribedBy} className={cx('rcx-item__link', className)}>
			{children}
		</a>
	);
};

export default ItemLink;
