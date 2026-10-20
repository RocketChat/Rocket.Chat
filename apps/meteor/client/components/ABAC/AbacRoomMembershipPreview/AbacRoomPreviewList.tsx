import type { ForwardedRef, HTMLAttributes } from 'react';
import { forwardRef } from 'react';

import type { AbacRoomPreviewLoadMoreContext } from './AbacRoomPreviewLoadMore';

export type AbacRoomPreviewListContext = AbacRoomPreviewLoadMoreContext & { label: string };

const AbacRoomPreviewList = forwardRef(function AbacRoomPreviewList(
	{ context, ...props }: HTMLAttributes<HTMLDivElement> & { context?: AbacRoomPreviewListContext },
	ref: ForwardedRef<HTMLDivElement>,
) {
	return <div role='list' aria-label={context?.label} ref={ref} {...props} />;
});

export default AbacRoomPreviewList;
