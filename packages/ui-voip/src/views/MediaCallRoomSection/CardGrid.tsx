import styled from '@rocket.chat/styled';
import type { ReactNode } from 'react';

type CardGridProps = {
	children: ReactNode;
	columns: number;
	rows: number;
};

const CardGrid = styled('div', ({ columns: _columns, rows: _rows, ...props }: CardGridProps) => props)`
	display: grid;
	gap: 4px;
	justify-content: center;
	align-items: center;
`;

export default CardGrid;
