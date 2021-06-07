import { createElement, useEffect, Dispatch, SetStateAction, ReactNode } from 'react';
import { useSubscription } from 'use-subscription';

import { imperativeModal } from '../../lib/imperativeModal';

export const useImperativeModal = (setModal: Dispatch<SetStateAction<ReactNode>>): void => {
	const descriptor = useSubscription(imperativeModal);

	useEffect(() => {
		if (descriptor === null) {
			return setModal(null);
		}

		// todo API to accept old modal props
		// and return equivalent React modal
		if ('options' in descriptor) {
			return; // handleBlazeModal
		}

		if ('component' in descriptor) {
			return setModal(createElement(descriptor.component, descriptor.props));
		}

		throw new Error('invalid modal descriptor');
	}, [descriptor, setModal]);
};
