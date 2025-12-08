import {
	ContextualbarTitle,
	ContextualbarHeader,
	ContextualbarClose,
	ContextualbarScrollableContent,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { PriorityFormData } from './PriorityEditForm';
import PriorityEditFormWithData from './PriorityEditFormWithData';

type PriorityListProps = {
	context: 'edit';
	priorityId: string;
	onSave: (data: PriorityFormData) => Promise<void>;
	onClose: () => void;
};

const PriorityList = ({ priorityId, onClose, onSave }: PriorityListProps): ReactElement | null => {
	const { t } = useTranslation();

	return (
		<ContextualbarDialog onClose={onClose}>
			<ContextualbarHeader>
				<ContextualbarTitle>{t('Edit_Priority')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent height='100%'>
				<PriorityEditFormWithData priorityId={priorityId} onSave={onSave} onCancel={onClose} />
			</ContextualbarScrollableContent>
		</ContextualbarDialog>
	);
};

export default PriorityList;
