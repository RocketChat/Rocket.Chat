import { ContextualbarBack, ContextualbarClose, ContextualbarHeader, ContextualbarTitle } from '@rocket.chat/ui-client';
import { useEndpoint, useRouteParameter, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import RoomForm from './RoomForm';
import AbacRoomMembershipPreview from '../../../../components/ABAC/AbacRoomMembershipPreview/AbacRoomMembershipPreview';
import { hasAttributeChanges } from '../../../../components/ABAC/hasAttributeChanges';
import { ABACQueryKeys } from '../../../../lib/queryKeys';

export type RoomsContextualBarProps = {
	attributeId?: string;
	roomInfo?: { rid: string; name: string };
	attributesData?: { key: string; values: string[] }[];
	redacted?: boolean;

	onClose: () => void;
};

type AttributeRows = { key: string; values: string[] }[];

const toAttributeRecord = (rows: AttributeRows) =>
	rows.reduce((acc: Record<string, string[]>, attribute) => {
		acc[attribute.key] = attribute.values;
		return acc;
	}, {});

const RoomsContextualBar = ({ roomInfo, attributesData, redacted = false, onClose }: RoomsContextualBarProps) => {
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

	const { watch, control } = methods;

	const [selectedRoomLabel, setSelectedRoomLabel] = useState<string>('');
	const [previewAttributes, setPreviewAttributes] = useState<Record<string, string[]>>();

	const attributes = useWatch({ control, name: 'attributes' });
	const attributesChanged = hasAttributeChanges(attributes, attributesData);

	const attributeId = useRouteParameter('id');
	const createOrUpdateABACRoom = useEndpoint('POST', '/v1/abac/rooms/:rid/attributes', { rid: watch('room') });

	const dispatchToastMessage = useToastMessageDispatch();

	const saveMutation = useMutation({
		mutationFn: async (payload: Record<string, string[]>) => {
			await createOrUpdateABACRoom({ attributes: payload });
		},
		onSuccess: () => {
			if (attributeId) {
				dispatchToastMessage({ type: 'success', message: t('ABAC_Room_attributes_updated') });
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

	const isPreviewing = !!roomInfo && !!previewAttributes;

	const getTitle = () => {
		if (isPreviewing) {
			return t('ABAC_Members_preview');
		}
		return t(attributeId ? 'ABAC_Edit_Room' : 'ABAC_Add_room');
	};

	return (
		<>
			<ContextualbarHeader>
				{isPreviewing && <ContextualbarBack onClick={() => setPreviewAttributes(undefined)} />}
				<ContextualbarTitle>{getTitle()}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<FormProvider {...methods}>
				{isPreviewing ? (
					<AbacRoomMembershipPreview
						rid={roomInfo.rid}
						roomName={roomInfo.name}
						attributes={previewAttributes}
						onBack={() => setPreviewAttributes(undefined)}
						onSave={() => saveMutation.mutateAsync(previewAttributes)}
					/>
				) : (
					<RoomForm
						roomInfo={roomInfo}
						hasAttributeChanges={attributesChanged}
						onSave={(values) => {
							if (roomInfo) {
								setPreviewAttributes(toAttributeRecord(values.attributes));
								return;
							}
							return saveMutation.mutateAsync(toAttributeRecord(values.attributes));
						}}
						onClose={onClose}
						setSelectedRoomLabel={setSelectedRoomLabel}
						redacted={redacted}
					/>
				)}
			</FormProvider>
		</>
	);
};

export default RoomsContextualBar;
