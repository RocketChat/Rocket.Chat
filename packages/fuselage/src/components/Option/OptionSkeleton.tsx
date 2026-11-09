import Option from './Option.js';
import { Skeleton } from '../Skeleton/index.js';

const OptionSkeleton = () => (
	<Option aria-hidden>
		<Skeleton width='100%' />
	</Option>
);

export default OptionSkeleton;
