// import { useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import styled from '@rocket.chat/styled';
import type { ReactNode } from 'react';
// import { useCallback, useState } from 'react';

type CardGridProps = {
	children: ReactNode;
	columns?: number;
	rows?: number;
	padding?: string;
	direction?: 'row' | 'column';
};

export const CardLayout = styled(
	'div',
	({ columns: _columns, rows: _rows, padding: _padding, direction: _direction, ...props }: CardGridProps) => props,
)`
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 1fr;
	grid-auto-rows: 3fr;
	grid-auto-columns: 3fr;
	grid-auto-flow: ${({ direction }) => direction || 'row'} dense;
	justify-items: center;
	align-items: center;
	width: 100%;
	height: 100%;
	overflow: hidden;
`;

export const CardGridSection = styled(
	'div',
	({ columns: _columns, rows: _rows, padding: _padding, direction: _direction, ...props }: CardGridProps) => props,
)`
	display: grid;
	grid-auto-flow: ${({ direction }) => direction || 'row'} dense;
	max-width: 100%;
	gap: 8px;
	padding: 8px;
	height: 100%;
	overflow: hidden;
`;

const CardGrid = styled(
	'div',
	({ columns: _columns, rows: _rows, padding: _padding, direction: _direction, ...props }: CardGridProps) => props,
)`
	display: grid;
	gap: 8px;
	width: 100%;
	height: 100%;
	overflow: hidden;
	grid-template:
		"aa ba ca"
		"ab bb cb"
		"ac bc cc"
	justify-items: center;
	align-items: center;
`;

/* 	grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
	grid-auto-rows: repeat(auto-fit, minmax(100px, 1fr)); */

// const MyCardGrid = ({ children }: { children: ReactNode }) => {
// 	const [[gridX, gridY], setGridSize] = useState([2, 2]);
// 	const ref = useSafeRefCallback(
// 		useCallback((node: HTMLElement) => {
// 			const observer = new ResizeObserver((entries) => {
// 				const entry = entries[0];
// 				if (entry) {
// 					setGridSize([Math.floor(entry.contentRect.width / 100), Math.floor(entry.contentRect.height / 100)]);
// 				}
// 			});
// 			observer.observe(node);
// 			return () => observer.disconnect();
// 		}, []),
// 	);
// 	return <CardGrid ref={ref}>{children}</CardGrid>;
// };

/* grid-template-columns: repeat(${({ columns }) => columns.toString()}, minmax(300px, 1fr));
	grid-template-rows: repeat(${({ rows }) => rows.toString()}, minmax(300px, 1fr)); */

export default CardGrid;
