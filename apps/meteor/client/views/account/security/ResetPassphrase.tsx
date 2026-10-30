import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useUserId } from '@rocket.chat/ui-contexts';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ResetPassphraseSection from './layout/ResetPassphraseSection';
import { e2eSearchIndexRuntime } from '../../../lib/e2ee/rocketchat.e2e';
import { useResetE2EPasswordMutation } from '../../hooks/useResetE2EPasswordMutation';

export const ResetPassphrase = () => {
	const { t } = useTranslation();
	const userId = useUserId();
	const currentUserId = useRef(userId);
	currentUserId.current = userId;
	const submitted = useRef(false);
	const resetFor = useRef(userId);
	const [confirming, setConfirming] = useState(false);
	const resetE2eKey = useEndpoint('POST', '/v1/users.resetE2EKey');
	const resetE2EPassword = useResetE2EPasswordMutation({
		options: {
			mutationFn: async () => {
				const userId = resetFor.current;
				if (!userId || currentUserId.current !== userId) throw new Error(t('error-invalid-user'));
				await resetE2eKey({});
				if (currentUserId.current !== userId) throw new Error(t('error-invalid-user'));
				await e2eSearchIndexRuntime.wipe();
				if (currentUserId.current !== userId) throw new Error(t('error-invalid-user'));
			},
		},
	});
	const close = () => {
		if (!submitted.current) setConfirming(false);
	};
	const confirm = () => {
		if (submitted.current) return;
		submitted.current = true;
		resetE2EPassword.mutate(undefined, {
			onSettled: () => {
				submitted.current = false;
				setConfirming(false);
			},
		});
	};

	return (
		<ResetPassphraseSection title={t('Reset_E2EE_password')} description={t('Reset_E2EE_password_description')}>
			<ButtonGroup>
				<Button
					disabled={resetE2EPassword.isPending}
					onClick={() => {
						resetFor.current = userId;
						setConfirming(true);
					}}
				>
					{t('Reset_E2EE_password')}
				</Button>
			</ButtonGroup>
			{confirming && (
				<GenericModal
					variant='danger'
					confirmText={t('Reset')}
					onConfirm={confirm}
					onCancel={resetE2EPassword.isPending ? undefined : close}
					onClose={resetE2EPassword.isPending ? undefined : close}
					confirmDisabled={resetE2EPassword.isPending}
					confirmLoading={resetE2EPassword.isPending}
				>
					{t('Reset_E2EE_password_description')}
				</GenericModal>
			)}
		</ResetPassphraseSection>
	);
};
