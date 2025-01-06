import { MessageMetricsItem, MessageBlock, MessageMetrics, MessageMetricsItemIcon, MessageMetricsItemLabel } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import ThreadMetricsParticipants from '../../../../../components/message/content/ThreadMetricsParticipants';
import { useTimeAgo } from '../../../../../hooks/useTimeAgo';

type ThreadMetricsProps = {
	lm: Date;
	counter: number;
	participants: Array<string>;
};

const ThreadListMetrics = ({ counter, participants, lm }: ThreadMetricsProps): ReactElement => {
	const t = useTranslation();

	const format = useTimeAgo();

	const { ref, borderBoxSize } = useResizeObserver<HTMLDivElement>();

	const isSmall = (borderBoxSize.inlineSize || Infinity) < 200;

	return (
		<MessageBlock ref={ref}>
			<MessageMetrics>
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

export default ThreadListMetrics;
