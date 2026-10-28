import { AccordionItem, FieldGroup, Skeleton, Text } from '@rocket.chat/fuselage';

import SettingSkeleton from '../Setting/SettingSkeleton';

function SettingsSectionSkeleton() {
	return (
		<AccordionItem noncollapsible title={<Skeleton />}>
			<Text is='p' color='hint' fontScale='p2'>
				<Skeleton />
			</Text>

			<FieldGroup>
				{Array.from({ length: 10 }).map((_, i) => (
					<SettingSkeleton key={i} />
				))}
			</FieldGroup>
		</AccordionItem>
	);
}

export default SettingsSectionSkeleton;
