import { Button } from '@rocket.chat/fuselage';
import React from 'react';
import s from 'underscore.string';

import RawText from '../../../components/basic/RawText';
import { useAbsoluteUrl, useMethod } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useModal } from '../../../hooks/useModal';
import { GroupPage } from '../GroupPage';
import { Section } from '../Section';

export function OAuthGroupPage({ _id, sections, ...group }) {
	const solo = sections.length === 1;
	const t = useTranslation();

	const sectionIsCustomOAuth = (sectionName) => sectionName && /^Custom OAuth:\s.+/.test(sectionName);

	const getAbsoluteUrl = useAbsoluteUrl();

	const callbackURL = (sectionName) => {
		const id = s.strRight(sectionName, 'Custom OAuth: ').toLowerCase();
		return getAbsoluteUrl(`_oauth/${ id }`);
	};

	const dispatchToastMessage = useToastMessageDispatch();
	const refreshOAuthService = useMethod('refreshOAuthService');
	const addOAuthService = useMethod('addOAuthService');
	const removeOAuthService = useMethod('removeOAuthService');
	const modal = useModal();

	const handleRefreshOAuthServicesButtonClick = async () => {
		dispatchToastMessage({ type: 'info', message: t('Refreshing') });
		try {
			await refreshOAuthService();
			dispatchToastMessage({ type: 'success', message: t('Done') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleAddCustomOAuthButtonClick = () => {
		modal.open({
			title: t('Add_custom_oauth'),
			text: t('Give_a_unique_name_for_the_custom_oauth'),
			type: 'input',
			showCancelButton: true,
			closeOnConfirm: true,
			inputPlaceholder: t('Custom_oauth_unique_name'),
		}, async (inputValue) => {
			if (inputValue === false) {
				return false;
			}
			if (inputValue === '') {
				modal.showInputError(t('Name_cant_be_empty'));
				return false;
			}
			try {
				await addOAuthService(inputValue);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		});
	};

	return <GroupPage _id={_id} {...group} headerButtons={<>
		<Button onClick={handleRefreshOAuthServicesButtonClick}>{t('Refresh_oauth_services')}</Button>
		<Button onClick={handleAddCustomOAuthButtonClick}>{t('Add_custom_oauth')}</Button>
	</>}>
		{sections.map((sectionName) => {
			if (sectionIsCustomOAuth(sectionName)) {
				const id = s.strRight(sectionName, 'Custom OAuth: ').toLowerCase();

				const handleRemoveCustomOAuthButtonClick = () => {
					modal.open({
						title: t('Are_you_sure'),
						type: 'warning',
						showCancelButton: true,
						confirmButtonColor: '#DD6B55',
						confirmButtonText: t('Yes_delete_it'),
						cancelButtonText: t('Cancel'),
						closeOnConfirm: true,
					}, async () => {
						try {
							await removeOAuthService(id);
						} catch (error) {
							dispatchToastMessage({ type: 'error', message: error });
						}
					});
				};

				return <Section
					key={sectionName}
					groupId={_id}
					help={<RawText>{t('Custom_oauth_helper', callbackURL(sectionName))}</RawText>}
					sectionName={sectionName}
					solo={solo}
				>
					<div className='submit'>
						<Button danger onClick={handleRemoveCustomOAuthButtonClick}>{t('Remove_custom_oauth')}</Button>
					</div>
				</Section>;
			}

			return <Section key={sectionName} groupId={_id} sectionName={sectionName} solo={solo} />;
		})}
	</GroupPage>;
}
