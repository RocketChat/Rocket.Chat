import { Box } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { Trans, useTranslation } from 'react-i18next';

import UserPresenceConfirmModal from './UserPresenceConfirmModal';
import { useApplyUserPresenceRules } from './useApplyUserPresenceRules';
import type { ManagedPresenceUser } from './useManagedPresenceUsers';

export const useResetUserPresenceRules = () => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const applyRules = useApplyUserPresenceRules();

	return useStableCallback(({ _id, username = '' }: Pick<ManagedPresenceUser, '_id' | 'username'>, onReset?: () => void) => {
		const handleConfirm = async () => {
			const applied = await applyRules(
				_id,
				{ presenceEnabled: true, hiddenFrom: [], statusText: '' },
				t('Status_settings_removed', { name: username }),
			);

			if (applied) {
				onReset?.();
			}

			return applied;
		};

		setModal(
			<UserPresenceConfirmModal
				title={t('Remove_user_status_settings')}
				description={
					<Trans
						i18nKey='Remove_user_status_settings_description'
						values={{ name: username }}
						components={{ bold: <Box is='span' fontWeight='bold' /> }}
					/>
				}
				confirmText={t('Reset')}
				icon={null}
				onConfirm={handleConfirm}
				onClose={() => setModal(null)}
			/>,
		);
	});
};
