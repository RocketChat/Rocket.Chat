import type { ISetting } from '@rocket.chat/core-typings';
import { Button } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useAbsoluteUrl, useMethod, useTranslation, useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';
import s from 'underscore.string';

import GenericModal from '../../../../components/GenericModal';
import { useEditableSettingsGroupSections } from '../../EditableSettingsContext';
import GroupPage from '../GroupPage';
import Section from '../Section';
import CreateOAuthModal from './CreateOAuthModal';

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
	const setModal = useSetModal();

	const handleRefreshOAuthServicesButtonClick = async (): Promise<void> => {
		dispatchToastMessage({ type: 'info', message: t('Refreshing') });
		try {
			await refreshOAuthService();
			dispatchToastMessage({ type: 'success', message: t('Done') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleAddCustomOAuthButtonClick = (): void => {
		const onConfirm = async (text: string): Promise<void> => {
			try {
				await addOAuthService(text);
				dispatchToastMessage({ type: 'success', message: t('Custom_OAuth_has_been_added') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};
		setModal(<CreateOAuthModal onConfirm={onConfirm} onClose={(): void => setModal(null)} />);
	};

	const removeCustomOauthFactory =
		(id: string): (() => void) =>
		(): void => {
			const close = (): void => setModal(null);
			setModal(
				<GenericModal
					onClose={close}
					onCancel={close}
					title={t('Are_you_sure')}
					variant='danger'
					confirmText={t('Yes_delete_it')}
					onConfirm={async (): Promise<void> => {
						try {
							await removeOAuthService(id);
							dispatchToastMessage({ type: 'success', message: t('Custom_OAuth_has_been_removed') });
						} catch (error) {
							dispatchToastMessage({ type: 'error', message: error });
						} finally {
							setModal(null);
						}
					}}
				></GenericModal>,
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

					const handleRemoveCustomOAuthButtonClick = removeCustomOauthFactory(id);

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
								<Button secondary danger onClick={handleRemoveCustomOAuthButtonClick}>
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
