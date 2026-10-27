import { Skeleton } from '../Skeleton';
import Option from './Option';

const OptionSkeleton = () => (
	<Option aria-hidden>
		<Skeleton width='100%' />
	</Option>
);

export default OptionSkeleton;
