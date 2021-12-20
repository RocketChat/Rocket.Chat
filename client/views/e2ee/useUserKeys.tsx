import React, { useEffect } from 'react';
import { useQuery, UseQueryResult } from 'react-query';

import { e2ee } from '../../../app/e2e/client';
import { IUser } from '../../../definition/IUser';
import { useModal } from '../../contexts/ModalContext';
import { useTranslation } from '../../contexts/TranslationContext';
import * as banners from '../../lib/banners';
import { fetchUserKeys } from '../../lib/e2ee/userKeys';
import EnterE2EEPasswordModal from './EnterE2EEPasswordModal';
import SaveE2EEPasswordModal from './SaveE2EEPasswordModal';

export const useUserKeys = (uid: IUser['_id']): UseQueryResult<CryptoKeyPair, Error> => {
	const t = useTranslation();
	const { setModal } = useModal();

	useEffect(
		() => (): void => {
			banners.closeById('e2e');
			e2ee.unuse();
		},
		[],
	);

	return useQuery<CryptoKeyPair, Error>(
		['e2ee', 'userKeys', uid],
		({ signal }) =>
			fetchUserKeys({
				uid,
				onDecryptingRemoteKeyPair: ({ onConfirm }) => {
					banners.open({
						id: 'e2e',
						title: t('Enter_your_E2E_password'),
						html: t('Click_here_to_enter_your_encryption_password'),
						modifiers: ['large'],
						closable: false,
						icon: 'key',
						action: () => {
							onConfirm();
						},
					});
				},
				onPromptingForPassword: ({ onInput, onCancel }) => {
					setModal(
						<EnterE2EEPasswordModal
							onConfirm={(password): void => {
								setModal(null);
								banners.closeById('e2e');
								onInput(password);
							}}
							onCancel={(): void => {
								setModal(null);
								banners.closeById('e2e');
								onCancel();
							}}
							onClose={(): void => {
								setModal(null);
								banners.closeById('e2e');
								onCancel();
							}}
						/>,
					);
				},
				onFailureToDecrypt: ({ onRetry, onAccept }) => {
					banners.open({
						id: 'e2e',
						title: "Wasn't possible to decode your encryption key to be imported.",
						html: '<div>Your encryption password seems wrong. Click here to try again.</div>',
						modifiers: ['large', 'danger'],
						closable: true,
						icon: 'key',
						action: () => {
							onRetry();
						},
						onClose: () => {
							banners.closeById('e2e');
							onAccept();
						},
					});
				},
				onGenerateRandomPassword: async (password: string) => {
					banners.open({
						id: 'e2e',
						title: t('Save_Your_Encryption_Password'),
						html: t('Click_here_to_view_and_copy_your_password'),
						modifiers: ['large'],
						closable: false,
						icon: 'key',
						action: () => {
							setModal(
								<SaveE2EEPasswordModal
									passwordRevealText={t('E2E_password_reveal_text', {
										postProcess: 'sprintf',
										sprintf: [password],
									})}
									onClose={(): void => setModal(null)}
									onCancel={(): void => {
										banners.closeById('e2e');
										setModal(null);
									}}
									onConfirm={(): void => {
										banners.closeById('e2e');
										setModal(null);
									}}
								/>,
							);
						},
					});
				},
				signal,
			}),
		{
			staleTime: Infinity,
			cacheTime: 0,
			refetchOnMount: 'always',
			onSuccess: (data) => {
				e2ee.use(data);
			},
			onError: (error) => {
				console.error(error);
			},
		},
	);
};
