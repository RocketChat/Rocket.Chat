import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

const listResetStyle = {
	margin: 0,
	padding: 0,
	listStyle: 'none',
} as const;

export type VirtuaListContainerProps = {
	children: ReactNode;
	style: CSSProperties;
} & Omit<HTMLAttributes<HTMLUListElement>, 'children' | 'style'>;

export const VirtuaListContainer = forwardRef<HTMLUListElement, VirtuaListContainerProps>(function VirtuaListContainer(
	{ children, style, ...props },
	ref,
) {
	return (
		<ul {...props} ref={ref} style={{ ...listResetStyle, ...style }}>
			{children}
		</ul>
	);
});
