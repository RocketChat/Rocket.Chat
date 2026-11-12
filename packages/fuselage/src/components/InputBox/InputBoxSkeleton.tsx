import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';
import { Skeleton } from '../Skeleton/index.js';

export type InputBoxSkeletonProps = ElementProps<HTMLDivElement>;

const InputBoxSkeleton = (props: InputBoxSkeletonProps) => (
	<Box rcx-skeleton__input {...props}>
		<Skeleton width='100%' />
	</Box>
);

export default InputBoxSkeleton;
