import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ElementType } from 'react';

export const useCreateRoomModal = (
	Component: ElementType<{ onSuccess?: (rid: string, name?: string) => void | Promise<void>; onClose: () => void }>,
	onSuccess?: (rid: string, name?: string) => void | Promise<void>,
): (() => void) => {
	const setModal = useSetModal();

	return useStableCallback(() => {
		const handleClose = (): void => {
			setModal(null);
		};

		setModal(<Component onSuccess={onSuccess} onClose={handleClose} />);
	});
};
