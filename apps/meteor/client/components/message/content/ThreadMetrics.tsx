import { MessageMetricsItem, MessageBlock, MessageMetrics, MessageMetricsReply, MessageMetricsItemLabel } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from 'react-i18next';

import ThreadMetricsFollow from './ThreadMetricsFollow';
import ThreadMetricsParticipants from './ThreadMetricsParticipants';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import { useTimeAgo } from '../../../hooks/useTimeAgo';
import { useGoToThread } from '../../../views/room/hooks/useGoToThread';

export type ThreadMetricsProps = {
	unread: boolean;
	mention: boolean;
	all: boolean;
	lm: Date;
	mid: string;
	rid: string;
	counter: number;
	participants: string[];
	following: boolean;
};

const ThreadMetrics = ({ unread, mention, all, rid, mid, counter, participants, following, lm }: ThreadMetricsProps) => {
	const { t } = useTranslation();

	const format = useTimeAgo();
	const formatDateAndTime = useFormatDateAndTime();

	const goToThread = useGoToThread();

	const { ref, borderBoxSize } = useResizeObserver<HTMLDivElement>();

	const isSmall = (borderBoxSize.inlineSize || Infinity) < 320;

	return (
		<MessageBlock ref={ref}>
			<MessageMetrics>
				<MessageMetricsReply
					data-rid={rid}
					data-mid={mid}
					onClick={() => goToThread({ rid, tmid: mid })}
					primary={!!unread}
					icon='thread'
					position='relative'
					overflow='visible'
				>
					{t('Thread')}
				</MessageMetricsReply>
				<ThreadMetricsFollow unread={unread} mention={mention} all={all} mid={mid} rid={rid} following={following} />
				{participants?.length > 0 && <ThreadMetricsParticipants participants={participants} />}
				<MessageMetricsItem title={t('Last_message__date__', { date: formatDateAndTime(lm) })}>
					{isSmall ? (
						<MessageMetricsItemLabel>{t('__count__replies', { count: counter })}</MessageMetricsItemLabel>
					) : (
						<MessageMetricsItemLabel>{t('__count__replies__date__', { count: counter, date: format(lm) })}</MessageMetricsItemLabel>
					)}
				</MessageMetricsItem>
			</MessageMetrics>
		</MessageBlock>
	);
};

export default ThreadMetrics;
