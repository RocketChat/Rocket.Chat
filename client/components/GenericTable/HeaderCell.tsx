import { Box, Table } from '@rocket.chat/fuselage';
import React, { FC, useCallback } from 'react';

import SortIcon from './SortIcon';

type HeaderCellProps = {
	active?: boolean;
	direction?: 'asc' | 'desc';
	sort?: string;
	onClick?: (sort: string) => void;
};

const HeaderCell: FC<HeaderCellProps> = ({
	children,
	active,
	direction,
	sort,
	onClick,
	...props
}) => {
	const fn = useCallback(() => onClick && sort && onClick(sort), [sort, onClick]);
	return <Table.Cell clickable={!!sort} onClick={fn} { ...props }>
		<Box display='flex' alignItems='center' wrap='no-wrap'>
			{children}
			{sort && <SortIcon direction={active ? direction : undefined} />}
		</Box>
	</Table.Cell>;
};

export default HeaderCell;
