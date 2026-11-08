import { Box } from '@rocket.chat/fuselage';
import type { ForwardedRef, HTMLAttributes } from 'react';
import { forwardRef } from 'react';

export type RoomListGroupWrapperProps = Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'is'>;

/**
 * Keeps every collapse group header an owned `listitem` of the sidebar list,
 * as ARIA only allows `listitem` children under `role='list'`, and keeps the
 * sticky header opaque over the rooms scrolling beneath it.
 */
const RoomListGroupWrapper = forwardRef(function RoomListGroupWrapper(props: RoomListGroupWrapperProps, ref: ForwardedRef<HTMLDivElement>) {
	return <Box role='listitem' backgroundColor='surface-sidebar' ref={ref} {...props} />;
});

export default RoomListGroupWrapper;
