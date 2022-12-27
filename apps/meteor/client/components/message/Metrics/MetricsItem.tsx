import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

type MetricsItemProps = ComponentProps<typeof Box>;

const MetricsItem: FC<MetricsItemProps> = (props) => (
	<Box display='flex' justifyContent='center' alignItems='center' fontScale='micro' color='hint' mi='x4' {...props} />
);

export default MetricsItem;
