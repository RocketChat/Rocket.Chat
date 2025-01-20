import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRouter, useMethod } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../components/GenericModal';

export const useRemoveTag = () => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const removeTag = useMethod('livechat:removeTag');
	const queryClient = useQueryClient();
	const router = useRouter();

	const handleDeleteTag = useEffectEvent((tagId: string) => {
		const handleDelete = async () => {
			try {
				await removeTag(tagId);
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
