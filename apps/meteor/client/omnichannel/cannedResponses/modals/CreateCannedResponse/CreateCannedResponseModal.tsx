import type { ILivechatDepartment, IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { memo, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../../components/GenericModal';
import CannedResponseForm from '../../components/CannedResponseForm';

export type CreateCannedResponseModalFormData = {
	_id: string;
	shortcut: string;
	text: string;
	tags: {
		label: string;
		value: string;
	}[];
	scope: string;
	departmentId: string;
};

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

type CreateCannedResponseModalProps = {
	cannedResponseData?: IOmnichannelCannedResponse & { departmentName: ILivechatDepartment['name'] };
	onClose: () => void;
	reloadCannedList: () => void;
};

const CreateCannedResponseModal = ({ cannedResponseData, onClose, reloadCannedList }: CreateCannedResponseModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const methods = useForm<CreateCannedResponseModalFormData>({ defaultValues: getInitialData(cannedResponseData) });
	const {
		handleSubmit,
		formState: { isDirty },
	} = methods;

	const saveCannedResponse = useEndpoint('POST', '/v1/canned-responses');

	const handleCreate = useCallback(
		async ({ departmentId, ...data }: CreateCannedResponseModalFormData) => {
			try {
				await saveCannedResponse({
					...data,
					_id: cannedResponseData?._id ?? data._id,
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
