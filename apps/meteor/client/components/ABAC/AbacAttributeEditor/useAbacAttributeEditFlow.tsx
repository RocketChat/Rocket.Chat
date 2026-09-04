import { useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AbacUpdateRoomModal from './AbacUpdateRoomModal';
import { sdk } from '../../../lib/SDKClient';
import { ABACQueryKeys } from '../../../lib/queryKeys';
import { useAbacMembershipPreview } from '../AbacMembershipPreview/useAbacMembershipPreview';

export type AbacAttributeEditFlowPhase = 'edit' | 'preview';

export type UseAbacAttributeEditFlowOptions = {
	rid: string;
	roomName?: string;
	/** The candidate attribute set, as attribute key → values. */
	attributes: Record<string, string[]>;
	/** Success toast text. Defaults to "Room attributes updated" (Figma 4838:52014). */
	successMessage?: string;
	onSaved?: () => void;
};

/**
 * The edit → preview → confirm → commit sequence for a room's ABAC attributes (ABAC-P4 M3).
 *
 * Shared by the room's own Edit channel panel and the admin Edit room contextual bar so both
 * surfaces show the same impact and commit the same way. Each surface keeps its own chrome and
 * renders `AbacMembershipPreview` itself; what lives here is the sequencing, the confirmation and
 * the commit.
 *
 * Nothing is written until the confirmation is accepted — which is the whole point of the
 * milestone: committing an attribute change is what evicts members.
 */
export const useAbacAttributeEditFlow = ({ rid, roomName, attributes, successMessage, onSaved }: UseAbacAttributeEditFlowOptions) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();

	const [phase, setPhase] = useState<AbacAttributeEditFlowPhase>('edit');

	const preview = useAbacMembershipPreview({
		target: { rid },
		attributes,
		enabled: phase === 'preview',
	});

	const saveMutation = useMutation({
		mutationFn: () => sdk.rest.post(`/v1/abac/rooms/${rid}/attributes`, { attributes }),
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: successMessage ?? t('ABAC_Room_attributes_updated') });
			setModal(null);
			onSaved?.();
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => {
			void queryClient.invalidateQueries({ queryKey: ABACQueryKeys.rooms.all() });
		},
	});

	const goToPreview = useCallback(() => setPhase('preview'), []);
	const backToEdit = useCallback(() => setPhase('edit'), []);

	const requestSave = useCallback(() => {
		if (!preview.data) {
			return;
		}

		setModal(
			<AbacUpdateRoomModal
				roomName={roomName}
				preview={preview.data}
				onConfirm={() => saveMutation.mutate()}
				onCancel={() => {
					setModal(null);
					// "Back to editing" returns to the form, not merely to the preview.
					setPhase('edit');
				}}
			/>,
		);
	}, [preview.data, roomName, saveMutation, setModal]);

	return {
		phase,
		goToPreview,
		backToEdit,
		requestSave,
		preview,
		isSaving: saveMutation.isPending,
		/** The impact could not be determined, so committing would be a guess. */
		canSave: Boolean(preview.data) && !preview.isError,
	};
};
