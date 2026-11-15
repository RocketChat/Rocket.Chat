import { TableCell } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type GenericTableCellProps = ComponentPropsWithoutRef<typeof TableCell>;

export const GenericTableCell = (props: GenericTableCellProps) => <TableCell {...props} />;
