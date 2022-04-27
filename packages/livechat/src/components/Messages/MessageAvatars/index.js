import { Avatar } from '../../Avatar';
import { createClassName, memo } from '../../helpers';
import styles from './styles.scss';

export const MessageAvatars = memo(({
	avatarResolver = () => null,
	usernames = [],
	className,
	style = {},
}) => (
	<div
		className={createClassName(styles, 'message-avatars', {}, [className])}
		style={style}
	>
		{usernames.map((username) => (
			<Avatar
				src={avatarResolver(username)}
				description={username}
				className={createClassName(styles, 'message-avatars__avatar')}
			/>
		))}
	</div>
));
