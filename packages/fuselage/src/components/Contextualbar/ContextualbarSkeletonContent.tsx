import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { Skeleton } from '../Skeleton';

export type ContextualbarSkeletonContentProps = ElementProps<HTMLElement>;

/**
 * The placeholder a panel shows in place of its content while it loads, under a header that is already there.
 */
function ContextualbarSkeletonContent(props: ContextualbarSkeletonContentProps) {
	return (
		<Box rcx-vertical-bar__skeleton {...props}>
			<Skeleton width='32px' height='32px' variant='rect' />
			<Box>
				{Array(5)
					.fill(5)
					.map((_, index) => (
						<Skeleton key={index} />
					))}
			</Box>
		</Box>
	);
}

export default ContextualbarSkeletonContent;
