import type { ILogItem } from '@rocket.chat/core-typings';
import { Stack, Text } from '@rocket.chat/fuselage';
import { useFormatDateAndTime } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import AppLogsItemEntry from './AppLogsItemEntry';
import { CollapseButton } from './layout/CollapseButton';
import CollapsibleDivider from './layout/CollapsibleDivider';
import { CollapsibleRegion } from './layout/CollapsibleRegion';
import LogLine from './layout/LogLine';

export type AppLogsItemProps = {
	regionId: string;
	expanded: boolean;
	onExpand: ({ id }: { id: string; expanded: boolean }) => void;
} & ILogItem;

const AppLogsItem = ({ regionId, expanded, onExpand, ...props }: AppLogsItemProps) => {
	const { t } = useTranslation();
	const title = (
		<>
			{props.entries.map(({ severity, timestamp, caller, args }, index) => {
				const parsedArgs = args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ');
				return <LogLine key={`${index}-${severity}-${timestamp}-${caller}`}>{`${timestamp} ${severity} ${caller} ${parsedArgs}`}</LogLine>;
			})}
		</>
	);

	const handleClick = () => {
		onExpand({ id: regionId, expanded: !expanded });
	};

	const formatDateAndTime = useFormatDateAndTime();

	return (
		<>
			<CollapseButton regionId={regionId} expanded={expanded} onClick={handleClick}>
				{title}
			</CollapseButton>

			<CollapsibleRegion expanded={expanded} id={regionId} paddingBlockStart={expanded ? 'x16' : '0px'} marginInlineStart='x32'>
				<Stack gap='x16'>
					{props.instanceId && (
						<Stack>
							<Text is='strong'>{t('Instance')}</Text>
							{props.instanceId}
						</Stack>
					)}
					{props.totalTime !== undefined && (
						<Stack>
							<Text is='strong'>{t('Total_time')}</Text>
							{`${props.totalTime}ms`}
						</Stack>
					)}
					{props.startTime && (
						<Stack>
							<Text is='strong'>{t('Time')}</Text>
							{formatDateAndTime(Date.parse(props.startTime))}
						</Stack>
					)}
					{props.method && (
						<Stack>
							<Text is='strong'>{t('Event')}</Text>
							{props.method}
						</Stack>
					)}
					<Stack>
						<Text is='strong'>{t('Full_log')}</Text>
						<AppLogsItemEntry fullLog={props} />
					</Stack>
				</Stack>
			</CollapsibleRegion>
			<CollapsibleDivider />
		</>
	);
};

export default AppLogsItem;
