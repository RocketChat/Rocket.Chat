import type { ISidebarFilter, ISubscriptionLabel } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import DeleteFilterModal from '../modals/DeleteFilterModal';
import DeleteLabelModal from '../modals/DeleteLabelModal';
import FilterFormModal from '../modals/FilterFormModal';
import LabelFormModal from '../modals/LabelFormModal';
import ManageLabelsModal from '../modals/ManageLabelsModal';
import SubscriptionLabelsModal from '../modals/SubscriptionLabelsModal';

export const useFilterModals = () => {
	const setModal = useSetModal();

	return useMemo(() => {
		const onClose = () => setModal(null);

		// Editing or deleting a label from the manage list brings the user back to that list afterwards.
		const openManageLabels = () =>
			setModal(
				<ManageLabelsModal
					onCreate={() => setModal(<LabelFormModal onClose={openManageLabels} />)}
					onEdit={(label: ISubscriptionLabel) => setModal(<LabelFormModal label={label} onClose={openManageLabels} />)}
					onDelete={(label: ISubscriptionLabel) => setModal(<DeleteLabelModal label={label} onClose={openManageLabels} />)}
					onClose={onClose}
				/>,
			);

		return {
			openSubscriptionLabels: (rid: string) => setModal(<SubscriptionLabelsModal rid={rid} onClose={onClose} />),
			openManageLabels,
			openCreateFilter: () => setModal(<FilterFormModal onClose={onClose} />),
			openEditFilter: (filter: ISidebarFilter) => setModal(<FilterFormModal filter={filter} onClose={onClose} />),
			openDeleteFilter: (filter: ISidebarFilter) => setModal(<DeleteFilterModal filter={filter} onClose={onClose} />),
		};
	}, [setModal]);
};
