import { Margins, Tabs } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';

import Page from '../../../../client/components/Page/Page';
import PageHeader from '../../../../client/components/Page/PageHeader';
import PageScrollableContentWithShadow from '../../../../client/components/Page/PageScrollableContentWithShadow';
import AuditForm from './components/AuditForm';
import AuditResult from './components/AuditResult';
import type { AuditFields } from './hooks/useAuditForm';
import { useAuditTab } from './hooks/useAuditTab';

const AuditPage = () => {
	const [type, setType] = useAuditTab();

	const [auditFields, setAuditFields] = useState<AuditFields | undefined>();

	const handleSubmit = useMutableCallback((fields: AuditFields) => {
		setAuditFields(fields);
	});

	const t = useTranslation();

	return (
		<Page>
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
					<AuditForm key={type} type={type} onSubmit={handleSubmit} />
					{auditFields && <AuditResult type={type} {...auditFields} />}
				</Margins>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default AuditPage;
