import { memo } from 'preact/compat';

import { createClassName } from '../../../helpers/createClassName';
import { Avatar } from '../../Avatar';
import styles from './styles.scss';

type MessageAvatarsProps = {
	avatarResolver?: (username: string) => string;
	usernames: string[];
	className?: string;
	style?: React.CSSProperties;
};

export const MessageAvatars = memo(({ avatarResolver, usernames = [], className, style = {} }: MessageAvatarsProps) => {
	const avatars = usernames.filter(Boolean);

	if (!avatars.length || !avatarResolver) {
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
