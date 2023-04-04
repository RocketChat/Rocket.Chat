import { Box, Table } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React, { useCallback } from 'react';

import SortIcon from './SortIcon';

type HeaderCellProps = {
	active?: boolean;
	direction?: 'asc' | 'desc';
	sort?: string;
	clickable?: boolean;
	onClick?: (sort: string) => void;
} & Omit<ComponentProps<typeof Box>, 'onClick'>;

const HeaderCell: FC<HeaderCellProps> = ({ children, active, direction, sort, onClick, ...props }) => {
	const fn = useCallback(() => onClick && sort && onClick(sort), [sort, onClick]);
	return (
		<Table.Cell clickable={!!sort} onClick={fn} {...props}>
			<Box display='flex' alignItems='center' wrap='no-wrap'>
				{children}
				{sort && <SortIcon direction={active ? direction : undefined} />}
			</Box>
		</Table.Cell>
	);
};

export default HeaderCell;
