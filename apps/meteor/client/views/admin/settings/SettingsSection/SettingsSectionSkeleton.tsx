import { AccordionItem, Box, FieldGroup, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import SettingSkeleton from '../Setting/SettingSkeleton';

function SettingsSectionSkeleton(): ReactElement {
	return (
		<AccordionItem noncollapsible title={<Skeleton />}>
			<Box is='p' color='hint' fontScale='p2'>
				<Skeleton />
			</Box>

			<FieldGroup>
				{Array.from({ length: 10 }).map((_, i) => (
					<SettingSkeleton key={i} />
				))}
			</FieldGroup>
		</AccordionItem>
	);
}

export default SettingsSectionSkeleton;
