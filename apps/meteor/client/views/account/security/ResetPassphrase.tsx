import { Box, Button } from '@rocket.chat/fuselage';
import { imperativeModal } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { generatePassphrase } from '../../../lib/e2ee/passphrase';
import SaveE2EPasswordModal from '../../e2e/SaveE2EPasswordModal';
import { useChangeE2EPasswordMutation } from '../../hooks/useChangeE2EPasswordMutation';
import { useResetE2EPasswordMutation } from '../../hooks/useResetE2EPasswordMutation';
import { useE2EEState } from '../../room/hooks/useE2EEState';

export const ResetPassphrase = (): JSX.Element => {
	const { t } = useTranslation();
	const resetE2EPassword = useResetE2EPasswordMutation();
	const changeE2EPassphrase = useChangeE2EPasswordMutation();
	const e2eState = useE2EEState();

	const hasKeys = e2eState === 'READY' || e2eState === 'SAVE_PASSWORD';

	return (
		<Box>
			<Box is='h4' fontScale='h4' mbe={12}>
				{t('Reset_E2EE_password')}
			</Box>
			<Box is='p' fontScale='p1' mbe={12}>
				{t('Reset_E2EE_password_description')}
			</Box>
			<Button onClick={() => resetE2EPassword.mutate()} data-qa-type='e2e-encryption-reset-key-button'>
				{t('Reset_E2EE_password')}
			</Button>
			{hasKeys && (
				<Button
					onClick={() => {
						const passphrase = generatePassphrase();
						imperativeModal.open({
							component: SaveE2EPasswordModal,
							props: {
								randomPassword: passphrase,
								onClose: imperativeModal.close,
								onCancel: imperativeModal.close,
								onConfirm: () => {
									changeE2EPassphrase.mutate(passphrase);
									imperativeModal.close();
								},
							},
						});
					}}
					data-qa-type='e2e-encryption-change-key-button'
				>
					{t('Change_E2EE_password')}
				</Button>
			)}
		</Box>
	);
};
