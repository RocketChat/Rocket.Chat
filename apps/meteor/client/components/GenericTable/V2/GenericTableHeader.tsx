import { TableHead } from '@rocket.chat/fuselage';
import type { FC, ComponentProps } from 'react';
import React from 'react';

import { GenericTableRow } from './GenericTableRow';

export const GenericTableHeader: FC<ComponentProps<typeof TableHead>> = ({ children, ...props }) => (
	<TableHead {...props}>
		<GenericTableRow>{children}</GenericTableRow>
	</TableHead>
);
