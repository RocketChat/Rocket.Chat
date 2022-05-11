import type { ILivechatDepartment, IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { Serialized } from '@rocket.chat/core-typings';
import { Button, ButtonGroup, Icon, FieldGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, usePermission, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, memo, useState, useMemo, useEffect, useCallback } from 'react';

import Page from '../../../../client/components/Page';
import { useForm } from '../../../../client/hooks/useForm';
import CannedResponseForm from './components/cannedResponseForm';

const CannedResponseEdit: FC<{
	data?: {
		cannedResponse: Serialized<IOmnichannelCannedResponse>;
	};
	reload: () => void;
	totalDataReload: () => void;
	isNew?: boolean;
	departmentData?: {
		department: Serialized<ILivechatDepartment>;
	};
}> = ({ data, reload, totalDataReload, isNew = false, departmentData = {} }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const Route = useRoute('omnichannel-canned-responses');

	const handleReturn = useMutableCallback(() =>
		Route.push({
			context: '',
		}),
	);

	const saveCannedResponse = useEndpoint('POST', 'canned-responses');

	const hasManagerPermission = usePermission('view-all-canned-responses');
	const hasMonitorPermission = usePermission('save-department-canned-responses');

	const form = useForm({
		_id: data?.cannedResponse ? data.cannedResponse._id : '',
		shortcut: data ? data.cannedResponse.shortcut : '',
		text: data ? data.cannedResponse.text : '',
		tags:
			data?.cannedResponse?.tags && Array.isArray(data.cannedResponse.tags)
				? data.cannedResponse.tags.map((tag) => ({ label: tag, value: tag }))
				: [],
		scope: data ? data.cannedResponse.scope : 'user',
		departmentId: data?.cannedResponse?.departmentId
			? { value: data.cannedResponse.departmentId, label: departmentData?.department?.name }
			: '',
	});

	const { values, handlers, hasUnsavedChanges } = form;

	const [errors, setErrors] = useState<any>({});
	const [radioDescription, setRadioDescription] = useState<string>(t('Canned_Response_Sharing_Private_Description'));
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
			const mappedTags = tags.map((tag: string | { value: string; label: string }) => (typeof tag === 'object' ? tag?.value : tag));
			await saveCannedResponse({
				...(_id && { _id }),
				shortcut,
				text,
				scope,
				...(mappedTags.length > 0 && { tags: mappedTags }),
				...(departmentId && { departmentId: departmentId.value }),
			});
			dispatchToastMessage({
				type: 'success',
				message: t(_id ? 'Canned_Response_Updated' : 'Canned_Response_Created'),
			});
			Route.push({
				context: '',
			});
			reload();
			totalDataReload();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error as Error });
		}
	}, [values, saveCannedResponse, dispatchToastMessage, t, Route, reload, totalDataReload]);

	const onPreview = (): void => {
		setPreview(!preview);
	};

	const { shortcut, text, scope, departmentId } = values;

	const checkDepartment = scope !== 'department' || (scope === 'department' && departmentId);

	const canSave = shortcut && text && checkDepartment;

	return (
		<Page>
			<Page.Header title={isNew ? t('New_CannedResponse') : t('Edit_CannedResponse')}>
				<ButtonGroup>
					<Button onClick={handleReturn}>
						<Icon name='back' /> {t('Back')}
					</Button>
					<Button primary mie='none' flexGrow={1} disabled={!hasUnsavedChanges || !canSave} onClick={onSave}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow fontScale='p2'>
				<FieldGroup w='full' alignSelf='center' maxWidth='x600' is='form' autoComplete='off'>
					<CannedResponseForm
						isManager={hasManagerPermission}
						isMonitor={hasMonitorPermission}
						values={values}
						handlers={handlers}
						errors={errors}
						radioHandlers={radioHandlers}
						radioDescription={radioDescription}
						onPreview={onPreview}
						previewState={preview}
					></CannedResponseForm>
				</FieldGroup>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default memo(CannedResponseEdit);
