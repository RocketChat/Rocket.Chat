import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';
import { useEffect, useId } from 'react';

import { useItemGroupContext } from './ItemGroupContext';
import { cx } from '../../helpers/composeClassNames';

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
const ItemGroupTitle = ({ is: Component = 'div', id: propId, className, type, ...props }: ItemGroupTitleProps) => {
	const generatedId = useId();
	const id = propId ?? generatedId;
	const { registerTitle } = useItemGroupContext();

	useEffect(() => registerTitle(id), [id, registerTitle]);

	return (
		<Component
			{...props}
			type={Component === 'button' ? (type ?? 'button') : type}
			id={id}
			className={cx('rcx-item-group-title', className)}
		/>
	);
};

export default ItemGroupTitle;
