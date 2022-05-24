import { IconButton } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

type MetricsFollowingProps = { name: 'bell' | 'bell-off' };

const MetricsFollowing: FC<MetricsFollowingProps> = ({ name }) => <IconButton color='info' small icon={name} />;

export default MetricsFollowing;
