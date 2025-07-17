import type { ILogItem } from '@rocket.chat/core-typings';
import { Box, Divider } from '@rocket.chat/fuselage';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AppLogsItemEntry from './AppLogsItemEntry';
import { AppsLogItemField } from './AppLogsItemField';
import { CollapseButton } from './Components/CollapseButton';
import { CollapsibleRegion } from './Components/CollapsibleRegion';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';

export type AppLogsItemProps = {
	regionId: string;
} & ILogItem;

const AppLogsItem = ({ regionId, ...props }: AppLogsItemProps) => {
	const { t } = useTranslation();
	const [expanded, setExpanded] = useState(false);
	const title = (
		<>
			{props.entries.map(({ severity, timestamp, caller, args }, index) => {
				const parsedArgs = args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ');
				return (
					<Box
						lineHeight={20}
						mbe={4}
						fontFamily='mono'
						key={`${index}-${severity}-${timestamp}-${caller}`}
					>{`${timestamp} ${severity} ${caller} ${parsedArgs}`}</Box>
				);
			})}
		</>
	);

	const handleClick = () => {
		setExpanded(!expanded);
	};

	const anchorRef = useRef<HTMLDivElement>(null);

	const formatDateAndTime = useFormatDateAndTime();

	return (
		<>
			<CollapseButton regionId={regionId} expanded={expanded} onClick={handleClick}>
				<Box ref={anchorRef}>{title}</Box>
			</CollapseButton>

			<CollapsibleRegion expanded={expanded} id={regionId} pbs={expanded ? 16 : '0px'} mis={36}>
				{props.instanceId && <AppsLogItemField mbs={0} field={props.instanceId} label='Instance' />}
				{props.totalTime !== undefined && <AppsLogItemField field={`${props.totalTime}ms`} label={t('Total_time')} />}
				{props.startTime && <AppsLogItemField field={formatDateAndTime(Date.parse(props.startTime))} label={t('Time')} />}
				{props.method && <AppsLogItemField field={props.method} label={t('Event')} />}
				<Box mbs={16} display='flex' color='default' flexDirection='column'>
					<Box fontWeight={700}>{t('Full_log')}</Box>
				</Box>
				<AppLogsItemEntry fullLog={props} />
			</CollapsibleRegion>
			<Box is='dt'>
				<Divider mb={0} />
			</Box>
		</>
	);
};

export default AppLogsItem;
