import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { createContext, forwardRef, useContext } from 'react';

const listResetStyle = {
	margin: 0,
	padding: 0,
	listStyle: 'none',
} as const;

/**
 * Names the list, since virtua renders the container itself and passes it no props of the caller.
 */
export const VirtuaListLabelContext = createContext<string | undefined>(undefined);

export type VirtuaListContainerProps = {
	children: ReactNode;
	style: CSSProperties;
} & Omit<HTMLAttributes<HTMLUListElement>, 'children' | 'style'>;

export const VirtuaListContainer = forwardRef<HTMLUListElement, VirtuaListContainerProps>(function VirtuaListContainer(
	{ children, style, ...props },
	ref,
) {
	// WebKit drops the list semantics of a `ul` without list styles unless the role is explicit
	const listProps = { 'role': 'list', 'aria-label': useContext(VirtuaListLabelContext) };

	return (
		<ul {...listProps} {...props} ref={ref} style={{ ...listResetStyle, ...style }}>
			{children}
		</ul>
	);
});
