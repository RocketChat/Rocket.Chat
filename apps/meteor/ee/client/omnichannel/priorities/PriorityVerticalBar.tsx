import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { Verticalbar, VerticalbarHeader, VerticalbarClose, VerticalbarScrollableContent } from '../../../../client/components/Contextualbar';
import type { PriorityFormData } from './PriorityEditForm';
import PriorityEditFormWithData from './PriorityEditFormWithData';

type PriorityVerticalBarProps = {
	context: 'edit';
	priorityId: string;
	onSave: (data: PriorityFormData) => Promise<void>;
	onClose: () => void;
};

export const PriorityVerticalBar = ({ priorityId, onClose, onSave }: PriorityVerticalBarProps): ReactElement | null => {
	const t = useTranslation();

	return (
		<Verticalbar>
			<VerticalbarHeader>
				{t('Edit_Priority')}
				<VerticalbarClose onClick={onClose} />
			</VerticalbarHeader>
			<VerticalbarScrollableContent height='100%'>
				<PriorityEditFormWithData priorityId={priorityId} onSave={onSave} onCancel={onClose} />
			</VerticalbarScrollableContent>
		</Verticalbar>
	);
};
