import { MessageBlock, MessageMetrics, MessageMetricsItem, MessageMetricsItemLabel, MessageMetricsReply } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useUserSubscription } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import DiscussionMetricsMembership from './DiscussionMetricsMembership';
import DiscussionMetricsParticipants from './DiscussionMetricsParticipants';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import { useTimeAgo } from '../../../hooks/useTimeAgo';
import { useGoToRoom } from '../../../views/room/hooks/useGoToRoom';

export type DiscussionMetricsProps = {
	drid: string;
	rid: string;
	count: number;
	lm?: Date;
};

const DiscussionMetrics = ({ lm, count, rid, drid }: DiscussionMetricsProps) => {
	const { t } = useTranslation();
	const format = useTimeAgo();
	const formatDateAndTime = useFormatDateAndTime();

	const goToRoom = useGoToRoom();

	const subscription = useUserSubscription(drid);
	// Only highlight the button when the user is a member of the discussion and has unread messages in it
	const hasUnread = !!subscription && (subscription.unread > 0 || !!subscription.alert);

	const { ref, borderBoxSize } = useResizeObserver<HTMLDivElement>();

	const isSmall = (borderBoxSize.inlineSize || Infinity) < 320;

	const getRepliesLabel = () => {
		if (!count) {
			return t('No_replies');
		}

		if (isSmall || !lm) {
			return t('__count__replies', { count });
		}

		return t('__count__replies__date__', { count, date: format(lm) });
	};

	return (
		<MessageBlock ref={ref}>
			<MessageMetrics>
				<MessageMetricsReply data-rid={rid} data-drid={drid} onClick={() => goToRoom(drid)} primary={hasUnread} icon='discussion'>
					{t('Discussion')}
				</MessageMetricsReply>
				<DiscussionMetricsMembership drid={drid} />
				<DiscussionMetricsParticipants drid={drid} />
				<MessageMetricsItem title={lm ? t('Last_message__date__', { date: formatDateAndTime(lm) }) : undefined}>
					<MessageMetricsItemLabel>{getRepliesLabel()}</MessageMetricsItemLabel>
				</MessageMetricsItem>
			</MessageMetrics>
		</MessageBlock>
	);
};

export default DiscussionMetrics;
