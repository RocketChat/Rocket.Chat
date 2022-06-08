import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

type MetricsItemLabelProps = ComponentProps<typeof Box>;

const MetricsItemLabel: FC<MetricsItemLabelProps> = (props) => <Box mis='x4' {...props} />;

export default MetricsItemLabel;
