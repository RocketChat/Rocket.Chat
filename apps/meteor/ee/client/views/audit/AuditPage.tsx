import { Margins, States, StatesIcon, StatesSubtitle, StatesTitle, Tabs } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import Page from '../../../../client/components/Page/Page';
import PageHeader from '../../../../client/components/Page/PageHeader';
import PageScrollableContentWithShadow from '../../../../client/components/Page/PageScrollableContentWithShadow';
import MessageListSkeleton from '../../../../client/components/message/list/MessageListSkeleton';
import { getErrorMessage } from '../../../../client/lib/errorHandling';
import AuditForm from './components/AuditForm';
import AuditResult from './components/AuditResult';
import { useAuditMutation } from './hooks/useAuditMutation';
import { useAuditTab } from './hooks/useAuditTab';

const AuditPage = () => {
	const [type, setType] = useAuditTab();
	const auditMutation = useAuditMutation(type);
	const t = useTranslation();

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
					<AuditForm key={type} type={type} onSubmit={auditMutation.mutate} />
					{auditMutation.isLoading && <MessageListSkeleton messageCount={5} />}
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
