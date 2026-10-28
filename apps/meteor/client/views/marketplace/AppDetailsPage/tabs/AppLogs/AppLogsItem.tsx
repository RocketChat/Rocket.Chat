import type { ILogItem } from '@rocket.chat/core-typings';
import { useFormatDateAndTime } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import AppLogsItemEntry from './AppLogsItemEntry';
import { AppsLogItemField } from './layout/AppLogsItemField';
import AppLogsItemHeading from './layout/AppLogsItemHeading';
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
				{props.instanceId && <AppsLogItemField first field={props.instanceId} label='Instance' />}
				{props.totalTime !== undefined && <AppsLogItemField field={`${props.totalTime}ms`} label={t('Total_time')} />}
				{props.startTime && <AppsLogItemField field={formatDateAndTime(Date.parse(props.startTime))} label={t('Time')} />}
				{props.method && <AppsLogItemField field={props.method} label={t('Event')} />}
				<AppLogsItemHeading>{t('Full_log')}</AppLogsItemHeading>
				<AppLogsItemEntry fullLog={props} />
			</CollapsibleRegion>
			<CollapsibleDivider />
		</>
	);
};

export default AppLogsItem;
