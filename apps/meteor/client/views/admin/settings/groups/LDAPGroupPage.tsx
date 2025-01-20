import type { ISetting } from '@rocket.chat/core-typings';
import { Button, Box, TextInput, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useSetting, useEndpoint } from '@rocket.chat/ui-contexts';
import type { FormEvent } from 'react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import BaseGroupPage from './BaseGroupPage';
import GenericModal from '../../../../components/GenericModal';
import { useExternalLink } from '../../../../hooks/useExternalLink';
import { useEditableSettings } from '../../EditableSettingsContext';

type LDAPGroupPageProps = ISetting & {
	onClickBack?: () => void;
};

function LDAPGroupPage({ _id, i18nLabel, onClickBack, ...group }: LDAPGroupPageProps) {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const testConnection = useEndpoint('POST', '/v1/ldap.testConnection');
	const syncNow = useEndpoint('POST', '/v1/ldap.syncNow');
	const testSearch = useEndpoint('POST', '/v1/ldap.testSearch');
	const ldapEnabled = useSetting('LDAP_Enable');
	const setModal = useSetModal();
	const closeModal = useEffectEvent(() => setModal());

	const handleLinkClick = useExternalLink();

	const editableSettings = useEditableSettings(
		useMemo(
			() => ({
				group: _id,
			}),
			[_id],
		),
	);

	const changed = useMemo(() => editableSettings.some(({ changed }) => changed), [editableSettings]);

	const handleTestConnectionButtonClick = async (): Promise<void> => {
		try {
			const { message } = await testConnection();
			dispatchToastMessage({ type: 'success', message: t(message as Parameters<typeof t>[0]) });
		} catch (error) {
			error instanceof Error && dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleSyncNowButtonClick = async (): Promise<void> => {
		try {
			await testConnection();
			const confirmSync = async (): Promise<void> => {
				closeModal();

				try {
					const { message } = await syncNow();
					dispatchToastMessage({ type: 'success', message: t(message as Parameters<typeof t>[0]) });
				} catch (error) {
					error instanceof Error && dispatchToastMessage({ type: 'error', message: error });
				}
			};

			setModal(
				<GenericModal
					variant='info'
					confirmText={t('Sync')}
					cancelText={t('Cancel')}
					title={t('Execute_Synchronization_Now')}
					onConfirm={confirmSync}
					onClose={closeModal}
				>
					{t('LDAP_Sync_Now_Description')}
				</GenericModal>,
			);
		} catch (error) {
			error instanceof Error && dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleSearchTestButtonClick = async (): Promise<void> => {
		try {
			await testConnection();
			let username = '';
			const handleChangeUsername = (event: FormEvent<HTMLInputElement>): void => {
				username = event.currentTarget.value;
			};

			const confirmSearch = async (): Promise<void> => {
				try {
					const { message } = await testSearch({ username });
					dispatchToastMessage({ type: 'success', message: t(message as Parameters<typeof t>[0]) });
				} catch (error) {
					error instanceof Error && dispatchToastMessage({ type: 'error', message: error });
				}
			};

			setModal(
				<GenericModal
					wrapperFunction={(props) => (
						<Box
							is='form'
							onSubmit={(e: FormEvent) => {
								e.preventDefault();
								confirmSearch();
							}}
							{...props}
						/>
					)}
					variant='info'
					confirmText={t('Search')}
					cancelText={t('Cancel')}
					title={t('Test_LDAP_Search')}
					onClose={closeModal}
				>
					<Field>
						<Box display='flex'>
							<FieldLabel>{t('LDAP_Username_To_Search')}</FieldLabel>
						</Box>

						<FieldRow>
							<TextInput onChange={handleChangeUsername} />
						</FieldRow>
					</Field>
				</GenericModal>,
			);
		} catch (error) {
			error instanceof Error && dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<BaseGroupPage
			_id={_id}
			i18nLabel={i18nLabel}
			onClickBack={onClickBack}
			{...group}
			headerButtons={
				<>
					<Button children={t('Test_Connection')} disabled={!ldapEnabled || changed} onClick={handleTestConnectionButtonClick} />
					<Button children={t('Test_LDAP_Search')} disabled={!ldapEnabled || changed} onClick={handleSearchTestButtonClick} />
					<Button children={t('LDAP_Sync_Now')} disabled={!ldapEnabled || changed} onClick={handleSyncNowButtonClick} />
					<Button role='link' onClick={() => handleLinkClick('https://go.rocket.chat/i/ldap-docs')}>
						{t('LDAP_Documentation')}
					</Button>
				</>
			}
		/>
	);
}

export default memo(LDAPGroupPage);
