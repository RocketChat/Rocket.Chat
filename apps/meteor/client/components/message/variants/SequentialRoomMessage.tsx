import { memo } from 'react';

import StatusIndicators from '../StatusIndicators';
import RoomMessageFrame from './room/RoomMessageFrame';
import type { RoomMessageFrameProps } from './room/RoomMessageFrame';

export type SequentialRoomMessageProps = Omit<RoomMessageFrameProps, 'leading' | 'header'>;

/** A room message that continues the group above it: no avatar nor header, its status indicators on the left */
const SequentialRoomMessage = ({ message, ...props }: SequentialRoomMessageProps) => (
	<RoomMessageFrame message={message} leading={<StatusIndicators message={message} />} {...props} />
);

export default memo(SequentialRoomMessage);
