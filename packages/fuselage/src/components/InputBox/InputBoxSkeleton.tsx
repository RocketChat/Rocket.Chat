import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { Skeleton } from '../Skeleton';

export type InputBoxSkeletonProps = ElementProps<HTMLDivElement>;

const InputBoxSkeleton = (props: InputBoxSkeletonProps) => (
	<Box rcx-skeleton__input {...props}>
		<Skeleton width='100%' />
	</Box>
);

export default InputBoxSkeleton;
