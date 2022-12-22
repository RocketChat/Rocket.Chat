import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

import ContentItem from './ContentItem';

type MetricsProps = ComponentProps<typeof Box>;

const Metrics: FC<MetricsProps> = (props) => (
	<ContentItem>
		<Box display='flex' mi='neg-x4' {...props} />
	</ContentItem>
);

export default Metrics;
