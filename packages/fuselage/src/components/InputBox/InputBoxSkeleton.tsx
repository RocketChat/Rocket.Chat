import { Box, type BoxProps } from '../Box';
import { Skeleton } from '../Skeleton';

export type InputBoxSkeletonProps = BoxProps;

const InputBoxSkeleton = (props: InputBoxSkeletonProps) => (
	<Box rcx-skeleton__input {...props}>
		<Skeleton width='100%' />
	</Box>
);

export default InputBoxSkeleton;
