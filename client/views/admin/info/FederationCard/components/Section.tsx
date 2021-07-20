import { Box } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import Card from '../../../../../components/Card';
import getStatusIcon from './SectionStatusIcon';

export enum SectionStatus {
	UNKNOWN,
	SUCCESS,
	FAILED,
}

const Section: FC<{
	status: SectionStatus;
	title: string;
	subtitle?: string;
	children?: React.ReactNode;
}> = ({ status, title, subtitle, children }) => (
	<Card.Col.Section display='flex' alignItems='flex-start'>
		{getStatusIcon(status)}
		<Box flexDirection='column'>
			<Card.Col.Title>{title}</Card.Col.Title>
			{subtitle && <Box style={{ marginTop: 3 }}>{subtitle}</Box>}
			{children}
		</Box>
	</Card.Col.Section>
);

export default memo(Section);
