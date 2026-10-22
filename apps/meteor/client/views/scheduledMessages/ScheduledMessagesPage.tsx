import type { IRoom, IScheduledMessage, Serialized } from '@rocket.chat/core-typings';
import { Badge, Box, Tabs, TabsItem, Throbber } from '@rocket.chat/fuselage';
import { GenericNoResults, Page, PageHeader, PageScrollableContentWithShadow } from '@rocket.chat/ui-client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ScheduledMessagesRoomGroup from './ScheduledMessagesRoomGroup';
import { useScheduledMessageActions } from '../../components/ScheduledMessages/useScheduledMessageActions';
import { useScheduledMessages } from '../../hooks/useScheduledMessages';

const groupByRoom = (scheduledMessages: Serialized<IScheduledMessage>[]) =>
	scheduledMessages.reduce((groups, scheduledMessage) => {
		groups.set(scheduledMessage.rid, [...(groups.get(scheduledMessage.rid) ?? []), scheduledMessage]);
		return groups;
	}, new Map<IRoom['_id'], Serialized<IScheduledMessage>[]>());

const ScheduledMessagesPage = () => {
	const { t } = useTranslation();
	const [tab, setTab] = useState<'all' | 'failed'>('all');
	const { data: scheduledMessages = [], isLoading } = useScheduledMessages();
	const actions = useScheduledMessageActions();

	const failed = scheduledMessages.filter(({ status }) => status === 'failed');
	const visible = tab === 'failed' ? failed : scheduledMessages;

	return (
		<Page background='room'>
			<PageHeader title={t('Scheduled_messages')} />
			<Box paddingInline={24}>
				<Tabs>
					<TabsItem selected={tab === 'all'} onClick={() => setTab('all')}>
						{t('All')}
					</TabsItem>
					<TabsItem selected={tab === 'failed'} onClick={() => setTab('failed')}>
						<Box is='span' display='inline-flex' alignItems='center'>
							{t('Failed')}
							{failed.length > 0 && (
								<Box is='span' marginInlineStart={8}>
									<Badge variant='danger'>{failed.length}</Badge>
								</Box>
							)}
						</Box>
					</TabsItem>
				</Tabs>
			</Box>
			<PageScrollableContentWithShadow>
				{isLoading && <Throbber size='x12' />}
				{!isLoading && visible.length === 0 && (
					<GenericNoResults icon='clock' title={t('No_scheduled_messages')} description={t('Scheduled_messages_empty_description')} />
				)}
				{[...groupByRoom(visible)].map(([rid, roomMessages]) => (
					<ScheduledMessagesRoomGroup key={rid} rid={rid} scheduledMessages={roomMessages} actions={actions} />
				))}
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default ScheduledMessagesPage;
