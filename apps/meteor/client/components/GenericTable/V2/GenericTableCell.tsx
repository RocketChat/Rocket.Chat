import { Table } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

export const GenericTableCell: FC<ComponentProps<typeof Table.Cell>> = (props) => <Table.Cell {...props} />;
