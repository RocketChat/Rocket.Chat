import { Options } from '@rocket.chat/fuselage';
import React, { forwardRef, ComponentProps, RefAttributes, ReactElement, Ref } from 'react';

import { UserAutoCompleteOptionType } from './UserAutoCompleteMultipleFederated';
import UserAutoCompleteMultipleOption from './UserAutoCompleteMultipleOption';

type Options = Array<[UserAutoCompleteOptionType['username'], UserAutoCompleteOptionType]>;

const renderOptions = (
	options: Options,
	onSelect: ComponentProps<typeof Options>['onSelect'],
): ((props: ComponentProps<typeof Options> & RefAttributes<HTMLElement>) => ReactElement | null) =>
	forwardRef(function UserAutoCompleteMultipleOptions(
		{ onSelect: _onSelect, ...props }: ComponentProps<typeof Options>,
		ref: Ref<HTMLElement>,
	): ReactElement {
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
