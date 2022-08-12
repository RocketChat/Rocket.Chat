import { Accordion, Box, FieldGroup, Skeleton } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import Setting from './Setting';

function SectionSkeleton(): ReactElement {
	return (
		<Accordion.Item noncollapsible title={<Skeleton />}>
			<Box is='p' color='hint' fontScale='p2'>
				<Skeleton />
			</Box>

			<FieldGroup>
				{Array.from({ length: 10 }).map((_, i) => (
					<Setting.Skeleton key={i} />
				))}
			</FieldGroup>
		</Accordion.Item>
	);
}

export default SectionSkeleton;
