import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import VerticalBar from '../../../../client/components/VerticalBar';
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
		<VerticalBar>
			<VerticalBar.Header>
				{t('Edit_Priority')}
				<VerticalBar.Close onClick={onClose} />
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent height='100%'>
				<PriorityEditFormWithData priorityId={priorityId} onSave={onSave} onCancel={onClose} />
			</VerticalBar.ScrollableContent>
		</VerticalBar>
	);
};
