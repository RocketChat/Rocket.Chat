import { TableCell } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

export const GenericTableCell: FC<ComponentProps<typeof TableCell>> = (props) => <TableCell {...props} />;
