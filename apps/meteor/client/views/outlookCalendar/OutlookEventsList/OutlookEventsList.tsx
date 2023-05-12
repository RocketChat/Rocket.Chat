import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useEndpoint, useToastMessageDispatch, useSetting } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';
import VerticalBar from '../../../components/VerticalBar';
import { useSyncOutlookEvents } from '../../../hooks/useSyncOutlookCalendar';
import { getErrorMessage } from '../../../lib/errorHandling';
import { useOutlookAuthentication } from '../useOutlookAuthentication';
import OutlookEventItem from './OutlookEventItem';

type OutlookEventsListProps = {
	onClose: () => void;
	onChangeRoute: () => void;
};

const OutlookEventsList = ({ onClose, onChangeRoute }: OutlookEventsListProps): ReactElement => {
	const t = useTranslation();
	const [isSyncing, setIsSyncing] = useState(false);
	const dispatchToastMessage = useToastMessageDispatch();
	const outlookUrl = useSetting('Outlook_Calendar_Outlook_Url') as string;
	const { authEnabled, canSync } = useOutlookAuthentication({ onChangeRoute });

	const syncOutlookEvents = useSyncOutlookEvents();

	const today = new Date().toISOString();
	const calendarData = useEndpoint('GET', '/v1/calendar-events.list');
	const { data, isLoading, isError, error, refetch } = useQuery(['calendar'], async () => calendarData({ date: today }), {
		refetchOnWindowFocus: false,
	});

	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 1 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});

	const calendarEvents = data?.data;
	const total = calendarEvents?.length || 0;

	const handleSync = () => {
		const fetchCalendarData = async () => {
			try {
				setIsSyncing(true);
				await syncOutlookEvents();

				dispatchToastMessage({ type: 'success', message: t('Outlook_Sync_Success') });
				refetch();
			} catch (error: any) {
				if (error && typeof error === 'object' && error.message === 'abort') {
					return;
				}
				dispatchToastMessage({ type: 'error', message: t('Outlook_Sync_Failed') });
			} finally {
				setIsSyncing(false);
			}
		};

		fetchCalendarData();
	};

	if (isLoading) {
		return <VerticalBar.Skeleton />;
	}

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='calendar' />
				<VerticalBar.Text>{t('Outlook_calendar')}</VerticalBar.Text>
				<VerticalBar.Close onClick={onClose} />
			</VerticalBar.Header>

			{canSync && !authEnabled && total === 0 && (
				<>
					<VerticalBar.Content paddingInline={0} ref={ref} color='default'>
						<Box display='flex' flexDirection='column' justifyContent='center' height='100%'>
							<States>
								<StatesIcon name='user' />
								<StatesTitle>{t('Log_in_to_sync')}</StatesTitle>
							</States>
						</Box>
					</VerticalBar.Content>
					<VerticalBar.Footer>
						<ButtonGroup mbs='x8' stretch>
							<Button primary disabled={isSyncing} onClick={handleSync}>
								{isSyncing ? t('Please_wait') : t('Login')}
							</Button>
						</ButtonGroup>
					</VerticalBar.Footer>
				</>
			)}

			{(authEnabled || (!authEnabled && total > 0)) && (
				<>
					<VerticalBar.Content paddingInline={0} ref={ref} color='default'>
						{(total === 0 || isError) && (
							<Box display='flex' flexDirection='column' justifyContent='center' height='100%'>
								{isError && (
									<States>
										<StatesIcon name='circle-exclamation' variation='danger' />
										<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
										<StatesSubtitle>{getErrorMessage(error)}</StatesSubtitle>
									</States>
								)}
								{!isError && total === 0 && (
									<States>
										<StatesIcon name='calendar' />
										<StatesTitle>{t('No_history')}</StatesTitle>
									</States>
								)}
							</Box>
						)}
						{calendarEvents && calendarEvents.length > 0 && (
							<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
								<Virtuoso
									style={{
										height: blockSize,
										width: inlineSize,
									}}
									totalCount={total}
									overscan={25}
									data={calendarEvents}
									components={{ Scroller: ScrollableContentWrapper }}
									itemContent={(_index, calendarData): ReactElement => <OutlookEventItem {...calendarData} />}
								/>
							</Box>
						)}
					</VerticalBar.Content>
					<VerticalBar.Footer>
						<ButtonGroup stretch>
							<Button onClick={onChangeRoute}>{t('Calendar_settings')}</Button>
							{outlookUrl && (
								<Button onClick={() => window.open(outlookUrl, '_blank')}>
									<Icon mie='x4' name='new-window' />
									<Box is='span'>{t('Open_Outlook')}</Box>
								</Button>
							)}
						</ButtonGroup>
						{canSync && (
							<ButtonGroup mbs='x8' stretch>
								<Button primary disabled={isSyncing} onClick={handleSync}>
									{isSyncing ? t('Sync_in_progress') : t('Sync')}
								</Button>
							</ButtonGroup>
						)}
					</VerticalBar.Footer>
				</>
			)}
		</>
	);
};

export default OutlookEventsList;
