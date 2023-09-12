import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import { useAnalyticsObject } from './hooks/useAnalyticsObject';

const AnalyticsReports = () => {
	const analytics = useAnalyticsObject();

	return (
		<Box display='flex' flexDirection='column' padding={8} flexGrow={1} color='default' bg='neutral' borderRadius='x4' overflow='scroll'>
			<pre>{JSON.stringify(analytics, null, '\t')}</pre>
		</Box>
	);
};

export default AnalyticsReports;
