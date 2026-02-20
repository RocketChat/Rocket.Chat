import { ContextualbarTitle } from '@rocket.chat/fuselage';
import { ContextualbarClose, ContextualbarHeader } from '@rocket.chat/ui-client';
import { useEndpoint, useRouteParameter, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import RoomForm from './RoomForm';
import { ABACQueryKeys } from '../../../../lib/queryKeys';

type RoomsContextualBarProps = {
	attributeId?: string;
	roomInfo?: { rid: string; name: string };
	attributesData?: { key: string; values: string[] }[];

	onClose: () => void;
};

const RoomsContextualBar = ({ roomInfo, attributesData, onClose }: RoomsContextualBarProps) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const methods = useForm<{
		room: string;
		attributes: { key: string; values: string[] }[];
	}>({
		defaultValues: {
			room: roomInfo?.rid || '',
			attributes: attributesData ?? [{ key: '', values: [] }],
		},
		mode: 'onChange',
	});

	const { watch } = methods;

	const [selectedRoomLabel, setSelectedRoomLabel] = useState<string>('');

	const attributeId = useRouteParameter('id');
	const createOrUpdateABACRoom = useEndpoint('POST', '/v1/abac/rooms/:rid/attributes', { rid: watch('room') });

	const dispatchToastMessage = useToastMessageDispatch();

	const saveMutation = useMutation({
		mutationFn: async (data: { room: string; attributes: { key: string; values: string[] }[] }) => {
			const payload = {
				attributes: data.attributes.reduce((acc: Record<string, string[]>, attribute) => {
					acc[attribute.key] = attribute.values;
					return acc;
				}, {}),
			};

			await createOrUpdateABACRoom(payload);
		},
		onSuccess: () => {
			if (attributeId) {
				dispatchToastMessage({ type: 'success', message: t('ABAC_Room_updated', { roomName: selectedRoomLabel }) });
			} else {
				dispatchToastMessage({ type: 'success', message: t('ABAC_Room_created', { roomName: selectedRoomLabel }) });
			}
			onClose();
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ABACQueryKeys.rooms.list() });
		},
	});

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarTitle>{t(attributeId ? 'ABAC_Edit_Room' : 'ABAC_Add_room')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<FormProvider {...methods}>
				<RoomForm
					roomInfo={roomInfo}
					onSave={(values) => saveMutation.mutateAsync(values)}
					onClose={onClose}
					setSelectedRoomLabel={setSelectedRoomLabel}
				/>
			</FormProvider>
		</>
	);
};

export default RoomsContextualBar;
