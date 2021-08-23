import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo } from 'react';

import { useSetModal } from '../../../client/contexts/ModalContext';
import { useTranslation } from '../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../client/hooks/useEndpointData';
import CloseToSeatsCapModal from '../views/admin/users/CloseToSeatsCapModal';
import ReachedSeatsCapModal from '../views/admin/users/ReachedSeatsCapModal';

type UseSeatsLimitReturn = {
	shouldShowVerticalBar: boolean;
	handleLimitModal: (action: () => void, actionType: string) => void;
	members: number;
	limit: number;
};

export const useSeatsCapUsage = (context: string): UseSeatsLimitReturn => {
	const t = useTranslation();
	const setModal = useSetModal();

	// const { members, limit } = useSeatsData();
	const { value } = useEndpointData('licenses.maxActiveUsers');
	const { maxActiveUsers = 0, activeUsers = 0 } = value || {};

	const limit = maxActiveUsers || 0;

	const percentage = limit ? (100 / limit) * activeUsers : 0;

	const closeToLimit = percentage >= 80;
	const reachedLimit = percentage >= 100;

	const closeModal = (): void => setModal();

	const shouldShowVerticalBar = !reachedLimit || !['new', 'invite'].includes(context);

	const handleLimitModal: UseSeatsLimitReturn['handleLimitModal'] = useMutableCallback(
		(action, actionType = 'add') => {
			if (!maxActiveUsers) {
				action();
			}

			const handleAction = (): void => {
				action();
				closeModal();
			};

			if (reachedLimit) {
				return setModal(
					<ReachedSeatsCapModal
						members={activeUsers}
						limit={limit}
						onClose={closeModal}
						requestSeatsLink={''}
					/>,
				);
			}

			if (closeToLimit) {
				if (actionType === 'add') {
					return setModal(
						<CloseToSeatsCapModal
							members={activeUsers}
							limit={limit}
							title={t('Create_new_members')}
							confirmText={t('Create')}
							confirmIcon={'user-plus'}
							onConfirm={handleAction}
							onClose={closeModal}
							// TODO SEATS LINK
							// TODO SEATS LINK
							// TODO SEATS LINK
							// TODO SEATS LINK
							// TODO SEATS LINK
							// TODO SEATS LINK
							requestSeatsLink={''}
						/>,
					);
				}
				setModal(
					<CloseToSeatsCapModal
						members={activeUsers}
						limit={limit}
						title={t('Invite_Users')}
						confirmText={t('Invite')}
						confirmIcon={'mail'}
						onConfirm={handleAction}
						onClose={closeModal}
						// TODO SEATS LINK
						// TODO SEATS LINK
						// TODO SEATS LINK
						// TODO SEATS LINK
						// TODO SEATS LINK
						// TODO SEATS LINK
						requestSeatsLink={''}
					/>,
				);
			}
		},
	);

	return useMemo(
		() => ({
			shouldShowVerticalBar,
			handleLimitModal,
			members: activeUsers,
			limit,
		}),
		[shouldShowVerticalBar, handleLimitModal, activeUsers, limit],
	);
};
