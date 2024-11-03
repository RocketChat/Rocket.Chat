import type { ILogEntry } from '@rocket.chat/core-typings';
import { Box, Accordion } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

import AppLogsItemEntry from './AppLogsItemEntry';

type AppLogsItemProps = {
	entries: ILogEntry[];
	instanceId: string;
	title: string;
};

const AppLogsItem = ({ entries, instanceId, title, ...props }: AppLogsItemProps) => {
	const { t } = useTranslation();

	return (
		<Accordion.Item title={title} {...props}>
			{instanceId && (
				<Box color='default'>
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
