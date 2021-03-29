import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useCannedResponses } from './useCannedResponses';

export const withData = (Component) => {
	const WrappedComponent = ({ departmentId, onClose }) => {
		const [filter, setFilter] = useState('');
		const dispatchToastMessage = useToastMessageDispatch();
		const t = useTranslation();

		const handleFilter = useMutableCallback((e) => {
			setFilter(e.currentTarget.value);
		});

		const responses = useCannedResponses(filter, departmentId);

		const save = useMethod('saveCannedResponse');

		const onSave = useMutableCallback(async (data, _id) => {
			try {
				await save(_id, {
					...data,
					...(departmentId && {
						departmentId,
						scope: 'department',
					}),
					...(!departmentId && {
						scope: 'user',
					}),
				});

				dispatchToastMessage({ type: 'success', message: t('Saved') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		});

		return (
			<Component
				onChangeFilter={handleFilter}
				filter={filter}
				onClose={onClose}
				responses={responses}
				onSave={onSave}
			/>
		);
	};

	WrappedComponent.displayName = `withData(${
		Component.displayName ?? Component.name ?? 'Component'
	})`;

	return WrappedComponent;
};
