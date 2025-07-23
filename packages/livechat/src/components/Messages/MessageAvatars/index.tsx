import type { CSSProperties } from 'preact/compat';
import { memo } from 'preact/compat';

import * as styles from './styles.scss';
import { createClassName } from '../../../helpers/createClassName';
import { Avatar } from '../../Avatar';

type MessageAvatarsProps = {
	avatarResolver: (username: string) => string | undefined;
	usernames: string[];
	className?: string;
	style?: CSSProperties;
};

export const MessageAvatars = memo(({ avatarResolver = () => undefined, usernames = [], className, style = {} }: MessageAvatarsProps) => {
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
