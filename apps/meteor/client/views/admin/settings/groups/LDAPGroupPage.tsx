import { Button, Box, TextInput, Field } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { FormEvent, memo, useMemo } from 'react';

import type { ISetting } from '../../../../../definition/ISetting';
import GenericModal from '../../../../components/GenericModal';
import { useEditableSettings } from '../../../../contexts/EditableSettingsContext';
import { useSetModal } from '../../../../contexts/ModalContext';
import { useEndpoint } from '../../../../contexts/ServerContext';
import { useSetting } from '../../../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import TabbedGroupPage from './TabbedGroupPage';

function LDAPGroupPage({ _id, ...group }: ISetting): JSX.Element {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const testConnection = useEndpoint('POST', 'ldap.testConnection');
	const syncNow = useEndpoint('POST', 'ldap.syncNow');
	const testSearch = useEndpoint('POST', 'ldap.testSearch');
	const ldapEnabled = useSetting('LDAP_Enable');
	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal());

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
			dispatchToastMessage({ type: 'success', message: t(message) });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleSyncNowButtonClick = async (): Promise<void> => {
		try {
			await testConnection();
			const confirmSync = async (): Promise<void> => {
				closeModal();

				try {
					const { message } = await syncNow();
					dispatchToastMessage({ type: 'success', message: t(message) });
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
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
			dispatchToastMessage({ type: 'error', message: error });
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
					dispatchToastMessage({ type: 'success', message: t(message) });
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			};

			setModal(
				<GenericModal
					variant='info'
					confirmText={t('Search')}
					cancelText={t('Cancel')}
					title={t('Test_LDAP_Search')}
					onConfirm={confirmSearch}
					onClose={closeModal}
				>
					<Field>
						<Box display='flex'>
							<Field.Label>{t('LDAP_Username_To_Search')}</Field.Label>
						</Box>

						<Field.Row>
							<TextInput onChange={handleChangeUsername} />
						</Field.Row>
					</Field>
				</GenericModal>,
			);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<TabbedGroupPage
			_id={_id}
			{...group}
			headerButtons={
				<>
					<Button children={t('Test_Connection')} disabled={!ldapEnabled || changed} onClick={handleTestConnectionButtonClick} />
					<Button children={t('Test_LDAP_Search')} disabled={!ldapEnabled || changed} onClick={handleSearchTestButtonClick} />
					<Button children={t('LDAP_Sync_Now')} disabled={!ldapEnabled || changed} onClick={handleSyncNowButtonClick} />
					<Button is='a' href='https://go.rocket.chat/i/ldap-docs' target='_blank'>
						{t('LDAP_Documentation')}
					</Button>
				</>
			}
		/>
	);
}

export default memo(LDAPGroupPage);
