import { ISetting } from '@rocket.chat/core-typings';
import { Button } from '@rocket.chat/fuselage';
import { useModal, useToastMessageDispatch, useAbsoluteUrl, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement } from 'react';
import s from 'underscore.string';

import { useEditableSettingsGroupSections } from '../../EditableSettingsContext';
import GroupPage from '../GroupPage';
import Section from '../Section';

type OAuthGroupPageProps = ISetting;

function OAuthGroupPage({ _id, ...group }: OAuthGroupPageProps): ReactElement {
	const sections = useEditableSettingsGroupSections(_id);
	const solo = sections.length === 1;
	const t = useTranslation();

	const sectionIsCustomOAuth = (sectionName: string): string | boolean => sectionName && /^Custom OAuth:\s.+/.test(sectionName);

	const getAbsoluteUrl = useAbsoluteUrl();

	const callbackURL = (sectionName: string): string => {
		const id = s.strRight(sectionName, 'Custom OAuth: ').toLowerCase();
		return getAbsoluteUrl(`_oauth/${id}`);
	};

	const dispatchToastMessage = useToastMessageDispatch();
	const refreshOAuthService = useMethod('refreshOAuthService');
	const addOAuthService = useMethod('addOAuthService');
	const removeOAuthService = useMethod('removeOAuthService');
	const modal = useModal();

	const handleRefreshOAuthServicesButtonClick = async (): Promise<void> => {
		dispatchToastMessage({ type: 'info', message: t('Refreshing') });
		try {
			await refreshOAuthService();
			dispatchToastMessage({ type: 'success', message: t('Done') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: String(error) });
		}
	};

	const handleAddCustomOAuthButtonClick = (): void => {
		modal.open(
			{
				title: t('Add_custom_oauth'),
				text: t('Give_a_unique_name_for_the_custom_oauth'),
				type: 'input',
				showCancelButton: true,
				closeOnConfirm: true,
				inputPlaceholder: t('Custom_oauth_unique_name'),
			},
			async (inputValue: unknown) => {
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
					dispatchToastMessage({ type: 'error', message: String(error) });
				}
			},
		);
	};

	return (
		<GroupPage
			_id={_id}
			{...group}
			headerButtons={
				<>
					<Button onClick={handleRefreshOAuthServicesButtonClick}>{t('Refresh_oauth_services')}</Button>
					<Button onClick={handleAddCustomOAuthButtonClick}>{t('Add_custom_oauth')}</Button>
				</>
			}
		>
			{sections.map((sectionName) => {
				if (sectionIsCustomOAuth(sectionName)) {
					const id = s.strRight(sectionName, 'Custom OAuth: ').toLowerCase();

					const handleRemoveCustomOAuthButtonClick = (): void => {
						modal.open(
							{
								title: t('Are_you_sure'),
								type: 'warning',
								showCancelButton: true,
								confirmButtonColor: '#DD6B55',
								confirmButtonText: t('Yes_delete_it'),
								cancelButtonText: t('Cancel'),
								closeOnConfirm: true,
							},
							async () => {
								try {
									await removeOAuthService(id);
								} catch (error) {
									dispatchToastMessage({ type: 'error', message: String(error) });
								}
							},
						);
					};

					return (
						<Section
							key={sectionName}
							groupId={_id}
							help={
								<span
									dangerouslySetInnerHTML={{
										__html: t('Custom_oauth_helper', callbackURL(sectionName)),
									}}
								/>
							}
							sectionName={sectionName}
							solo={solo}
						>
							<div className='submit'>
								<Button danger onClick={handleRemoveCustomOAuthButtonClick}>
									{t('Remove_custom_oauth')}
								</Button>
							</div>
						</Section>
					);
				}

				return <Section key={sectionName} groupId={_id} sectionName={sectionName} solo={solo} />;
			})}
		</GroupPage>
	);
}

export default memo(OAuthGroupPage);
