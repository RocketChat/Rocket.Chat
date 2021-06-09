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
	link?: string | boolean;
}> = ({ status, title, subtitle, link = '' }) => (
	<Card.Col.Section display='flex' alignItems='flex-start'>
		<Box position='relative' style={{ width: 20 }}>
			{getIcon(status)}
		</Box>
		<Box flexDirection='column'>
			<Card.Col.Title>{title}</Card.Col.Title>
			<Box style={{ marginTop: 3 }}>{subtitle}</Box>
			{link && (
				<Box style={{ marginTop: 1 }}>
					<a href='#'>{link}</a>
				</Box>
			)}
		</Box>
	</Card.Col.Section>
);

export default memo(Section);
