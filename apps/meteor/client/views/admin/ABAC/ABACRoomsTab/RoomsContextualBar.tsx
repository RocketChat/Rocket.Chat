import { ContextualbarClose, ContextualbarHeader, ContextualbarTitle } from '@rocket.chat/ui-client';
import { useRouteParameter } from '@rocket.chat/ui-contexts';
import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import RoomForm from './RoomForm';
import { useAbacAttributeEditFlow } from '../../../../components/ABAC/AbacAttributeEditor/useAbacAttributeEditFlow';

export type RoomsContextualBarProps = {
	attributeId?: string;
	roomInfo?: { rid: string; name: string };
	attributesData?: { key: string; values: string[] }[];
	redacted?: boolean;

	onClose: () => void;
};

const RoomsContextualBar = ({ roomInfo, attributesData, redacted = false, onClose }: RoomsContextualBarProps) => {
	const { t } = useTranslation();

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

	const rid = watch('room');
	const attributes = watch('attributes');

	const attributeMap = useMemo(
		() =>
			Object.fromEntries(attributes.filter(({ key, values }) => key && values.length).map(({ key, values }) => [key, values])) as Record<
				string,
				string[]
			>,
		[attributes],
	);

	// ABAC-P4 M3 — the primary action is Next, not Save: an attribute change is only committed
	// after its membership impact has been shown and confirmed. The same flow backs the room's own
	// Edit channel panel (Board 2 and Board 1 are one component).
	const editFlow = useAbacAttributeEditFlow({
		rid,
		roomName: roomInfo?.name ?? selectedRoomLabel,
		attributes: attributeMap,
		successMessage: attributeId
			? t('ABAC_Room_updated', { roomName: roomInfo?.name ?? selectedRoomLabel })
			: t('ABAC_Room_created', { roomName: selectedRoomLabel }),
		onSaved: onClose,
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
					onClose={onClose}
					setSelectedRoomLabel={setSelectedRoomLabel}
					redacted={redacted}
					editFlow={editFlow}
				/>
			</FormProvider>
		</>
	);
};

export default RoomsContextualBar;
