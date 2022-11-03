import { Table } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

export const GenericTableCell: FC<ComponentProps<typeof Table.Cell>> = (props) => <Table.Cell {...props} />;
