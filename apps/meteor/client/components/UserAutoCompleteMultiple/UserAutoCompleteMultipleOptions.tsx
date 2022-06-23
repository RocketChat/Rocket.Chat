import { Options } from '@rocket.chat/fuselage';
import React, { forwardRef, ComponentProps, ForwardRefExoticComponent } from 'react';

import { UserAutoCompleteOptionType } from './UserAutoCompleteMultipleFederated';
import UserAutoCompleteMultipleOption from './UserAutoCompleteMultipleOption';

type Options = Array<[UserAutoCompleteOptionType['username'], UserAutoCompleteOptionType]>;

const renderOptions = (options: Options, onSelect: (val: [string]) => void): ForwardRefExoticComponent<ComponentProps<typeof Options>> =>
	forwardRef<HTMLElement, ComponentProps<typeof Options>>(function UserAutoCompleteMultipleOptions({ onSelect: _onSelect, ...props }, ref) {
		return (
			<Options
				{...props}
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

export default renderOptions;
