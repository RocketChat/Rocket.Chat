import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, ButtonGroup, Button, Throbber } from '@rocket.chat/fuselage';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarFooter,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import { useTranslation, useUser } from '@rocket.chat/ui-contexts';

import OutlookEventItem from './OutlookEventItem';
import { PaginatedVirtualList } from '../../../components/PaginatedVirtualList';
import { getErrorMessage } from '../../../lib/errorHandling';
import { useOutlookAuthentication } from '../hooks/useOutlookAuthentication';
import { useMutationOutlookCalendarSync, useOutlookCalendarListForToday } from '../hooks/useOutlookCalendarList';
import { NotOnDesktopError } from '../lib/NotOnDesktopError';

type OutlookEventsListProps = {
	onClose: () => void;
	changeRoute: () => void;
};

const OutlookEventsList = ({ onClose, changeRoute }: OutlookEventsListProps) => {
	const t = useTranslation();
	const user = useUser();
	const { authEnabled, isError, error } = useOutlookAuthentication();

	const hasOutlookMethods = !(isError && error instanceof NotOnDesktopError);

	const syncOutlookCalendar = useMutationOutlookCalendarSync();

	const calendarListResult = useOutlookCalendarListForToday();

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
			<ContextualbarContent paddingInline={0} color='default'>
				<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex' justifyContent='center' style={{ minHeight: 0 }}>
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
						<Box h='full' w='full' style={{ minHeight: 0 }}>
							<PaginatedVirtualList
								items={calendarListResult.data}
								totalCount={total}
								overscan={25}
								renderItem={(calendarData) => <OutlookEventItem {...calendarData} />}
							/>
						</Box>
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
		</ContextualbarDialog>
	);
};

export default OutlookEventsList;
