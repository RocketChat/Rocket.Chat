import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, ButtonGroup, Button, Throbber } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { Virtuoso } from 'react-virtuoso';

import OutlookEventItem from './OutlookEventItem';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarFooter,
} from '../../../components/Contextualbar';
import { VirtualizedScrollbars } from '../../../components/CustomScrollbars';
import { getErrorMessage } from '../../../lib/errorHandling';
import { useOutlookAuthentication } from '../hooks/useOutlookAuthentication';
import { useMutationOutlookCalendarSync, useOutlookCalendarListForToday } from '../hooks/useOutlookCalendarList';
import { NotOnDesktopError } from '../lib/NotOnDesktopError';

type OutlookEventsListProps = {
	onClose: () => void;
	changeRoute: () => void;
};

const OutlookEventsList = ({ onClose, changeRoute }: OutlookEventsListProps): ReactElement => {
	const t = useTranslation();
	const outlookUrl = useSetting('Outlook_Calendar_Outlook_Url', '');
	const { authEnabled, isError, error } = useOutlookAuthentication();

	const hasOutlookMethods = !(isError && error instanceof NotOnDesktopError);

	const syncOutlookCalendar = useMutationOutlookCalendarSync();

	const calendarListResult = useOutlookCalendarListForToday();

	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 1 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});

	const calendarEvents = calendarListResult.data;
	const total = calendarEvents?.length || 0;

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='calendar' />
				<ContextualbarTitle>{t('Outlook_calendar')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarContent paddingInline={0} color='default'>
				<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex' justifyContent='center' ref={ref}>
					{calendarListResult.isPending && <Throbber size='x12' />}
					{calendarListResult.isError && (
						<States>
							<StatesIcon name='circle-exclamation' variation='danger' />
							<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
							<StatesSubtitle>{getErrorMessage(calendarListResult.error)}</StatesSubtitle>
						</States>
					)}
					{!calendarListResult.isPending && total === 0 && (
						<States>
							<StatesIcon name='calendar' />
							<StatesTitle>{t('No_history')}</StatesTitle>
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
								itemContent={(_index, calendarData): ReactElement => <OutlookEventItem {...calendarData} />}
							/>
						</VirtualizedScrollbars>
					)}
				</Box>
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
							<Button primary loading={syncOutlookCalendar.isPending} onClick={() => syncOutlookCalendar.mutate()}>
								{authEnabled ? t('Sync') : t('Log_in_to_sync')}
							</Button>
						</ButtonGroup>
					</Box>
				)}
			</ContextualbarFooter>
		</>
	);
};

export default OutlookEventsList;
