import React, { FC, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { AsyncState } from '../../../../lib/asyncState/AsyncState';
import { AsyncStatePhase } from '../../../../lib/asyncState/AsyncStatePhase';
import { OmnichannelRoomIconContext } from '../context/OmnichannelRoomIconContext';
import OmnichannelRoomIcon from '../lib/OmnichannelRoomIcon';

let icons = Array.from(OmnichannelRoomIcon.icons.values());

export const OmnichannelRoomIconProvider: FC = ({ children }) => {
	const svgIcons = useSyncExternalStore(
		useCallback(
			(callback): (() => void) =>
				OmnichannelRoomIcon.on('change', () => {
					icons = Array.from(OmnichannelRoomIcon.icons.values());
					callback();
				}),
			[],
		),
		(): string[] => icons,
	);

	return (
		<OmnichannelRoomIconContext.Provider
			value={useMemo(() => {
				let snapshot: AsyncState<string> = {
					phase: AsyncStatePhase.LOADING,
					value: undefined,
					error: undefined,
				};

				return {
					queryIcon: (
						app: string,
						iconName: string,
					): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => AsyncState<string>] => [
						(callback): (() => void) =>
							OmnichannelRoomIcon.on(`${app}-${iconName}`, () => {
								// First, let's update the snapshot
								const icon = OmnichannelRoomIcon.get(app, iconName);

								if (icon) {
									snapshot = {
										phase: AsyncStatePhase.RESOLVED,
										value: icon,
										error: undefined,
									};
								} else {
									snapshot = {
										phase: AsyncStatePhase.LOADING,
										value: undefined,
										error: undefined,
									};
								}

								// Then we call the callback (onStoreChange), signaling React to re-render
								callback();
							}),

						// React will get the snapshot instead of computing it on demand
						(): AsyncState<string> => snapshot,
					],
				};
			}, [])}
		>
			{createPortal(
				<svg
					xmlns='http://www.w3.org/2000/svg'
					xmlnsXlink='http://www.w3.org/1999/xlink'
					style={{ display: 'none' }}
					dangerouslySetInnerHTML={{ __html: svgIcons.join('') }}
				/>,
				document.body,
				'custom-icons',
			)}
			{children}
		</OmnichannelRoomIconContext.Provider>
	);
};
