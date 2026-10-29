import type { IMessage } from '@rocket.chat/core-typings';
import {
	MessageMetricsItem,
	MessageBlock,
	MessageMetrics,
	MessageMetricsReply,
	MessageMetricsItemIcon,
	MessageMetricsItemLabel,
} from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from 'react-i18next';

import ThreadMetricsFollow from './ThreadMetricsFollow';
import ThreadMetricsParticipants from './ThreadMetricsParticipants';
import { useTimeAgo } from '../../../hooks/useTimeAgo';
import { useMessageNavigation } from '../contexts/MessageNavigationContext';

export type ThreadMetricsProps = {
	/** The thread's main message. */
	message: IMessage;
	unread: boolean;
	mention: boolean;
	all: boolean;
	lm: Date;
	counter: number;
	participants: string[];
	following: boolean;
};

const ThreadMetrics = ({ message, unread, mention, all, counter, participants, following, lm }: ThreadMetricsProps) => {
	const { t } = useTranslation();
	const format = useTimeAgo();
	const { openThread } = useMessageNavigation();
	const { _id: mid, rid } = message;

	const { ref, borderBoxSize } = useResizeObserver<HTMLDivElement>();

	const isSmall = (borderBoxSize.inlineSize || Infinity) < 320;

	return (
		<MessageBlock ref={ref}>
			<MessageMetrics>
				<MessageMetricsReply
					data-rid={rid}
					data-mid={mid}
					onClick={() => openThread({ rid, tmid: mid })}
					variant={unread ? 'primary' : 'secondary'}
				>
					{t('View_thread')}
				</MessageMetricsReply>
				<ThreadMetricsFollow message={message} unread={unread} mention={mention} all={all} following={following} />
				{participants?.length > 0 && <ThreadMetricsParticipants participants={participants} />}
				<MessageMetricsItem title={t('Last_message__date__', { date: format(lm) })}>
					<MessageMetricsItemIcon name='thread' />
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
