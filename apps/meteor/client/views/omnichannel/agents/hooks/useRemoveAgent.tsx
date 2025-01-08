import type { ILivechatAgent } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useTranslation, useRouter, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';

import GenericModal from '../../../../components/GenericModal';

export const useRemoveAgent = (uid: ILivechatAgent['_id']) => {
	const t = useTranslation();
	const router = useRouter();
	const setModal = useSetModal();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();

	const deleteAction = useEndpoint('DELETE', '/v1/livechat/users/agent/:_id', { _id: uid });

	const handleDelete = useEffectEvent(() => {
		const onDeleteAgent = async () => {
			try {
				await deleteAction();
				dispatchToastMessage({ type: 'success', message: t('Agent_removed') });
				router.navigate('/omnichannel/agents');
				queryClient.invalidateQueries({
					queryKey: ['livechat-agents'],
				});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal();
			}
		};

		setModal(
			<GenericModal
				data-qa-id='remove-agent-modal'
				variant='danger'
				onConfirm={onDeleteAgent}
				onCancel={() => setModal()}
				confirmText={t('Delete')}
			/>,
		);
	});

	return handleDelete;
};
