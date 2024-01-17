import { Options } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement, Ref } from 'react';
import React, { forwardRef, createContext, useContext } from 'react';

import UserAutoCompleteMultipleOption from './UserAutoCompleteMultipleOption';

// This is a hack in order to bypass the MultiSelect filter.
// The select requires a forwarded ref component in the renderOptions property
// but we also need to pass internal state to this renderer, as well as the props that also come from the Select.

type OptionsContextValue = {
	options: ComponentProps<typeof Options>['options'];
};

export const OptionsContext = createContext<OptionsContextValue>({
	options: [],
});
const UserAutoCompleteMultipleOptions = forwardRef(function UserAutoCompleteMultipleOptions(
	{ onSelect, ...props }: ComponentProps<typeof Options>,
	ref: Ref<HTMLElement>,
): ReactElement {
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
});

export default UserAutoCompleteMultipleOptions;
