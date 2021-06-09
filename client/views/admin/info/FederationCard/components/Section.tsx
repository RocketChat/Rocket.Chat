import { Box } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import Card from '../../../../../components/Card';
import getIcon from './SectionStatusIcon';

export enum SectionStatus {
	UNKNOWN,
	SUCCESS,
	FAILED,
}

const Section: FC<{
	status: SectionStatus;
	title: string;
	subtitle: string;
}> = ({ status, title, subtitle, children }) => (
	<Card.Col.Section display='flex' alignItems='flex-start'>
		<Box position='relative' style={{ width: 20 }}>
			{getIcon(status)}
		</Box>
		<Box flexDirection='column'>
			<Card.Col.Title>{title}</Card.Col.Title>
			<Box style={{ marginTop: 3 }}>{subtitle}</Box>
			{children}
		</Box>
	</Card.Col.Section>
);

export default memo(Section);
