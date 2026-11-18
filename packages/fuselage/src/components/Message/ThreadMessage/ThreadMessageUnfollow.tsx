import { Icon } from '../../Icon';
import ItemActions from '../../Item/ItemActions';

/**
 * A muted bell at the end of the row quoting the thread's first message, shown while the thread message is hovered or
 * holds focus.
 */
const ThreadMessageUnfollow = () => (
	<ItemActions reveal='hover'>
		<Icon size='x16' name='bell-off' color='secondary-info' />
	</ItemActions>
);

export default ThreadMessageUnfollow;
