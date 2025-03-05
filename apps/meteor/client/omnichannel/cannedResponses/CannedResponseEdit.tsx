import type { ILivechatDepartment, IOmnichannelCannedResponse, Serialized } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useEndpoint, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useId, memo, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import CannedResponseForm from './components/CannedResponseForm';
import { useRemoveCannedResponse } from './useRemoveCannedResponse';
import { Page, PageHeader, PageScrollableContentWithShadow, PageFooter } from '../../components/Page';

export type CannedResponseEditFormData = {
	_id: string;
	shortcut: string;
	text: string;
	tags: string[];
	scope: string;
	departmentId: string;
};

type CannedResponseEditProps = {
	cannedResponseData?: Serialized<IOmnichannelCannedResponse>;
	departmentData?: Serialized<ILivechatDepartment>;
};

const getInitialData = (cannedResponseData: Serialized<IOmnichannelCannedResponse> | undefined) => ({
	_id: cannedResponseData?._id || '',
	shortcut: cannedResponseData?.shortcut || '',
	text: cannedResponseData?.text || '',
	tags: cannedResponseData?.tags || [],
	scope: cannedResponseData?.scope || 'user',
	departmentId: cannedResponseData?.departmentId || '',
});

const CannedResponseEdit = ({ cannedResponseData }: CannedResponseEditProps) => {
	const t = useTranslation();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const saveCannedResponse = useEndpoint('POST', '/v1/canned-responses');

	const methods = useForm<CannedResponseEditFormData>({ defaultValues: getInitialData(cannedResponseData) });

	const {
		handleSubmit,
		reset,
		formState: { isDirty },
	} = methods;

	const handleDelete = useRemoveCannedResponse();

	const handleSave = useCallback(
		async ({ departmentId, ...data }: CannedResponseEditFormData) => {
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
				router.navigate('/omnichannel/canned-responses');
				queryClient.invalidateQueries({
					queryKey: ['getCannedResponses'],
				});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[cannedResponseData?._id, queryClient, saveCannedResponse, dispatchToastMessage, t, router],
	);
	const formId = useId();

	return (
		<Page>
			<PageHeader
				title={cannedResponseData?._id ? t('Edit_CannedResponse') : t('New_CannedResponse')}
				onClickBack={() => router.navigate('/omnichannel/canned-responses')}
			>
				{cannedResponseData?._id && (
					<ButtonGroup>
						<Button danger onClick={() => handleDelete(cannedResponseData._id)}>
							{t('Delete')}
						</Button>
					</ButtonGroup>
				)}
			</PageHeader>
			<PageScrollableContentWithShadow>
				<FormProvider {...methods}>
					<Box id={formId} onSubmit={handleSubmit(handleSave)} w='full' alignSelf='center' maxWidth='x600' is='form' autoComplete='off'>
						<CannedResponseForm />
					</Box>
				</FormProvider>
			</PageScrollableContentWithShadow>
			<PageFooter isDirty={isDirty}>
				<ButtonGroup>
					<Button onClick={() => reset()}>{t('Cancel')}</Button>
					<Button form={formId} primary type='submit'>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</PageFooter>
		</Page>
	);
};

export default memo(CannedResponseEdit);
