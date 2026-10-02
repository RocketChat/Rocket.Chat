import type { ICalendarEvent, Serialized } from '@rocket.chat/core-typings';
import { Button, Item, ItemActions, ItemContent, ItemDescription, ItemLink, ItemTitle } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import OutlookCalendarEventModal from '../OutlookCalendarEventModal';
import { useOutlookOpenCall } from '../hooks/useOutlookOpenCall';

export type OutlookEventItemProps = Serialized<ICalendarEvent>;

const OutlookEventItem = ({ subject, description, startTime, meetingUrl }: OutlookEventItemProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const formatDateAndTime = useFormatDateAndTime();
	const openCall = useOutlookOpenCall(meetingUrl);

	const handleOpenEvent = () => {
		setModal(
			<OutlookCalendarEventModal
				onClose={() => setModal(null)}
				onCancel={() => setModal(null)}
				subject={subject}
				meetingUrl={meetingUrl}
				description={description}
			/>,
		);
	};

	return (
		<Item size='extended' inset='lg'>
			<ItemContent>
				<ItemTitle>
					<ItemLink is='button' onClick={handleOpenEvent}>
						{subject}
					</ItemLink>
				</ItemTitle>
				<ItemDescription>{formatDateAndTime(startTime)}</ItemDescription>
			</ItemContent>
			{meetingUrl && (
				<ItemActions>
					<Button onClick={openCall} small>
						{t('Join')}
					</Button>
				</ItemActions>
			)}
		</Item>
	);
};

export default OutlookEventItem;
