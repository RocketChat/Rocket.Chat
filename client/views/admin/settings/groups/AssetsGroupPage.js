import { Button } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

import { useEditableSettingsGroupSections } from '../../../../contexts/EditableSettingsContext';
import { useMethod } from '../../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import GroupPage from '../GroupPage';
import Section from '../Section';

function AssetsGroupPage({ _id, ...group }) {
	const sections = useEditableSettingsGroupSections(_id);
	const solo = sections.length === 1;
	const t = useTranslation();

	const refreshClients = useMethod('refreshClients');
	const dispatchToastMessage = useToastMessageDispatch();

	const handleApplyAndRefreshAllClientsButtonClick = async () => {
		try {
			await refreshClients();
			dispatchToastMessage({
				type: 'success',
				message: t('Clients_will_refresh_in_a_few_seconds'),
			});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<GroupPage
			_id={_id}
			{...group}
			headerButtons={
				<>
					<Button onClick={handleApplyAndRefreshAllClientsButtonClick}>{t('Apply_and_refresh_all_clients')}</Button>
				</>
			}
		>
			{sections.map((sectionName) => (
				<Section key={sectionName} groupId={_id} hasReset={false} sectionName={sectionName} solo={solo} />
			))}
		</GroupPage>
	);
}

export default memo(AssetsGroupPage);
