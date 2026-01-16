import styled from '@rocket.chat/styled';
import type { ReactNode } from 'react';

type CardItemProps = {
	children: ReactNode;
	rowSpan?: number;
	columnSpan?: number;
	columns?: [start: number, end: number];
	rows?: [start: number, end: number];
	// columns: number;
	// rows: number;
};

const CardItem = styled(
	'div',
	({ rowSpan: _rowSpan, columnSpan: _columnSpan, columns: _columns, rows: _rows, ...props }: CardItemProps) => props,
)`
	background-color: blue;
	width: 100%;
	height: 100%;
	overflow: hidden;

	${({ columns }) => (columns ? `grid-row: ${columns[0]} / ${columns[1]}` : '')};
	${({ rows }) => (rows ? `grid-column: ${rows[0]} / ${rows[1]}` : '')};
	${({ columnSpan }) => (columnSpan ? `grid-column-end: span ${columnSpan}` : '')};
`;

export default CardItem;
