import { TableHead } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

import { GenericTableRow } from './GenericTableRow';

type GenericTableHeaderProps = ComponentPropsWithoutRef<typeof TableHead>;

export const GenericTableHeader = ({ children, ...props }: GenericTableHeaderProps) => (
	<TableHead {...props}>
		<GenericTableRow>{children}</GenericTableRow>
	</TableHead>
);
