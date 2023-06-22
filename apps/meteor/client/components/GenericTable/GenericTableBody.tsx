import { TableBody } from '@rocket.chat/fuselage';
import type { FC, ComponentProps } from 'react';
import React from 'react';

export const GenericTableBody: FC<ComponentProps<typeof TableBody>> = (props) => <TableBody {...props} />;
