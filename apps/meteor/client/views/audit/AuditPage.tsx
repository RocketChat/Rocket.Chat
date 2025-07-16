import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Callout, Margins, States, StatesIcon, StatesSubtitle, StatesTitle, Tabs } from '@rocket.chat/fuselage';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import AuditForm from './components/AuditForm';
import AuditResult from './components/AuditResult';
import { useAuditMutation } from './hooks/useAuditMutation';
import { useAuditTab } from './hooks/useAuditTab';
import { Page, PageHeader, PageScrollableContentWithShadow } from '../../components/Page';
import MessageListSkeleton from '../../components/message/list/MessageListSkeleton';
import { getErrorMessage } from '../../lib/errorHandling';

const AuditPage = () => {
	const [type, setType] = useAuditTab();
	const [selectedRoom, setSelectedRoom] = useState<IRoom | undefined>();
	const auditMutation = useAuditMutation(type);
	const { t } = useTranslation();

	return (
		<Page background='room'>
			<PageHeader title={t('Message_auditing')} />
			<Tabs>
				<Tabs.Item selected={type === ''} onClick={() => setType('')}>
					{t('Rooms')}
				</Tabs.Item>
				<Tabs.Item selected={type === 'u'} onClick={() => setType('u')}>
					{t('Users')}
				</Tabs.Item>
				<Tabs.Item selected={type === 'd'} onClick={() => setType('d')}>
					{t('Direct_Messages')}
				</Tabs.Item>
				<Tabs.Item selected={type === 'l'} onClick={() => setType('l')}>
					{t('Omnichannel')}
				</Tabs.Item>
			</Tabs>
			<PageScrollableContentWithShadow mb={-4}>
				<Margins block={4}>
					<AuditForm key={type} type={type} setSelectedRoom={setSelectedRoom} onSubmit={auditMutation.mutate} />
					{selectedRoom?.encrypted && type === '' ? (
						<Callout type='warning' icon='circle-exclamation' marginBlock='x16'>
							<Box fontScale='p2b'>{t('Encrypted_content_cannot_be_searched_and_audited')}</Box>
							{t('Encrypted_content_cannot_be_searched_and_audited_subtitle')}
						</Callout>
					) : null}
					{auditMutation.isPending && <MessageListSkeleton messageCount={5} />}
					{auditMutation.isError && (
						<States>
							<StatesIcon name='circle-exclamation' variation='danger' />
							<StatesTitle>{t('Error')}</StatesTitle>
							<StatesSubtitle>{getErrorMessage(auditMutation.error)}</StatesSubtitle>
						</States>
					)}
					{auditMutation.isSuccess && <AuditResult messages={auditMutation.data} />}
				</Margins>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default AuditPage;
