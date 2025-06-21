import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';

import { OutboundMessageModal } from '../../../components/Omnichannel/OutboundMessage/modals/OutboundMessageModal';

export const useOutboundMessageModal = (): (() => void) => {
	const setModal = useSetModal();

	return useEffectEvent(() => {
		const handleClose = (): void => {
			setModal(null);
		};

		setModal(<OutboundMessageModal onClose={handleClose} />);
	});
};
