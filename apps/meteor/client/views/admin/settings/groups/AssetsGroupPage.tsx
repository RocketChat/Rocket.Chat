import { ISetting } from '@rocket.chat/core-typings';
import { Button } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement } from 'react';

import { useEditableSettingsGroupSections } from '../../EditableSettingsContext';
import GroupPage from '../GroupPage';
import Section from '../Section';

type AssetsGroupPageProps = ISetting;

function AssetsGroupPage({ _id, ...group }: AssetsGroupPageProps): ReactElement {
	const sections = useEditableSettingsGroupSections(_id);
	const solo = sections.length === 1;
	const t = useTranslation();

	const refreshClients = useMethod('refreshClients');
	const dispatchToastMessage = useToastMessageDispatch();

	const handleApplyAndRefreshAllClientsButtonClick = async (): Promise<void> => {
		try {
			await refreshClients();
			dispatchToastMessage({
				type: 'success',
				message: t('Clients_will_refresh_in_a_few_seconds'),
			});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: String(error) });
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
