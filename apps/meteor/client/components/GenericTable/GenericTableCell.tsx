import { TableCell } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import React from 'react';

type GenericTableCellProps = ComponentPropsWithoutRef<typeof TableCell>;

export const GenericTableCell = (props: GenericTableCellProps) => <TableCell {...props} />;
