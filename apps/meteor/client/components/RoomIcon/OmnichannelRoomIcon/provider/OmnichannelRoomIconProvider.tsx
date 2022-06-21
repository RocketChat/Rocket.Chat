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
			value={useMemo(
				() => ({
					queryIcon: (
						app: string,
						iconName: string,
					): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => AsyncState<string>] => [
						(callback): (() => void) => OmnichannelRoomIcon.on(`${app}-${iconName}`, callback),
						(): AsyncState<string> => {
							const icon = OmnichannelRoomIcon.get(app, iconName);

							if (!icon) {
								return {
									phase: AsyncStatePhase.LOADING,
									value: undefined,
									error: undefined,
								};
							}

							return {
								phase: AsyncStatePhase.RESOLVED,
								value: icon,
								error: undefined,
							};
						},
					],
				}),
				[],
			)}
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
