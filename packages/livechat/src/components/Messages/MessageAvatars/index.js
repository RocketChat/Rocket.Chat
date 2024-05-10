import { memo } from 'preact/compat';

import { createClassName } from '../../../helpers/createClassName';
import { Avatar } from '../../Avatar';
import styles from './styles.scss';

export const MessageAvatars = memo(({ avatarResolver = () => null, usernames = [], className, style = {} }) => {
	const avatars = usernames.filter(Boolean);

	if (!avatars.length) {
		return null;
	}

	return (
		<div className={createClassName(styles, 'message-avatars', {}, [className])} style={style}>
			{avatars.map((username) => (
				<Avatar src={avatarResolver(username)} description={username} className={createClassName(styles, 'message-avatars__avatar')} />
			))}
		</div>
	);
});
