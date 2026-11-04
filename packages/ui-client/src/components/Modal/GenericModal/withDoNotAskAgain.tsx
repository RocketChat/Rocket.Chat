import { Box, CheckBox, Stack } from '@rocket.chat/fuselage';
import { useUserPreference, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ComponentType, ReactNode } from 'react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { DontAskAgainList } from '../../../hooks/useDontAskAgain';

type DoNotAskAgainProps = {
	onConfirm: (...args: any) => Promise<void> | void;
	dontAskAgain: {
		action: string;
		label: string;
	};
};

export type RequiredModalProps = {
	onConfirm?: (...args: any) => Promise<void> | void;
	dontAskAgain?: ReactNode;
};

function withDoNotAskAgain<T extends RequiredModalProps>(Component: ComponentType<any>) {
	type WrappedComponentProps = DoNotAskAgainProps & Omit<T, keyof RequiredModalProps>;
	const WrappedComponent = function ({ onConfirm, dontAskAgain, ...props }: WrappedComponentProps) {
		const { t } = useTranslation();
		const dontAskAgainId = useId();
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
					<Stack direction='row' gap={8}>
						<CheckBox id={dontAskAgainId} checked={state} onChange={onChange} name='dont_ask_again' />
						<Box is='label' color='annotation' fontScale='p2' htmlFor={dontAskAgainId}>
							{t('Dont_ask_me_again')}
						</Box>
					</Stack>
				}
				onConfirm={handleConfirm}
			/>
		);
	};

	WrappedComponent.displayName = `withDoNotAskAgain(${Component.displayName ?? Component.name ?? 'Component'})`;

	return WrappedComponent;
}

export { withDoNotAskAgain };
