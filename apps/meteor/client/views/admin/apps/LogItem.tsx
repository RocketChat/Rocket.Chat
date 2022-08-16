import { Box, Accordion } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import LogEntry from './LogEntry';

type LogItemProps = {
	entries: {
		severity: string;
		timestamp: string;
		caller: string;
		args: unknown;
	}[];
	instanceId: string;
	title: string;
};

const LogItem: FC<LogItemProps> = ({ entries, instanceId, title, ...props }) => {
	const t = useTranslation();

	return (
		<Accordion.Item title={title} {...props}>
			{instanceId && (
				<Box>
					{t('Instance')}: {instanceId}
				</Box>
			)}
			{entries.map(({ severity, timestamp, caller, args }, i) => (
				<LogEntry key={i} severity={severity} timestamp={timestamp} caller={caller} args={args} />
			))}
		</Accordion.Item>
	);
};

export default LogItem;
