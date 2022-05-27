import { createContext, useContext } from 'react';

const onChange = (): void => console.log('onChange');
const handleSave = (): void => console.log('handleSave');

export type AccountPreferencesFormContextValue = {
	onChange: (arg: unknown) => void;
	handleSave: () => void;
	commitRef: Record<string, any>;
	hasAnyChange: boolean;
};

export const AccountPreferencesFormContext = createContext<AccountPreferencesFormContextValue>({
	onChange,
	handleSave,
	commitRef: {},
	hasAnyChange: false,
});

export const useAccountPreferencesForm = (): AccountPreferencesFormContextValue => {
	const context = useContext(AccountPreferencesFormContext);
	if (!context) {
		throw Error('useAccountPreferencesForm should be used only inside account preferences form context');
	}
	return context;
};
