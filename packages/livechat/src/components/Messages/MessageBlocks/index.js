import { memo, useCallback } from 'preact/compat';

import { triggerAction, UIKitIncomingInteractionType, UIKitIncomingInteractionContainerType } from '../../../lib/uiKit';
import { createClassName } from '../../helpers';
import { renderMessageBlocks } from '../../uiKit';
import Surface from '../../uiKit/message/Surface';
import styles from './styles.scss';

const MessageBlocks = ({ blocks = [], mid, rid }) => {
	const dispatchAction = useCallback(
		({ appId, actionId, payload }) =>
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
