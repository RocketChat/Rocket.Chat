import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

type MetricsItemLabelProps = ComponentProps<typeof Box>;

const MetricsItemLabel: FC<MetricsItemLabelProps> = (props) => <Box mis='x4' {...props} />;

export default MetricsItemLabel;
