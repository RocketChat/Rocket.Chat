import { Table, TableBody } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { memo } from 'react';

import DescriptionListFrame from './layout/DescriptionListFrame';

export type DescriptionListProps = {
	children: ReactNode;
	title?: string;
};

const DescriptionList = ({ children, title }: DescriptionListProps) => (
	<DescriptionListFrame title={title}>
		<Table striped>
			<TableBody>{children}</TableBody>
		</Table>
	</DescriptionListFrame>
);

export default memo(DescriptionList);
