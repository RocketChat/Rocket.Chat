import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { usePermission } from '../../../../../../../client/contexts/AuthorizationContext';
import { useSetModal } from '../../../../../../../client/contexts/ModalContext';
import { useEndpoint } from '../../../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../../../client/contexts/TranslationContext';
import { useForm } from '../../../../../../../client/hooks/useForm';
import CreateCannedResponseModal from './CreateCannedResponseModal';

const WrapCreateCannedResponseModal: FC<{ data?: any; reloadCannedList?: any }> = ({
	data,
	reloadCannedList,
}) => {
	const t = useTranslation();
	const closeModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const saveCannedResponse = useEndpoint('POST', 'canned-responses');

	const hasManagerPermission = usePermission('view-all-canned-responses');

	const form = useForm({
		_id: data ? data._id : '',
		shortcut: data ? data.shortcut : '',
		text: data ? data.text : '',
		tags: data && data.tags ? data.tags : [],
		scope: data ? data.scope : 'user',
		departmentId: data && data.departmentId ? data.departmentId : '',
	});

	const { values, handlers, hasUnsavedChanges } = form;

	const [errors, setErrors] = useState<any>({});
	const [radioDescription, setRadioDescription] = useState<string>(
		t('Canned_Response_Sharing_Private_Description'),
	);
	const [preview, setPreview] = useState(false);

	const listErrors = useMemo(() => {
		const empty: any = {};

		for (const [key, value] of Object.entries(values)) {
			if (['shortcut', 'text'].includes(key) && !value) {
				empty[key] = t('Field_required');
			}
		}

		if (values.scope === 'department' && !values.departmentId) {
			empty.departmentId = t('Field_required');
		}

		return empty;
	}, [t, values]);

	useEffect(() => {
		setErrors(listErrors);
	}, [values.shortcut, values.text, values.departmentId, listErrors]);

	const radioHandlers = {
		setPublic: (): void => {
			handlers.handleScope('global');
			handlers.handleDepartmentId('');
			setRadioDescription(t('Canned_Response_Sharing_Public_Description'));
		},
		setDepartment: (): void => {
			handlers.handleScope('department');
			setRadioDescription(t('Canned_Response_Sharing_Department_Description'));
		},
		setPrivate: (): void => {
			handlers.handleScope('user');
			handlers.handleDepartmentId('');
			setRadioDescription(t('Canned_Response_Sharing_Private_Description'));
		},
	};

	const onSave = useCallback(async (): Promise<void> => {
		try {
			const { _id, shortcut, text, scope, tags, departmentId } = values as {
				_id: string;
				shortcut: string;
				text: string;
				scope: string;
				tags: any;
				departmentId: { value: string; label: string };
			};
			await saveCannedResponse({
				...(_id && { _id }),
				shortcut,
				text,
				scope,
				...(tags.length > 0 && { tags }),
				...(departmentId && { departmentId: departmentId.value }),
			});
			dispatchToastMessage({ type: 'success', message: t('Canned_Response_Created') });
			closeModal(null);
			reloadCannedList && reloadCannedList();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [values, saveCannedResponse, dispatchToastMessage, t, closeModal, reloadCannedList]);

	const onPreview = (): void => {
		setPreview(!preview);
	};

	return (
		<CreateCannedResponseModal
			isManager={hasManagerPermission}
			values={values}
			handlers={handlers}
			errors={errors}
			hasUnsavedChanges={hasUnsavedChanges}
			radioHandlers={radioHandlers}
			radioDescription={radioDescription}
			onClose={closeModal}
			onSave={onSave}
			onPreview={onPreview}
			previewState={preview}
		/>
	);
};

export default memo(WrapCreateCannedResponseModal);
