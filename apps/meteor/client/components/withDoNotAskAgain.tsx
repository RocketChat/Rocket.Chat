import { Box, CheckBox } from '@rocket.chat/fuselage';
import { useUserPreference, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { FC, ReactElement, ComponentType } from 'react';
import React, { useState } from 'react';

import type { DontAskAgainList } from '../hooks/useDontAskAgain';

type DoNotAskAgainProps = {
	onConfirm: (...args: any) => any;
	dontAskAgain: {
		action: string;
		label: string;
	};
};

export type RequiredModalProps = {
	onConfirm: (...args: any) => any;
	dontAskAgain?: ReactElement;
};

function withDoNotAskAgain<T extends RequiredModalProps>(
	Component: ComponentType<any>,
): FC<DoNotAskAgainProps & Omit<T, keyof RequiredModalProps>> {
	const WrappedComponent: FC<DoNotAskAgainProps & Omit<T, keyof RequiredModalProps>> = function ({ onConfirm, dontAskAgain, ...props }) {
		const t = useTranslation();
		const dontAskAgainList = useUserPreference<DontAskAgainList>('dontAskAgainList');
		const { action, label } = dontAskAgain;

		const saveFn = useEndpoint('POST', '/v1/users.setPreferences');
		const [state, setState] = useState<boolean>(false);

		const handleConfirm = async (): Promise<void> => {
			try {
				if (state) {
					await saveFn({ data: { dontAskAgainList: [...(dontAskAgainList || []), { action, label }] } });
				}
				await onConfirm();
			} catch (e) {
				console.error(e);
			}
		};

		const onChange = (): void => {
			setState(!state);
		};

		return (
			<Component
				{...props}
				dontAskAgain={
					<Box display='flex' flexDirection='row'>
						<CheckBox checked={state} onChange={onChange} mie='x4' name='dont_ask_again' />
						<label htmlFor='dont_ask_again'>{t('Dont_ask_me_again')}</label>
					</Box>
				}
				onConfirm={handleConfirm}
			/>
		);
	};

	WrappedComponent.displayName = `withDoNotAskAgain(${Component.displayName ?? Component.name ?? 'Component'})`;

	return WrappedComponent;
}

export { withDoNotAskAgain };
