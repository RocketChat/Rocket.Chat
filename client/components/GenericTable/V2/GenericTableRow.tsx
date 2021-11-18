import { Table } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

export const GenericTableRow: FC<ComponentProps<typeof Table.Row>> = ({ children }) => (
	<Table.Row>{children}</Table.Row>
);
