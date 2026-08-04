import { TableBody } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type GenericTableBodyProps = ComponentPropsWithoutRef<typeof TableBody>;

export const GenericTableBody = (props: GenericTableBodyProps) => <TableBody {...props} />;
