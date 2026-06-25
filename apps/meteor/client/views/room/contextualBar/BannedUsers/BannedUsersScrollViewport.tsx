import type { ReactNode } from 'react';

const scrollViewportStyle = {
	height: '100%',
	outline: 'none',
	overflowY: 'auto',
	position: 'relative',
	width: '100%',
} as const;

type BannedUsersScrollViewportProps = {
	children: ReactNode;
	scrollerRef?: (node: HTMLDivElement | null) => void;
	tabIndex?: number;
};

const BannedUsersScrollViewport = ({ children, scrollerRef, tabIndex }: BannedUsersScrollViewportProps) => (
	<div ref={scrollerRef} style={scrollViewportStyle} tabIndex={tabIndex}>
		{children}
	</div>
);

export default BannedUsersScrollViewport;
