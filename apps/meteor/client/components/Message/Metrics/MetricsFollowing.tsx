import { ActionButton } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

type MetricsFollowingProps = { name: 'bell' | 'bell-off' };

const MetricsFollowing: FC<MetricsFollowingProps> = ({ name }) => <ActionButton color='info' small ghost icon={name} />;

export default MetricsFollowing;
