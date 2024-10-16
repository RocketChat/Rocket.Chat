import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
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
import { VirtuosoScrollbars } from '../../../components/CustomScrollbars';
import { getErrorMessage } from '../../../lib/errorHandling';
import { useOutlookAuthentication } from '../hooks/useOutlookAuthentication';
import { useMutationOutlookCalendarSync, useOutlookCalendarListForToday } from '../hooks/useOutlookCalendarList';
import { NotOnDesktopError } from '../lib/NotOnDesktopError';
import OutlookEventItem from './OutlookEventItem';

type OutlookEventsListProps = {
	onClose: () => void;
	changeRoute: () => void;
};

const OutlookEventsList = ({ onClose, changeRoute }: OutlookEventsListProps): ReactElement => {
	const t = useTranslation();
	const outlookUrl = useSetting<string>('Outlook_Calendar_Outlook_Url');
	const { authEnabled, isError, error } = useOutlookAuthentication();

	const hasOutlookMethods = !(isError && error instanceof NotOnDesktopError);

	const syncOutlookCalendar = useMutationOutlookCalendarSync();

	const calendarListResult = useOutlookCalendarListForToday();

	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 1 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});

	if (calendarListResult.isLoading) {
		return <ContextualbarSkeleton />;
	}

	const calendarEvents = calendarListResult.data;
	const total = calendarEvents?.length || 0;

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='calendar' />
				<ContextualbarTitle>{t('Outlook_calendar')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>

			{hasOutlookMethods && !authEnabled && total === 0 && (
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
						<Box mbs={8}>
							<ButtonGroup stretch>
								<Button primary loading={syncOutlookCalendar.isLoading} onClick={() => syncOutlookCalendar.mutate()}>
									{t('Login')}
								</Button>
							</ButtonGroup>
						</Box>
					</ContextualbarFooter>
				</>
			)}

			{(authEnabled || !hasOutlookMethods) && (
				<>
					<ContextualbarContent paddingInline={0} ref={ref} color='default'>
						{(total === 0 || calendarListResult.isError) && (
							<Box display='flex' flexDirection='column' justifyContent='center' height='100%'>
								{calendarListResult.isError && (
									<States>
										<StatesIcon name='circle-exclamation' variation='danger' />
										<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
										<StatesSubtitle>{getErrorMessage(calendarListResult.error)}</StatesSubtitle>
									</States>
								)}
								{!calendarListResult.isError && total === 0 && (
									<States>
										<StatesIcon name='calendar' />
										<StatesTitle>{t('No_history')}</StatesTitle>
									</States>
								)}
							</Box>
						)}
						{calendarListResult.isSuccess && calendarListResult.data.length > 0 && (
							<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
								<Virtuoso
									style={{
										height: blockSize,
										width: inlineSize,
									}}
									totalCount={total}
									overscan={25}
									data={calendarEvents}
									components={{ Scroller: VirtuosoScrollbars }}
									itemContent={(_index, calendarData): ReactElement => <OutlookEventItem {...calendarData} />}
								/>
							</Box>
						)}
					</ContextualbarContent>
					<ContextualbarFooter>
						<ButtonGroup stretch>
							{authEnabled && <Button onClick={changeRoute}>{t('Calendar_settings')}</Button>}
							{outlookUrl && (
								<Button icon='new-window' onClick={() => window.open(outlookUrl, '_blank')}>
									{t('Open_Outlook')}
								</Button>
							)}
						</ButtonGroup>
						{hasOutlookMethods && (
							<Box mbs={8}>
								<ButtonGroup stretch>
									<Button primary loading={syncOutlookCalendar.isLoading} onClick={() => syncOutlookCalendar.mutate()}>
										{t('Sync')}
									</Button>
								</ButtonGroup>
							</Box>
						)}
					</ContextualbarFooter>
				</>
			)}
		</>
	);
};

export default OutlookEventsList;
