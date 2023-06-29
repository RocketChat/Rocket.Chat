import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useEndpoint, useToastMessageDispatch, useSetting } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarFooter,
	ContextualbarSkeleton,
} from '../../../components/Contextualbar';
import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';
import { getErrorMessage } from '../../../lib/errorHandling';
import { useOutlookAuthentication } from '../hooks/useOutlookAuthentication';
import { syncOutlookEvents } from '../lib/syncOutlookEvents';
import OutlookEventItem from './OutlookEventItem';

type OutlookEventsListProps = {
	onClose: () => void;
	onChangeRoute: () => void;
};

const OutlookEventsList = ({ onClose, onChangeRoute }: OutlookEventsListProps): ReactElement => {
	const t = useTranslation();
	const [isSyncing, setIsSyncing] = useState(false);
	const dispatchToastMessage = useToastMessageDispatch();
	const outlookUrl = useSetting<string>('Outlook_Calendar_Outlook_Url');
	const { authEnabled, canSync, handleCheckCredentials } = useOutlookAuthentication({ onChangeRoute });

	const calendarData = useEndpoint('GET', '/v1/calendar-events.list');
	const { data, isLoading, isError, error, refetch } = useQuery(
		['getCalendarEventsList'],
		async () => calendarData({ date: new Date().toISOString() }),
		{
			refetchOnWindowFocus: false,
		},
	);

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

				try {
					if (!authEnabled) {
						handleCheckCredentials();
					}
				} catch {
					// Ignore error when checking if the credentials were saved.
				}
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
		return <ContextualbarSkeleton />;
	}

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='calendar' />
				<ContextualbarTitle>{t('Outlook_calendar')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>

			{canSync && !authEnabled && total === 0 && (
				<>
					<ContextualbarContent paddingInline={0} ref={ref} color='default'>
						<Box display='flex' flexDirection='column' justifyContent='center' height='100%'>
							<States>
								<StatesIcon name='user' />
								<StatesTitle>{t('Log_in_to_sync')}</StatesTitle>
							</States>
						</Box>
					</ContextualbarContent>
					<ContextualbarFooter>
						<ButtonGroup mbs='x8' stretch>
							<Button primary disabled={isSyncing} onClick={handleSync}>
								{isSyncing ? t('Please_wait') : t('Login')}
							</Button>
						</ButtonGroup>
					</ContextualbarFooter>
				</>
			)}

			{(authEnabled || !canSync) && (
				<>
					<ContextualbarContent paddingInline={0} ref={ref} color='default'>
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
					</ContextualbarContent>
					<ContextualbarFooter>
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
					</ContextualbarFooter>
				</>
			)}
		</>
	);
};

export default OutlookEventsList;
