import type { ISidebarFilter } from '@rocket.chat/core-typings';
import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { useDeleteFilter } from '../hooks/useFilterMutations';

type DeleteFilterModalProps = {
	filter: ISidebarFilter;
	onClose: () => void;
};

const DeleteFilterModal = ({ filter, onClose }: DeleteFilterModalProps) => {
	const { t } = useTranslation();
	const deleteFilter = useDeleteFilter();

	const handleConfirm = async () => {
		await deleteFilter.mutateAsync({ filterId: filter._id });
		onClose();
	};

	return (
		<GenericModal
			variant='danger'
			title={t('Delete_filter')}
			confirmText={t('Delete')}
			confirmLoading={deleteFilter.isPending}
			onConfirm={handleConfirm}
			onCancel={onClose}
		>
			{t('Delete_filter_description', { name: filter.name })}
		</GenericModal>
	);
};

export default DeleteFilterModal;
