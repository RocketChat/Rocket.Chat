import React, { FC, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSubscription, Subscription } from 'use-subscription';

import { AsyncState } from '../../../../lib/asyncState/AsyncState';
import { AsyncStatePhase } from '../../../../lib/asyncState/AsyncStatePhase';
import { OmnichannelRoomIconContext } from '../context/OmnichannelRoomIconContext';
import OmnichannelRoomIcon from '../lib/OmnichannelRoomIcon';

export const OmnichannelRoomIconProvider: FC = ({ children }) => {
	const svgIcons = useSubscription(
		useMemo(
			() => ({
				getCurrentValue: (): string[] => Array.from(OmnichannelRoomIcon.icons.values()),
				subscribe: (callback): (() => void) => OmnichannelRoomIcon.on('change', callback),
			}),
			[],
		),
	);
	return (
		<OmnichannelRoomIconContext.Provider
			value={useMemo(
				() => ({
					queryIcon: (app: string, iconName: string): Subscription<AsyncState<string>> => ({
						getCurrentValue: (): AsyncState<string> => {
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
						subscribe: (callback): (() => void) => OmnichannelRoomIcon.on(`${app}-${iconName}`, callback),
					}),
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
