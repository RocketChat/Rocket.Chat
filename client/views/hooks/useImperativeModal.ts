import { createElement, useEffect, Dispatch, SetStateAction, ReactNode } from 'react';

import { imperativeModal } from '../../lib/imperativeModal';

export const useImperativeModal = (setModal: Dispatch<SetStateAction<ReactNode>>): void => {
	useEffect(() => {
		const unsub = imperativeModal.on('update', (descriptor) => {
			if (descriptor === null) {
				return setModal(null);
			}
			if ('component' in descriptor) {
				setModal(
					createElement(descriptor.component, {
						key: Math.random(),
						...descriptor.props,
					}),
				);
			}
		});
		return unsub;
	}, [setModal]);
};
