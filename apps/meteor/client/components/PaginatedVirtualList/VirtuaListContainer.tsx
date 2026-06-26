import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { createContext, forwardRef, useContext } from 'react';

const listResetStyle = {
	margin: 0,
	padding: 0,
	listStyle: 'none',
} as const;

export type VirtuaListContainerProps = {
	children: ReactNode;
	style: CSSProperties;
} & Omit<HTMLAttributes<HTMLUListElement>, 'children' | 'style'>;

export const VirtuaListLabelContext = createContext<string | undefined>(undefined);

export const VirtuaListContainer = forwardRef<HTMLUListElement, VirtuaListContainerProps>(function VirtuaListContainer(
	{ children, style, 'aria-label': ariaLabel, ...props },
	ref,
) {
	const listLabel = useContext(VirtuaListLabelContext);

	return (
		<ul {...props} ref={ref} aria-label={ariaLabel ?? listLabel} style={{ ...listResetStyle, ...style }}>
			{children}
		</ul>
	);
});
