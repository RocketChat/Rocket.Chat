import { memo, useCallback } from 'preact/compat';

import { createClassName } from '../../../helpers/createClassName';
import { triggerAction, UIKitIncomingInteractionType, UIKitIncomingInteractionContainerType } from '../../../lib/uiKit';
import { renderMessageBlocks } from '../../uiKit';
import Surface from '../../uiKit/message/Surface';
import styles from './styles.scss';

type MessageBlocksProps = {
	blocks?: unknown[];
	mid?: string;
	rid?: string;
};

const MessageBlocks = ({ blocks = [], mid = undefined, rid = undefined }: MessageBlocksProps) => {
	const dispatchAction = useCallback(
		({ appId, actionId, payload }: { appId: string; actionId: string; payload: unknown }) =>
			triggerAction({
				appId,
				type: UIKitIncomingInteractionType.BLOCK,
				actionId,
				rid,
				mid,
				viewId: null,
				container: {
					type: UIKitIncomingInteractionContainerType.MESSAGE,
					id: mid,
				},
				payload,
			}),
		[mid, rid],
	);

	return (
		<Surface dispatchAction={dispatchAction}>
			{Array.isArray(blocks) && blocks.length > 0 ? (
				<div className={createClassName(styles, 'message-blocks')}>{renderMessageBlocks(blocks)}</div>
			) : null}
		</Surface>
	);
};

export default memo(MessageBlocks);
