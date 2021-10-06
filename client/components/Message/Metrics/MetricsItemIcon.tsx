import { Icon } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

type MetricsItemIconProps = { name: 'thread' | 'user' | 'clock' | 'discussion' };

const MetricsItemIcon: FC<MetricsItemIconProps> = (props) => <Icon size='x20' {...props} />;

export default MetricsItemIcon;
