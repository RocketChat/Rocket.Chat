import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';

export type ItemDescriptionProps = {
	is?: ElementType;
	/**
	 * Places the description right after the title, as with a username after a name.
	 * In narrow lists it moves to its own line.
	 */
	inline?: boolean;
	/**
	 * Wraps the description up to this many lines before cutting it with an ellipsis, as for a message preview.
	 * Without it, the description stays on one line.
	 */
	clamp?: 2 | 3;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * The secondary line of an `Item`, such as a last message preview or a username.
 */
const ItemDescription = ({ is, inline, clamp, className, ...props }: ItemDescriptionProps) => {
	const Tag = is ?? (inline ? 'span' : 'div');

	return (
		<Tag
			{...props}
			className={cx(
				cxx('rcx-item__description')({
					inline: !!inline,
					clamp: !!clamp,
					[`clamp-${clamp}`]: !!clamp,
				}),
				className,
			)}
		/>
	);
};

export default ItemDescription;
