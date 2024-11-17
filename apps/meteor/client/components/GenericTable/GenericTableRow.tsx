import { TableRow } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import React from 'react';

type GenericTableRowProps = ComponentPropsWithoutRef<typeof TableRow>;

export const GenericTableRow = (props: GenericTableRowProps) => <TableRow {...props} />;
