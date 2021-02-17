import { Box, CheckBox } from '@rocket.chat/fuselage';
import React, { useEffect, useState, FC, ReactElement, ComponentType } from 'react';
// import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../contexts/TranslationContext';
import { useUserPreference } from '../contexts/UserContext';
import { useMethod } from '../contexts/ServerContext';

type DontAskAgainList = Array<{ action: string; label: string }>
type DoNotAskAgainProps = {
	confirm: (...args: any) => any;
	dontAskAgain: {
		action: string;
		label: string;
	};
}

export type RequiredModalProps = {
	dontAskAgain?: ReactElement;
	confirm?: DoNotAskAgainProps['confirm'];
}

function withDoNotAskAgain<T extends RequiredModalProps>(WrappedComponent: ComponentType<any>): FC<DoNotAskAgainProps & Omit<T, keyof RequiredModalProps>> {
	return function({ confirm, dontAskAgain, ...props }): ReactElement {
		const t = useTranslation();
		const dontAskAgainList = useUserPreference<DontAskAgainList>('dontAskAgainList');
		const { action, label } = dontAskAgain;
		const shouldNotAskAgain = dontAskAgainList?.filter(({ action: currentAction }) => action === currentAction).length;
		const saveFn = useMethod('saveUserPreferences');
		const [state, setState] = useState<boolean>(false);

		useEffect(() => {
			if (shouldNotAskAgain) {
				confirm();
			}
		}, [shouldNotAskAgain, confirm]);

		const handleConfirm = async (): Promise<void> => {
			try {
				if (state) {
					await saveFn({ dontAskAgainList: [...dontAskAgainList || [], { action, label }] });
				}
				confirm();
			} catch (e) {
				console.error(e);
			}
		};

		const onChange = (): void => {
			setState(!state);
		};

		return <WrappedComponent
			{...props}
			dontAskAgain={
				<Box display='flex' flexDirection='row'>
					<CheckBox checked={state} onChange={onChange} mie='x4' name='dont_ask_again' />
					<label htmlFor='dont_ask_again'>{t('Dont_ask_me_again')}</label>
				</Box>
			}
			confirm={handleConfirm}
		/>;
	};
}

export { withDoNotAskAgain };
