import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';
import { useEffect, useId } from 'react';

import { useItemContext } from './ItemContext';
import { cx } from '../../helpers/composeClassNames';

export type ItemTitleProps = {
	is?: ElementType;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * The main label of an `Item`. It truncates with an ellipsis.
 */
const ItemTitle = ({ is: Tag = 'div', id: propId, className, ...props }: ItemTitleProps) => {
	const generatedId = useId();
	const { titleId, registerTitle } = useItemContext();
	const id = propId ?? titleId ?? generatedId;

	useEffect(() => (propId ? registerTitle(propId) : undefined), [propId, registerTitle]);

	return <Tag {...props} id={id} className={cx('rcx-item__title', className)} />;
};

export default ItemTitle;
