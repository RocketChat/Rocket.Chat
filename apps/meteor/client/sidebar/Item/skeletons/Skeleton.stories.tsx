import React from 'react';

import ExtendedSkeleton from '../ExtendedSkeleton';
import CondensedSkeleton from './CondensedSkeleton';
import MediumSkeleton from './MediumSkeleton';

export default {
	title: 'Sidebar/Skeleton',
};

export const CondensedWithAvatar = () => <CondensedSkeleton showAvatar={true} />;
export const CondensedWithoutAvatar = () => <CondensedSkeleton showAvatar={false} />;

export const MediumWithAvatar = () => <MediumSkeleton showAvatar={true} />;
export const MediumWithoutAvatar = () => <MediumSkeleton showAvatar={false} />;

export const ExtendedWithAvatar = () => <ExtendedSkeleton showAvatar={true} />;
export const ExtendedWithoutAvatar = () => <ExtendedSkeleton showAvatar={false} />;
