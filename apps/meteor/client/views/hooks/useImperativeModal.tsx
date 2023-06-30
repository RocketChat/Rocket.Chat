import type { Dispatch, SetStateAction, ReactNode } from 'react';
import React, { Suspense, createElement, useEffect } from 'react';

import { imperativeModal } from '../../lib/imperativeModal';

export const useImperativeModal = (setModal: Dispatch<SetStateAction<ReactNode>>): void => {
	useEffect(() => {
		return imperativeModal.on('update', (descriptor) => {
			if (descriptor === null) {
				return setModal(null);
			}
			if ('component' in descriptor) {
				setModal(
					<Suspense fallback={<div />}>
						{createElement(descriptor.component, {
							key: Math.random(),
							...descriptor.props,
						})}
					</Suspense>,
				);
			}
		});
	}, [setModal]);
};
