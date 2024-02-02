import type { SelectProps } from '@rocket.chat/fuselage';
import { Select,  Skeleton } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { useState } from 'react';

export const BaseSelect: FC<SelectProps> = ({ onError, options, onChange })=> {
    const [isLoading, setIsLoading] = useState<unknown>(false);

	if (isLoading) {
		return <Skeleton aria-hidden variant='rect' onError={onError} />;
	}
	return (
		<div>
			<Select
				aria-label='Select'
                onError={(event) => {
                    setIsLoading(true);
                    onError?.(event);
                }}
				options={options}
                onChange={onChange}
				placeholder='Select role'
			/>
		</div>
	);
}
