import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps } from 'react';

import OutlookEventItemContent from './OutlookEventsList/OutlookEventItemContent';
import { useOutlookOpenCall } from './hooks/useOutlookOpenCall';
import GenericModal from '../../components/GenericModal';
import GenericModalSkeleton from '../../components/GenericModal/GenericModalSkeleton';

type OutlookCalendarEventModalProps = ComponentProps<typeof GenericModal> & {
	id?: string;
	subject?: string;
	meetingUrl?: string;
	description?: string;
};

const OutlookCalendarEventModal = ({ id, subject, meetingUrl, description, ...props }: OutlookCalendarEventModalProps) => {
	const t = useTranslation();
	const calendarInfoEndpoint = useEndpoint('GET', '/v1/calendar-events.info');

	const { data, isLoading } = useQuery({
		queryKey: ['calendar-events.info', id],

		queryFn: async () => {
			if (!id) {
				const event = { event: { subject, meetingUrl, description } };
				return event;
			}

			return calendarInfoEndpoint({ id });
		},
	});

	const openCall = useOutlookOpenCall(data?.event.meetingUrl);

	if (isLoading) {
		return <GenericModalSkeleton {...props} />;
	}

	return (
		<GenericModal
			{...props}
			tagline={t('Outlook_calendar_event')}
			icon={null}
			variant='warning'
			title={data?.event.subject}
			cancelText={t('Close')}
			confirmText={t('Join_call')}
			onConfirm={openCall}
		>
			{data?.event.description ? <OutlookEventItemContent html={data?.event.description} /> : t('No_content_was_provided')}
		</GenericModal>
	);
};

export default OutlookCalendarEventModal;
