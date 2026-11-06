import ThreadMessageIcon from './ThreadMessageIcon';
import ItemActions from '../../Item/ItemActions';

const ThreadMessageUnfollow = () => (
	<ItemActions reveal='hover'>
		<ThreadMessageIcon className='rcx-message-thread__icon--unfollow' name='bell-off' />
	</ItemActions>
);

export default ThreadMessageUnfollow;
