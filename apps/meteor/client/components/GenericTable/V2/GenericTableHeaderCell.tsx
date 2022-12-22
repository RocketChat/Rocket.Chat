import { Box, Table } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import React, { useCallback } from 'react';

import SortIcon from '../SortIcon';

type GenericTableHeaderCellProps<T extends string> = Omit<ComponentProps<typeof Box>, 'onClick'> & {
	active?: boolean;
	direction?: 'asc' | 'desc';
	sort?: T;
	onClick?: (sort: T) => void;
};

export const GenericTableHeaderCell = <T extends string = string>({
	children,
	active,
	direction,
	sort,
	onClick,
	...props
}: GenericTableHeaderCellProps<T>): ReactElement => {
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
