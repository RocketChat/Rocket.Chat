import type { ILogEntry } from '@rocket.chat/core-typings';
import { Box, AccordionItem } from '@rocket.chat/fuselage';
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
		<AccordionItem title={title} {...props}>
			{instanceId && (
				<Box color='default'>
					{t('Instance')}: {instanceId}
				</Box>
			)}
			{entries.map(({ severity, timestamp, caller, args }, i) => (
				<AppLogsItemEntry key={i} severity={severity} timestamp={timestamp} caller={caller} args={args} />
			))}
		</AccordionItem>
	);
};

export default AppLogsItem;
