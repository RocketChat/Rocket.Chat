import { Icon } from '../../Icon/index.js';
import ItemActions from '../../Item/ItemActions.js';

const ThreadMessageUnfollow = () => (
	<ItemActions reveal='hover'>
		<Icon size='x16' name='bell-off' color='secondary-info' />
	</ItemActions>
);

export default ThreadMessageUnfollow;
