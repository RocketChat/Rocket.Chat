import type { ForwardedRef, HTMLAttributes } from 'react';
import { forwardRef } from 'react';

export type RoomListGroupWrapperProps = HTMLAttributes<HTMLDivElement>;

/**
 * Keeps every collapse group header an owned `listitem` of the sidebar list,
 * as ARIA only allows `listitem` children under `role='list'`.
 */
const RoomListGroupWrapper = forwardRef(function RoomListGroupWrapper(props: RoomListGroupWrapperProps, ref: ForwardedRef<HTMLDivElement>) {
	return <div role='listitem' ref={ref} {...props} />;
});

export default RoomListGroupWrapper;
