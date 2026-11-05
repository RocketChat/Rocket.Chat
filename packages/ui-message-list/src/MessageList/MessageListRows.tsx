import type { IMessage } from '@rocket.chat/core-typings';
import { useImperativeHandle } from 'react';
import type { VirtualizerHandle } from 'virtua';

import type { MessageListVirtualizerProps } from './MessageListVirtualizer';

const inertHandle: VirtualizerHandle = {
	cache: {} as VirtualizerHandle['cache'],
	scrollOffset: 0,
	scrollSize: 0,
	viewportSize: 0,
	findItemIndex: () => 0,
	getItemOffset: () => 0,
	getItemSize: () => 0,
	scrollToIndex: () => undefined,
	scrollTo: () => undefined,
	scrollBy: () => undefined,
};

/**
 * Renders every row, unvirtualized: the stand-in for `MessageListVirtualizer` in specs, where nothing can be measured.
 */
const MessageListRows = <TMessage extends IMessage>({ ref, rows, children }: MessageListVirtualizerProps<TMessage>) => {
	useImperativeHandle(ref, () => inertHandle, []);

	return (
		<div>
			{rows.map((row, index) => (
				<div key={row.key}>{children(row, index)}</div>
			))}
		</div>
	);
};

export default MessageListRows;
