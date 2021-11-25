import { createElement, useEffect, Dispatch, SetStateAction, ReactNode, useState } from 'react';

import { imperativeModal } from '../../lib/imperativeModal';

export const useImperativeModal = (setModal: Dispatch<SetStateAction<ReactNode>>): void => {
	// this is so updates are queued, allowing the modal to close before reopening
	const [updates, setUpdates] = useState<Array<() => void>>([]);

	useEffect(() => {
		if (updates.length > 0) {
			setUpdates((updates) => {
				const update = updates.shift();
				update && update();
				return [...updates];
			});
		}
	}, [updates.length]);

	useEffect(() => {
		const unsub = imperativeModal.on('update', (descriptor) => {
			if (descriptor === null) {
				return setUpdates((updates) => updates.concat(updates, [(): void => setModal(null)]));
			}
			if ('component' in descriptor) {
				setUpdates((updates) =>
					updates.concat(updates, [
						(): void => {
							setModal(createElement(descriptor.component, descriptor.props));
						},
					]),
				);
			}
		});
		return unsub;
	}, [setModal]);
};
