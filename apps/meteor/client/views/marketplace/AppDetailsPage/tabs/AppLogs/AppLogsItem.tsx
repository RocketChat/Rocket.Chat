import type { ILogEntry } from '@rocket.chat/core-typings';
import { Box, AccordionItem } from '@rocket.chat/fuselage';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import AppLogsItemEntry from './AppLogsItemEntry';

export type AppLogsItemProps = {
	entries: ILogEntry[];
	instanceId: string;
};

const AppLogsItem = ({ entries, instanceId, ...props }: AppLogsItemProps) => {
	const { t } = useTranslation();
	const title = (
		<>
			{entries.map(({ severity, timestamp, caller, args }) => {
				const style: CSSProperties = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

				const parsedArgs = args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ');
				return <Box style={style} key={`${severity}-${timestamp}-${caller}`}>{`${timestamp} ${severity} ${caller} ${parsedArgs}`}</Box>;
			})}
		</>
	);

	return (
		<AccordionItem title={title} {...props}>
			{instanceId && (
				<Box display='flex' color='default'>
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
