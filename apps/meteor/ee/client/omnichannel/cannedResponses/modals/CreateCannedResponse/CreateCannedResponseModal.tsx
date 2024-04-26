import type { ILivechatDepartment, IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import GenericModal from '../../../../../../client/components/GenericModal';
import CannedResponseForm from '../../components/cannedResponseForm';

const getInitialData = (
	cannedResponseData: (IOmnichannelCannedResponse & { departmentName: ILivechatDepartment['name'] }) | undefined,
) => ({
	_id: cannedResponseData?._id || '',
	shortcut: cannedResponseData?.shortcut || '',
	text: cannedResponseData?.text || '',
	tags:
		cannedResponseData?.tags && Array.isArray(cannedResponseData.tags)
			? cannedResponseData.tags.map((tag: string) => ({ label: tag, value: tag }))
			: [],
	scope: cannedResponseData?.scope || 'user',
	departmentId: cannedResponseData?.departmentId || '',
});

const CreateCannedResponseModal = ({
	cannedResponseData,
	onClose,
	reloadCannedList,
}: {
	cannedResponseData?: IOmnichannelCannedResponse & { departmentName: ILivechatDepartment['name'] };
	onClose: () => void;
	reloadCannedList: () => void;
}) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const methods = useForm({ defaultValues: getInitialData(cannedResponseData) });
	const {
		handleSubmit,
		formState: { isDirty },
	} = methods;

	const saveCannedResponse = useEndpoint('POST', '/v1/canned-responses');

	const handleCreate = useCallback(
		async ({ departmentId, ...data }) => {
			try {
				await saveCannedResponse({
					_id: cannedResponseData?._id,
					...data,
					...(departmentId && { departmentId }),
				});
				dispatchToastMessage({
					type: 'success',
					message: t(cannedResponseData?._id ? 'Canned_Response_Updated' : 'Canned_Response_Created'),
				});
				onClose();
				reloadCannedList?.();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[cannedResponseData?._id, saveCannedResponse, onClose, dispatchToastMessage, t, reloadCannedList],
	);

	return (
		<GenericModal
			icon={null}
			variant='warning'
			onCancel={onClose}
			confirmText={t('Save')}
			confirmDisabled={!isDirty}
			title={cannedResponseData?._id ? t('Edit_Canned_Response') : t('Create_canned_response')}
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handleCreate)} {...props} />}
		>
			<FormProvider {...methods}>
				<CannedResponseForm />
			</FormProvider>
		</GenericModal>
	);
};

export default memo(CreateCannedResponseModal);
