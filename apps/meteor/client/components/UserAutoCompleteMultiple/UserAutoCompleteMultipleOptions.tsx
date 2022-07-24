import { Options } from '@rocket.chat/fuselage';
import React, { forwardRef, ComponentProps, ReactElement, Ref, createContext, useContext } from 'react';

import { UserAutoCompleteOptionType } from './UserAutoCompleteMultipleFederated';
import UserAutoCompleteMultipleOption from './UserAutoCompleteMultipleOption';

type Options = Array<[UserAutoCompleteOptionType['username'], UserAutoCompleteOptionType]>;

// This is a hack in order to bypass the MultiSelect filter.
// The select requires a forwarded ref component in the renderOptions property
// but we also need to pass internal state to this renderer, as well as the props that also come from the Select.

type OptionsContextValue = {
	options: ComponentProps<typeof Options>['options'];
	onSelect: ComponentProps<typeof Options>['onSelect'];
};

export const OptionsContext = createContext<OptionsContextValue>({
	options: [],
	onSelect: () => undefined,
});
const UserAutoCompleteMultipleOptions = forwardRef(function UserAutoCompleteMultipleOptions(
	{ onSelect: _onSelect, ...props }: ComponentProps<typeof Options>,
	ref: Ref<HTMLElement>,
): ReactElement {
	const { options, onSelect } = useContext(OptionsContext);
	return (
		<Options
			{...props}
			key='AutocompleteOptions'
			options={options}
			onSelect={(val): void => {
				onSelect(val);
				_onSelect(val);
			}}
			ref={ref}
			renderItem={UserAutoCompleteMultipleOption}
		/>
	);
});

export default UserAutoCompleteMultipleOptions;
