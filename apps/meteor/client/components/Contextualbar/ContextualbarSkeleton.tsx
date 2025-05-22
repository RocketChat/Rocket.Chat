import { ContextualbarV2Skeleton, ContextualbarSkeleton as ContextualbarSkeletonComponent, Skeleton, Box } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';
import Contextualbar from './Contextualbar';
import ContextualbarHeader from './ContextualbarHeader';
import ContextualbarDialog from './ContextualbarDialog';

// const ContextualbarSkeleton = (props: ComponentProps<typeof ContextualbarSkeletonComponent>) => (
// 	<FeaturePreview feature='newNavigation'>
// 		<FeaturePreviewOff>
// 			<ContextualbarSkeletonComponent {...props} />
// 		</FeaturePreviewOff>
// 		<FeaturePreviewOn>
// 			<ContextualbarV2Skeleton {...props} />
// 		</FeaturePreviewOn>
// 	</FeaturePreview>
// );

const ContextualbarSkeleton = () => (
	<ContextualbarDialog>
		<Contextualbar>
			<ContextualbarHeader>
				<Skeleton width='100%' />
			</ContextualbarHeader>
			<Box p={24}>
				<Skeleton mbe={4} width='32px' height='32px' variant='rect' />
				{Array(5)
					.fill(5)
					.map((_, index) => (
					<Skeleton key={index} />
					))}
			</Box>
		</Contextualbar>
	</ContextualbarDialog>
);

export default memo(ContextualbarSkeleton);
