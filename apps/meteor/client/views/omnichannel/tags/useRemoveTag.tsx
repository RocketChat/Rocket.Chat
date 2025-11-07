import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch, useRouter, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const useRemoveTag = () => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const removeTag = useEndpoint('POST', '/v1/livechat/tags.delete');
	const queryClient = useQueryClient();
	const router = useRouter();

	const handleDeleteTag = useEffectEvent((tagId: string) => {
		const handleDelete = async () => {
			try {
				await removeTag({ id: tagId });
				dispatchToastMessage({ type: 'success', message: t('Tag_removed') });
				router.navigate('/omnichannel/tags');
				queryClient.invalidateQueries({
					queryKey: ['livechat-tags'],
				});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal();
			}
		};

		setModal(<GenericModal variant='danger' onConfirm={handleDelete} onCancel={() => setModal()} confirmText={t('Delete')} />);
	});

	return handleDeleteTag;
};
