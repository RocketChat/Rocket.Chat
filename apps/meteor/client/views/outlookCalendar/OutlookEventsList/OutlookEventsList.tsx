import type { IGroupVideoConference } from '@rocket.chat/core-typings';
import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import { useResizeObserver, useSessionStorage } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';
import VerticalBar from '../../../components/VerticalBar';
import { getErrorMessage } from '../../../lib/errorHandling';
import { syncOutlookEvents } from '../../../lib/outlookCalendar/syncOutlookEvents';
import type { CalendarAuthPayload } from '../../calendarIntegration/CalendarAuthModal';
import CalendarAuthModal from '../../calendarIntegration/CalendarAuthModal';
import OutlookEventItem from './OutlookEventItem';

type OutlookEventsListProps = {
	onClose: () => void;
	onChangeRoute: () => void;
	total: number;
	videoConfs: IGroupVideoConference[];
	loading: boolean;
	error?: Error;
	reload: () => void;
	loadMoreItems: (min: number, max: number) => void;
};

const OUTLOOK_HOST_URL = 'https://rocketchat-pexip-exchange.eastus.cloudapp.azure.com/EWS/Exchange.asmx';

const OutlookEventsList = ({
	onClose,
	onChangeRoute,
	// total = calendarEvents.length,
	error,
	loadMoreItems,
}: OutlookEventsListProps): ReactElement => {
	const t = useTranslation();
	const setModal = useSetModal();
	const [isSyncing, setIsSyncing] = useState(false);
	const dispatchToastMessage = useToastMessageDispatch();
	const [outlookCredential, setOutlookCredential] = useSessionStorage('outlookCredential', {
		email: undefined,
		password: undefined,
	});

	const today = new Date('2023-03-15').toISOString();
	const calendarData = useEndpoint('GET', '/v1/calendar-events.list');
	const { data, isLoading, refetch } = useQuery(['calendar'], async () => calendarData({ date: today }));

	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 1 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});

	const calendarEvents = data?.data;
	const total = calendarEvents?.length || 0;

	console.log('outlookCredential', outlookCredential);
	console.log(data);

	const handleSync = () => {
		const fetchCalendarData = async ({ email, password, rememberCredentials }: CalendarAuthPayload) => {
			try {
				await syncOutlookEvents(new Date(), OUTLOOK_HOST_URL, email, password);

				if (rememberCredentials) {
					setOutlookCredential({ email, password });
				}
				dispatchToastMessage({ type: 'success', message: 'Sync Success' });
				refetch();
			} catch (error) {
				console.log('deu error', error);
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
				setIsSyncing(false);
			}
		};

		if (outlookCredential.email && outlookCredential.password) {
			setIsSyncing(true);
			return fetchCalendarData({ email: outlookCredential.email, password: outlookCredential.password });
		}

		setModal(<CalendarAuthModal onCancel={() => setModal(null)} onConfirm={fetchCalendarData} />);
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

			<VerticalBar.Content paddingInline={0} ref={ref} color='default'>
				{(total === 0 || error) && (
					<Box display='flex' flexDirection='column' justifyContent='center' height='100%'>
						{error && (
							<States>
								<StatesIcon name='circle-exclamation' variation='danger' />
								<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
								<StatesSubtitle>{getErrorMessage(error)}</StatesSubtitle>
							</States>
						)}
						{!error && total === 0 && (
							<States>
								<StatesIcon name='calendar' />
								<StatesTitle>{t('No_history')}</StatesTitle>
								{/* <StatesSubtitle>{t('There_is_no_video_conference_history_in_this_room')}</StatesSubtitle> */}
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
							// endReached={(start): unknown => loadMoreItems(start, Math.min(50, total - start))}
							overscan={25}
							data={calendarEvents}
							components={{ Scroller: ScrollableContentWrapper as any }}
							itemContent={(_index, calendarData): ReactElement => (
								<OutlookEventItem
									calendarData={calendarData}
									// reload={reload}
								/>
							)}
						/>
					</Box>
				)}
			</VerticalBar.Content>
			<VerticalBar.Footer>
				<ButtonGroup mbe='x8' stretch>
					<Button onClick={onChangeRoute}>{t('Calendar_settings')}</Button>
					<Button onClick={() => window.open(OUTLOOK_HOST_URL, '_blank')}>
						<Icon mie='x4' name='new-window' />
						<Box is='span'>{t('Open_Outlook')}</Box>
					</Button>
				</ButtonGroup>
				<ButtonGroup stretch>
					<Button disabled={isSyncing} onClick={handleSync}>
						{isSyncing ? t('Sync_in_progress') : t('Sync')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

export default OutlookEventsList;
