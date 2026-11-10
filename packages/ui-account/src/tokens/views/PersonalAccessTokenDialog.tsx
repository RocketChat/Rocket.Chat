import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { Trans, useTranslation } from 'react-i18next';

import type { PersonalAccessTokensDialog } from '../logic/usePersonalAccessTokens';

type PersonalAccessTokenDialogProps = {
	dialog: PersonalAccessTokensDialog;
	userId: string | undefined;
	onConfirm: () => Promise<void>;
	onDismiss: () => void;
};

const PersonalAccessTokenDialog = ({ dialog, userId, onConfirm, onDismiss }: PersonalAccessTokenDialogProps) => {
	const { t } = useTranslation();

	switch (dialog.type) {
		case 'confirm-regenerate':
			return (
				<GenericModal
					variant='warning'
					confirmText={t('API_Personal_Access_Tokens_Regenerate_It')}
					onConfirm={onConfirm}
					onCancel={onDismiss}
					onClose={onDismiss}
				>
					{t('API_Personal_Access_Tokens_Regenerate_Modal')}
				</GenericModal>
			);

		case 'confirm-remove':
			return (
				<GenericModal variant='danger' confirmText={t('Remove')} onConfirm={onConfirm} onCancel={onDismiss} onClose={onDismiss}>
					{t('API_Personal_Access_Tokens_Remove_Modal')}
				</GenericModal>
			);

		case 'token-generated':
			return (
				<GenericModal title={t('API_Personal_Access_Token_Generated')} onConfirm={onDismiss} onClose={onDismiss}>
					<Box>
						<Trans i18nKey='API_Personal_Access_Token_Generated_Text_Token_s_UserId_s' values={{ token: dialog.token, userId }} />
					</Box>
				</GenericModal>
			);
	}
};

export default PersonalAccessTokenDialog;
