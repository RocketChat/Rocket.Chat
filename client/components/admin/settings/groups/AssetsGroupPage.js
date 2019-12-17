import { Button } from '@rocket.chat/fuselage';
import React from 'react';
import toastr from 'toastr';

import { call } from '../../../../../app/ui-utils/client/lib/callMethod';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { GroupPage } from '../GroupPage';
import { Section } from '../Section';

export function AssetsGroupPage({ group }) {
	const solo = group.sections.length === 1;
	const t = useTranslation();

	const handleApplyAndRefreshAllClientsButtonClick = () => {
		call('refreshClients').then(() => {
			toastr.success(t('Clients_will_refresh_in_a_few_seconds'));
		});
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
