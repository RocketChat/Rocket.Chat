import { Button } from '@rocket.chat/fuselage';
import React from 'react';

import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useMethod } from '../../../../hooks/useMethod';
import { GroupPage } from '../GroupPage';
import { Section } from '../Section';

export function AssetsGroupPage({ group }) {
	const solo = group.sections.length === 1;
	const t = useTranslation();

	const refreshClients = useMethod('refreshClients');
	const dispatchToastMessage = useToastMessageDispatch();

	const handleApplyAndRefreshAllClientsButtonClick = async () => {
		try {
			await refreshClients();
			dispatchToastMessage({ type: 'success', message: t('Clients_will_refresh_in_a_few_seconds') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return <GroupPage group={group} headerButtons={<>
		<Button onClick={handleApplyAndRefreshAllClientsButtonClick}>{t('Apply_and_refresh_all_clients')}</Button>
	</>}>
		{group.sections.map((sectionName) => <Section
			key={sectionName}
			groupId={group._id}
			hasReset={false}
			sectionName={sectionName}
			solo={solo}
		/>)}
	</GroupPage>;
}
