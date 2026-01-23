import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const useRemoveBusinessHour = () => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const removeBusinessHour = useEndpoint('POST', '/v1/livechat/business-hours.remove');
	const queryClient = useQueryClient();

	const handleRemove = useEffectEvent((_id: string, type: string) => {
		const onDeleteBusinessHour = async () => {
			try {
				await removeBusinessHour({ _id, type });
				dispatchToastMessage({ type: 'success', message: t('Business_Hour_Removed') });
				queryClient.invalidateQueries({
					queryKey: ['livechat-getBusinessHours'],
				});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal();
			}
		};

		setModal(<GenericModal variant='danger' onConfirm={onDeleteBusinessHour} onCancel={() => setModal()} confirmText={t('Delete')} />);
	});

	return handleRemove;
};
