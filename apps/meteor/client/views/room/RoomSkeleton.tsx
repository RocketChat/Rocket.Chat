import type { ReactElement } from 'react';
import React from 'react';

import MessageListSkeleton from '../../components/message/list/MessageListSkeleton';
import HeaderSkeleton from './Header/HeaderSkeleton';
import ComposerSkeleton from './footer/RoomFooterSkeleton';
import RoomLayout from './layout/RoomLayout';

const RoomSkeleton = (): ReactElement => (
	<RoomLayout header={<HeaderSkeleton />} body={<MessageListSkeleton />} footer={<ComposerSkeleton />} />
);
export default RoomSkeleton;
