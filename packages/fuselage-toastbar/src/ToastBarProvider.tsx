import type { ReactNode } from 'react';
import { useState, memo, useCallback } from 'react';

import type { ToastBarPayload } from './ToastBarContext';
import { ToastBarContext } from './ToastBarContext';
import ToastBarPersistent from './ToastBarPersistent';
import ToastBarPortal from './ToastBarPortal';
import ToastBarTimed from './ToastBarTimed';
import ToastBarZone from './ToastBarZone';

export type ToastBarProviderProps = {
	children?: ReactNode;
};

const ToastBarProvider = ({ children }: ToastBarProviderProps) => {
	const [toasts, setToasts] = useState<ToastBarPayload[]>([]);

	const contextValue = {
		dispatch: useCallback(
			(option: Omit<ToastBarPayload, 'id' | 'time'> & { time?: number }) =>
				setToasts((toasts) => [...toasts, { ...option, time: option.time || 5, id: Math.random().toString() }]),
			[],
		),
		dismiss: useCallback((id: ToastBarPayload['id']) => setToasts((prevState) => prevState.filter((toast) => toast.id !== id)), []),
	};

	return (
		<ToastBarContext.Provider value={contextValue}>
			{children}
			<ToastBarPortal>
				{Object.entries(
					toasts?.reduce(
						(zones, toast) => {
							zones[toast.position || 'top-end'] = zones[toast.position || 'top-end'] || [];
							zones[toast.position || 'top-end'].push(toast);
							return zones;
						},
						{} as Record<'top-start' | 'top-end' | 'bottom-start' | 'bottom-end', ToastBarPayload[]>,
					),
				).map(([zone, toasts]) => (
					<ToastBarZone key={zone} position={zone as ToastBarPayload['position']}>
						{toasts.map((toast) =>
							toast.isPersistent ? <ToastBarPersistent key={toast.id} {...toast} /> : <ToastBarTimed key={toast.id} {...toast} />,
						)}
					</ToastBarZone>
				))}
			</ToastBarPortal>
		</ToastBarContext.Provider>
	);
};

export default memo<typeof ToastBarProvider>(ToastBarProvider);
