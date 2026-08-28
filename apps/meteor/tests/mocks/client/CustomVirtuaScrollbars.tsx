import type { HTMLAttributes, ReactNode } from 'react';
import { forwardRef, isValidElement } from 'react';

export const MockCustomVirtuaScrollbars = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function MockCustomVirtuaScrollbars(
	{ children, ...props },
	ref,
) {
	const content = isValidElement<{ children?: ReactNode }>(children) && children.type === 'div' ? children.props.children : children;

	return (
		<div ref={ref} {...props}>
			{content}
		</div>
	);
});
