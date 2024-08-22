import { TableBody } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import React from 'react';

type GenericTableBodyProps = ComponentPropsWithoutRef<typeof TableBody>;

export const GenericTableBody = (props: GenericTableBodyProps) => <TableBody {...props} />;
