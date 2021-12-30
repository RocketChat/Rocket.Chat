import React, { useEffect } from 'react';

import { useModal } from '../../../contexts/ModalContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import * as banners from '../../../lib/banners';
import {
	OnDecryptingRemoteKeyPair,
	OnFailureToDecrypt,
	OnGenerateRandomPassword,
	OnPromptingForPassword,
} from '../../../lib/e2ee/operations';
import EnterE2EEPasswordModal from '../EnterE2EEPasswordModal';
import SaveE2EEPasswordModal from '../SaveE2EEPasswordModal';

type FetchUserKeysEffects = {
	onDecryptingRemoteKeyPair: OnDecryptingRemoteKeyPair;
	onPromptingForPassword: OnPromptingForPassword;
	onFailureToDecrypt: OnFailureToDecrypt;
	onGenerateRandomPassword: OnGenerateRandomPassword;
};

export const useFetchUserKeysEffects = (): FetchUserKeysEffects => {
	const t = useTranslation();
	const { setModal } = useModal();

	useEffect(
		() => (): void => {
			banners.closeById('e2e');
		},
		[],
	);

	const onDecryptingRemoteKeyPair = ({ onConfirm }: { onConfirm: () => void }): void => {
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
	};

	const onPromptingForPassword = ({ onInput, onCancel }: { onInput: (password: string) => void; onCancel: () => void }): void => {
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
	};

	const onFailureToDecrypt = ({ onRetry, onAccept }: { onRetry: () => void; onAccept: () => void }): void => {
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
	};

	const onGenerateRandomPassword = (password: string): void => {
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
	};

	return {
		onDecryptingRemoteKeyPair,
		onPromptingForPassword,
		onFailureToDecrypt,
		onGenerateRandomPassword,
	};
};
