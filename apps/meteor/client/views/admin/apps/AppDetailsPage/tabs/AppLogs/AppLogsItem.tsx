import { Box, Accordion } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import AppLogsItemEntry from './AppLogsItemEntry';

type AppLogsItemProps = {
	entries: {
		severity: string;
		timestamp: string;
		caller: string;
		args: unknown;
	}[];
	instanceId: string;
	title: string;
};

const AppLogsItem: FC<AppLogsItemProps> = ({ entries, instanceId, title, ...props }) => {
	const t = useTranslation();

	return (
		<Accordion.Item title={title} {...props}>
			{instanceId && (
				<Box>
					{t('Instance')}: {instanceId}
				</Box>
			)}
			{entries.map(({ severity, timestamp, caller, args }, i) => (
				<AppLogsItemEntry key={i} severity={severity} timestamp={timestamp} caller={caller} args={args} />
			))}
		</Accordion.Item>
	);
};

export default AppLogsItem;
