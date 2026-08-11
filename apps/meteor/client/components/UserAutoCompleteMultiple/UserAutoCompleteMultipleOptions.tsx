import type { OptionType } from '@rocket.chat/fuselage';
import { Options } from '@rocket.chat/fuselage';
import type { ComponentProps, RefAttributes } from 'react';
import { createContext, useContext } from 'react';

import UserAutoCompleteMultipleOption from './UserAutoCompleteMultipleOption';

// This is a hack in order to bypass the MultiSelect filter.
// The select requires a forwarded ref component in the renderOptions property
// but we also need to pass internal state to this renderer, as well as the props that also come from the Select.

export type UserLabel = {
	_federated?: boolean;
	username: string;
	name?: string;
};

type OptionsContextValue = {
	options: OptionType<string, UserLabel>[];
};

export const OptionsContext = createContext<OptionsContextValue>({
	options: [],
});
export type UserAutoCompleteMultipleOptionsProps = ComponentProps<typeof Options> & RefAttributes<HTMLElement>;

const UserAutoCompleteMultipleOptions = ({ onSelect, ref, ...props }: UserAutoCompleteMultipleOptionsProps) => {
	const { options } = useContext(OptionsContext);
	return (
		<Options
			{...props}
			key='AutocompleteOptions'
			options={options}
			onSelect={onSelect}
			ref={ref}
			renderItem={UserAutoCompleteMultipleOption}
		/>
	);
};

export default UserAutoCompleteMultipleOptions;
