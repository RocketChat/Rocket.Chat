import { memo } from 'react';

import ThreadMessagePreviewFrame from './threadPreview/ThreadMessagePreviewFrame';
import type { ThreadMessagePreviewFrameProps } from './threadPreview/ThreadMessagePreviewFrame';
import { useGoToThread } from '../../../views/room/hooks/useGoToThread';

export type SequentialThreadMessagePreviewProps = Omit<ThreadMessagePreviewFrameProps, 'origin' | 'onOpen'>;

/** A thread reply preview that continues the group above it: the reply alone, opening the thread at itself */
const SequentialThreadMessagePreview = ({ message, ...props }: SequentialThreadMessagePreviewProps) => {
	const goToThread = useGoToThread();

	return (
		<ThreadMessagePreviewFrame
			message={message}
			onOpen={() => goToThread({ rid: message.rid, tmid: message.tmid, msg: message._id })}
			{...props}
		/>
	);
};

export default memo(SequentialThreadMessagePreview);
