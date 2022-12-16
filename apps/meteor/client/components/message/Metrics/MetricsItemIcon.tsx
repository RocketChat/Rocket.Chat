import { Icon } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

type MetricsItemIconProps = { name: 'thread' | 'user' | 'clock' | 'discussion' | 'bell' };

const MetricsItemIcon: FC<MetricsItemIconProps> = (props) => <Icon size='x20' {...props} />;

export default MetricsItemIcon;
