import { Box, Skeleton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { HoverCard, HoverCardSection } from '../HoverCard';

const UserCardSkeleton = () => {
	const { t } = useTranslation();

	return (
		<HoverCard aria-label={t('User_card')}>
			<HoverCardSection>
				<Box display='flex' alignItems='center'>
					<Skeleton width='x36' height='x36' variant='rect' />
					<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} marginInlineStart='x4'>
						<Skeleton width='50%' />
						<Skeleton width='75%' />
					</Box>
				</Box>
				<Box display='flex' flexDirection='column' marginBlockStart='x16'>
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} width='100%' />
					))}
				</Box>
				<Box display='grid' gap='x8' marginBlockStart='x24' style={{ gridTemplateColumns: '1fr 1fr auto' }}>
					<Skeleton variant='rect' height='x32' />
					<Skeleton variant='rect' height='x32' />
					<Skeleton variant='rect' height='x32' width='x32' />
				</Box>
			</HoverCardSection>
		</HoverCard>
	);
};

export default UserCardSkeleton;
