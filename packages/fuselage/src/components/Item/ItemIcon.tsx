import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';
import { useEffect, useId } from 'react';

import { useItemContext } from './ItemContext';
import { cx } from '../../helpers/composeClassNames';

export type ItemIconProps = {
	is?: ElementType;
	/**
	 * Names what the icon conveys, such as "Private channel" or "Away".
	 * The label also describes the row's `ItemLink`, or the row itself when it is a menu item. Without it, the icon is decorative.
	 * A row names one labelled icon this way; give each further labelled icon its own `id`.
	 */
	label?: string;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'label'> &
	RefAttributes<HTMLElement>;

/**
 * A 20px slot for the room type icon or a user status, placed before the title.
 */
const ItemIcon = ({ is: Tag = 'div', label, id: propId, className, ...props }: ItemIconProps) => {
	const generatedId = useId();
	const { descriptionId, registerDescription } = useItemContext();
	const id = propId ?? (label ? descriptionId : undefined) ?? generatedId;

	useEffect(() => {
		if (!label || !propId) {
			return undefined;
		}

		return registerDescription(propId);
	}, [propId, label, registerDescription]);

	const a11yProps = label ? { 'role': 'img', 'aria-label': label } : { 'aria-hidden': true };

	return <Tag {...a11yProps} {...props} id={id} className={cx('rcx-item__icon', className)} />;
};

export default ItemIcon;
