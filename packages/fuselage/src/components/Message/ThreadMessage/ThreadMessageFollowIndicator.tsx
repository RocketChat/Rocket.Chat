import { Icon } from '../../Icon';
import ItemActions from '../../Item/ItemActions';

export type ThreadMessageFollowIndicatorProps = {
	following?: boolean;
};

const ThreadMessageFollowIndicator = ({ following = false }: ThreadMessageFollowIndicatorProps) => (
	<ItemActions reveal='hover'>
		<Icon size='x16' name={following ? 'bell' : 'bell-off'} color='secondary-info' />
	</ItemActions>
);

export default ThreadMessageFollowIndicator;
