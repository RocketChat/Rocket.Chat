import DOMPurify from 'dompurify';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

import type { AsyncState } from '../../../../lib/asyncState/AsyncState';
import { AsyncStatePhase } from '../../../../lib/asyncState/AsyncStatePhase';
import { OmnichannelRoomIconContext } from '../context/OmnichannelRoomIconContext';
import OmnichannelRoomIconManager from '../lib/OmnichannelRoomIconManager';

let icons = Array.from(OmnichannelRoomIconManager.icons.values());

type OmnichannelRoomIconProviderProps = {
	children?: ReactNode;
};

export const OmnichannelRoomIconProvider = ({ children }: OmnichannelRoomIconProviderProps) => {
	const svgIcons = useSyncExternalStore(
		useCallback(
			(callback): (() => void) =>
				OmnichannelRoomIconManager.on('change', () => {
					icons = Array.from(OmnichannelRoomIconManager.icons.values());
					callback();
				}),
			[],
		),
		(): string[] => icons,
	);

	return (
		<OmnichannelRoomIconContext.Provider
			value={useMemo(() => {
				const extractSnapshot = (app: string, iconName: string): AsyncState<string> => {
					const icon = OmnichannelRoomIconManager.get(app, iconName);

					if (icon) {
						return {
							phase: AsyncStatePhase.RESOLVED,
							value: icon,
							error: undefined,
						};
					}

					return {
						phase: AsyncStatePhase.LOADING,
						value: undefined,
						error: undefined,
					};
				};

				// We cache all the icons here, so that we can use them in the OmnichannelRoomIcon component
				const snapshots = new Map<string, AsyncState<string>>();

				return {
					queryIcon: (
						app: string,
						iconName: string,
					): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => AsyncState<string>] => [
						(callback): (() => void) =>
							OmnichannelRoomIconManager.on(`${app}-${iconName}`, () => {
								snapshots.set(`${app}-${iconName}`, extractSnapshot(app, iconName));

								// Then we call the callback (onStoreChange), signaling React to re-render
								callback();
							}),

						// No problem here, because it's return value is a cached in the snapshots map on subsequent calls
						(): AsyncState<string> => {
							let snapshot = snapshots.get(`${app}-${iconName}`);

							if (!snapshot) {
								snapshot = extractSnapshot(app, iconName);
								snapshots.set(`${app}-${iconName}`, snapshot);
							}

							return snapshot;
						},
					],
				};
			}, [])}
		>
			{createPortal(
				<svg
					xmlns='http://www.w3.org/2000/svg'
					xmlnsXlink='http://www.w3.org/1999/xlink'
					style={{ display: 'none' }}
					dangerouslySetInnerHTML={{
						__html: DOMPurify.sanitize(`<svg>${svgIcons.join('')}</svg>`, {
							USE_PROFILES: { svg: true, svgFilters: true },
						}).slice(5, -6),
					}}
				/>,
				document.body,
				'custom-icons',
			)}
			{children}
		</OmnichannelRoomIconContext.Provider>
	);
};
