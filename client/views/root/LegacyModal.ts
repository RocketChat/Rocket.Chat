import { createElement, useEffect } from 'react';
import { useSubscription } from 'use-subscription';

import { useSetModal } from '../../contexts/ModalContext';
import { legacyModal } from '../../lib/legacyModal';

const LegacyModal = (): null => {
	const descriptor = useSubscription(legacyModal);

	const setModal = useSetModal();

	useEffect(() => {
		if (descriptor === null) {
			return setModal(null);
		}

		if ('options' in descriptor) {
			return; // handleBlazeModal
		}

		if ('component' in descriptor) {
			return setModal(createElement(descriptor.component, descriptor.props));
		}

		throw new Error('invalid modal descriptor');
	}, [descriptor, setModal]);

	return null;
};

export default LegacyModal;
