import type { CSSProperties, HTMLAttributes, ReactNode, RefAttributes } from 'react';

const listResetStyle = {
	margin: 0,
	padding: 0,
	listStyle: 'none',
} as const;

export type VirtuaListContainerProps = {
	children: ReactNode;
	style: CSSProperties;
} & Omit<HTMLAttributes<HTMLUListElement>, 'children' | 'style'> &
	RefAttributes<HTMLUListElement>;

export const VirtuaListContainer = ({ children, style, ref, ...props }: VirtuaListContainerProps) => (
	<ul {...props} ref={ref} style={{ ...listResetStyle, ...style }}>
		{children}
	</ul>
);
