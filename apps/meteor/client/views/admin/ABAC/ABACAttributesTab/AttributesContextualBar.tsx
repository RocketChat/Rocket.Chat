import { ContextualbarTitle } from '@rocket.chat/fuselage';
import { ContextualbarClose, ContextualbarHeader } from '@rocket.chat/ui-client';
import { useEndpoint, useRouteParameter, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { AttributesFormFormData } from './AttributesForm';
import AttributesForm from './AttributesForm';
import { ABACQueryKeys } from '../../../../lib/queryKeys';

type AttributesContextualBarProps = {
	attributeId?: string;
	attributeData?: {
		key: string;
		values: string[];
	};
	onClose: () => void;
};

const AttributesContextualBar = ({ attributeData, onClose }: AttributesContextualBarProps) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const methods = useForm<{
		name: string;
		attributeValues: { value: string }[];
		lockedAttributes: { value: string }[];
	}>({
		defaultValues: attributeData
			? {
					name: attributeData.key,
					attributeValues: [{ value: '' }],
					lockedAttributes: attributeData.values.map((value) => ({ value })),
				}
			: {
					name: '',
					attributeValues: [{ value: '' }],
					lockedAttributes: [],
				},
		mode: 'onChange',
	});

	const { getValues } = methods;

	const attributeId = useRouteParameter('id');
	const createAttribute = useEndpoint('POST', '/v1/abac/attributes');
	const updateAttribute = useEndpoint('PUT', '/v1/abac/attributes/:_id', {
		_id: attributeId ?? '',
	});

	const dispatchToastMessage = useToastMessageDispatch();

	const saveMutation = useMutation({
		mutationFn: async (data: AttributesFormFormData) => {
			const payload = {
				key: data.name,
				values: [...data.lockedAttributes.map((attribute) => attribute.value), ...data.attributeValues.map((attribute) => attribute.value)],
			};
			if (attributeId) {
				await updateAttribute(payload);
			} else {
				await createAttribute(payload);
			}
		},
		onSuccess: () => {
			if (attributeId) {
				dispatchToastMessage({ type: 'success', message: t('ABAC_Attribute_updated', { attributeName: getValues('name') }) });
			} else {
				dispatchToastMessage({ type: 'success', message: t('ABAC_Attribute_created', { attributeName: getValues('name') }) });
			}
			onClose();
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ABACQueryKeys.roomAttributes.list({}) });
		},
	});

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarTitle>{t(attributeId ? 'ABAC_Edit_attribute' : 'ABAC_New_attribute')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<FormProvider {...methods}>
				<AttributesForm
					onSave={(values) => saveMutation.mutateAsync(values)}
					onCancel={onClose}
					description={t(attributeId ? 'ABAC_Edit_attribute_description' : 'ABAC_New_attribute_description')}
				/>
			</FormProvider>
		</>
	);
};

export default AttributesContextualBar;
