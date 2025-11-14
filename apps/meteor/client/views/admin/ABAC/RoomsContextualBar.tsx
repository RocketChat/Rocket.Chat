import { ContextualbarTitle } from '@rocket.chat/fuselage';
import { useEndpoint, useRouteParameter, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import AdminABACRoomForm from './AdminABACRoomForm';
import { ContextualbarClose, ContextualbarHeader } from '../../../components/Contextualbar';
import { ABACQueryKeys } from '../../../lib/queryKeys';

type RoomsContextualBarProps = {
	attributeId?: string;
	attributeData?: {
		key: string;
		values: string[];
		usage: Record<string, boolean>;
	};
	onClose: () => void;
};

const RoomsContextualBar = ({ attributeData, onClose }: RoomsContextualBarProps) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const methods = useForm<{
		room: string;
		attributes: { key: string; values: string[] }[];
	}>({
		defaultValues: {
			room: '',
			attributes: [{ key: '', values: [] }],
		},
	});

	const { getValues } = methods;

	const attributeId = useRouteParameter('id');
	const createABACRoom = useEndpoint('POST', '/v1/abac/rooms/:rid/attributes', { rid: getValues('room') });
	const updateABACRoom = useEndpoint('PUT', '/v1/abac/rooms/:rid/attributes', {
		rid: getValues('room'),
	});

	const dispatchToastMessage = useToastMessageDispatch();

	const saveMutation = useMutation({
		mutationFn: async (data: { room: string; attributes: { key: string; values: string[] }[] }) => {
			const payload = {
				attributes: data.attributes.reduce((acc: Record<string, string[]>, attribute) => {
					acc[attribute.key] = attribute.values;
					return acc;
				}, {}),
			};
			if (attributeId) {
				await updateABACRoom(payload);
			} else {
				await createABACRoom(payload);
			}
		},
		onSuccess: () => {
			if (attributeId) {
				dispatchToastMessage({ type: 'success', message: t('ABAC_Room_updated', { attributeName: getValues('room') }) });
			} else {
				dispatchToastMessage({ type: 'success', message: t('ABAC_Room_created', { attributeName: getValues('room') }) });
			}
			onClose();
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ABACQueryKeys.rooms.all() });
		},
	});

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarTitle>{t(attributeId ? 'ABAC_Edit_Room' : 'ABAC_New_Room')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<FormProvider {...methods}>
				<AdminABACRoomForm onSave={(values) => saveMutation.mutateAsync(values)} onClose={onClose} />
			</FormProvider>
		</>
	);
};

export default RoomsContextualBar;
