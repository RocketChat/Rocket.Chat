import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

type MetricsItemProps = ComponentProps<typeof Box>;

const MetricsItem: FC<MetricsItemProps> = (props) => (
	<Box display='flex' justifyContent='center' alignItems='center' fontScale='micro' color='info' mi='x4' {...props} />
);

export default MetricsItem;
