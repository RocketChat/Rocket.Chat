import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';
import { useEffect, useId } from 'react';

import { useItemContext } from './ItemContext';
import { cx, cxx } from '../../helpers/composeClassNames';

export type ItemTitleProps = {
	is?: ElementType;
	/**
	 * Set to `false` to wrap long text instead of ending it in an ellipsis.
	 */
	truncate?: boolean;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * The main label of an `Item`. It truncates with an ellipsis.
 */
const ItemTitle = ({ is: Tag = 'div', id: propId, truncate = true, className, ...props }: ItemTitleProps) => {
	const generatedId = useId();
	const id = propId ?? generatedId;
	const { registerTitle } = useItemContext();

	useEffect(() => registerTitle(id), [id, registerTitle]);

	return <Tag {...props} id={id} className={cx(cxx('rcx-item__title')({ wrap: !truncate }), className)} />;
};

export default ItemTitle;
