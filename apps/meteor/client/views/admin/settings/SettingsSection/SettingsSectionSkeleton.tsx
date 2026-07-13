import { Box, FieldGroup, Skeleton } from '@rocket.chat/fuselage';

import SettingSkeleton from '../Setting/SettingSkeleton';

function SettingsSectionSkeleton() {
	return (
		<Box is='section' mbe={24}>
			<Box mbe={12} width='x160'>
				<Skeleton />
			</Box>
			<Box p={24} borderWidth='default' borderColor='light' borderRadius='x8' backgroundColor='surface-light'>
				<FieldGroup>
					{Array.from({ length: 10 }).map((_, i) => (
						<SettingSkeleton key={i} />
					))}
				</FieldGroup>
			</Box>
		</Box>
	);
}

export default SettingsSectionSkeleton;
