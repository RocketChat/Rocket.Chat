import { TableRow } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

export const GenericTableRow: FC<ComponentProps<typeof TableRow>> = (props) => <TableRow {...props} />;
