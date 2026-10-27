import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, ButtonGroup, Button, Throbber, Callout } from '@rocket.chat/fuselage';
import { useMergedRefs, useResizeObserver } from '@rocket.chat/fuselage-hooks';
import {
	VirtualizedScrollbars,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarFooter,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import { useSetting, useTranslation, useUser } from '@rocket.chat/ui-contexts';
import { Virtuoso } from 'react-virtuoso';

import OutlookEventItem from './OutlookEventItem';
import {
	getCalendarSyncIntervalHours,
	getCalendarSyncWindowDays,
	DEFAULT_INTERVAL_HOURS,
	DEFAULT_WINDOW_DAYS,
} from '../../../../ee/lib/exchange/calendarSyncSchedule';
import { useItemListNavigation } from '../../../hooks/useItemListNavigation';
import { getErrorMessage } from '../../../lib/errorHandling';
import { useOutlookAuthentication } from '../hooks/useOutlookAuthentication';
import { useMutationOutlookCalendarSync, useOutlookCalendarListForToday } from '../hooks/useOutlookCalendarList';
import { NotOnDesktopError } from '../lib/NotOnDesktopError';

export type OutlookEventsListProps = {
	onClose: () => void;
	changeRoute: () => void;
};

const OutlookEventsList = ({ onClose, changeRoute }: OutlookEventsListProps) => {
	const t = useTranslation();
	const user = useUser();
	const { authEnabled, isError, error } = useOutlookAuthentication();

	const isServerManaged = useSetting('Exchange_Mode', 'legacy') === 'server';
	const syncIntervalHours = getCalendarSyncIntervalHours(useSetting('Exchange_Calendar_Sync_Interval', DEFAULT_INTERVAL_HOURS));
	const syncWindowDays = getCalendarSyncWindowDays(useSetting('Exchange_Calendar_Sync_Window_Days', DEFAULT_WINDOW_DAYS));

	const hasOutlookMethods = isServerManaged || !(isError && error instanceof NotOnDesktopError);

	const syncOutlookCalendar = useMutationOutlookCalendarSync();

	const calendarListResult = useOutlookCalendarListForToday();

	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 1 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});
	const listNavigationRef = useItemListNavigation();
	const eventsListRef = useMergedRefs(ref, listNavigationRef);

	const calendarEvents = calendarListResult.data;
	const total = calendarEvents?.length || 0;

	const outlookUrl = user?.settings?.calendar?.outlook?.Outlook_Url;

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='calendar' />
				<ContextualbarTitle>{t('Outlook_calendar')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarContent flush>
				<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex' justifyContent='center' ref={eventsListRef}>
					{calendarListResult.isPending && <Throbber size='x12' />}
					{calendarListResult.isError && (
						<States>
							<StatesIcon name='circle-exclamation' variation='danger' />
							<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
							<StatesSubtitle>{getErrorMessage(calendarListResult.error)}</StatesSubtitle>
						</States>
					)}
					{calendarListResult.isSuccess && total === 0 && (
						<States>
							<StatesIcon name='calendar' />
							<StatesTitle>{t('No_events')}</StatesTitle>
						</States>
					)}
					{calendarListResult.isSuccess && calendarListResult.data.length > 0 && (
						<VirtualizedScrollbars>
							<Virtuoso
								style={{
									height: blockSize,
									width: inlineSize,
								}}
								totalCount={total}
								overscan={25}
								data={calendarEvents}
								itemContent={(_index, calendarData) => <OutlookEventItem {...calendarData} />}
							/>
						</VirtualizedScrollbars>
					)}
				</Box>
			</ContextualbarContent>
			<ContextualbarFooter>
				{isServerManaged ? (
					<>
						<Box marginBlockEnd='x8'>
							<Callout>
								{t('Outlook_calendar_sync_schedule', {
									interval: t('Outlook_calendar_sync_interval_hours', { count: syncIntervalHours }),
									window: t('Outlook_calendar_sync_window_days', { count: syncWindowDays }),
								})}
							</Callout>
						</Box>
						<ButtonGroup stretch>
							<Button onClick={changeRoute}>{t('Settings')}</Button>
							<Button icon='refresh' loading={syncOutlookCalendar.isPending} onClick={() => syncOutlookCalendar.mutate()}>
								{t('Sync')}
							</Button>
						</ButtonGroup>
					</>
				) : (
					<>
						<ButtonGroup stretch>
							{authEnabled && <Button onClick={changeRoute}>{t('Calendar_settings')}</Button>}
							{outlookUrl && (
								<Button icon='new-window' onClick={() => window.open(outlookUrl, '_blank')}>
									{t('Open_Outlook')}
								</Button>
							)}
						</ButtonGroup>
						{hasOutlookMethods && (
							<Box marginBlockStart={8}>
								<ButtonGroup stretch>
									<Button variant='primary' loading={syncOutlookCalendar.isPending} onClick={() => syncOutlookCalendar.mutate()}>
										{authEnabled ? t('Sync') : t('Log_in_to_sync')}
									</Button>
								</ButtonGroup>
							</Box>
						)}
					</>
				)}
			</ContextualbarFooter>
		</ContextualbarDialog>
	);
};

export default OutlookEventsList;
