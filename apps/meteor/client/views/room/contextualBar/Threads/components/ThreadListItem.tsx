import type { IThreadMainMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Palette } from '@rocket.chat/fuselage';
import { useSetting, useUserId } from '@rocket.chat/ui-contexts';
import type { MouseEvent, ReactElement } from 'react';
import { useCallback, memo } from 'react';

import ThreadListMessage from './ThreadListMessage';
import { useDecryptedMessage } from '../../../../../hooks/useDecryptedMessage';
import { normalizeThreadMessage } from '../../../../../lib/normalizeThreadMessage';

type ThreadListItemProps = {
	thread: IThreadMainMessage;
	unread: string[];
	unreadUser: string[];
	unreadGroup: string[];
	onClick: (tmid: IThreadMainMessage['_id']) => void;
};

const ThreadListItem = ({ thread, unread, unreadUser, unreadGroup, onClick }: ThreadListItemProps): ReactElement => {
	const uid = useUserId() ?? undefined;
	const decryptedMsg = useDecryptedMessage(thread);
	const msg = normalizeThreadMessage({ ...thread, msg: decryptedMsg });

	const { name = thread.u.username } = thread.u;

	const following = !!uid && (thread.replies?.includes(uid) ?? false);

	const showRealNames = (useSetting('UI_Use_Real_Name') as boolean | undefined) ?? false;

	const handleListItemClick = useCallback(
		(event: MouseEvent<HTMLElement>): void => {
			event.preventDefault();
			event.stopPropagation();
			onClick(thread._id);
		},
		[onClick, thread._id],
	);

	return (
		<ThreadListMessage
			className={css`
				cursor: pointer;
				&:hover,
				&:focus {
					background: ${Palette.surface['surface-hover']};
				}
				border-bottom: 1px solid ${Palette.stroke['stroke-extra-light']} !important;
			`}
			tabIndex={0}
			_id={thread._id}
			replies={thread.tcount ?? 0}
			tlm={thread.tlm}
			ts={thread.ts}
			participants={thread.replies}
			name={showRealNames ? name : thread.u.username}
			username={thread.u.username}
			unread={unread.includes(thread._id)}
			mention={unreadUser.includes(thread._id)}
			all={unreadGroup.includes(thread._id)}
			following={following}
			data-id={thread._id}
			msg={msg ?? ''}
			rid={thread.rid}
			onClick={handleListItemClick}
			emoji={thread?.emoji}
		/>
	);
};

export default memo(ThreadListItem);
