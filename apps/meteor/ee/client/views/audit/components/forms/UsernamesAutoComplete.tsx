import type { IUser } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

import UserAutoCompleteMultiple from '../../../../../../client/components/UserAutoCompleteMultiple';

type UsernamesAutoCompleteProps = Omit<ComponentProps<typeof UserAutoCompleteMultiple>, 'value' | 'onChange' | 'filter' | 'setFilter'> & {
	value: Exclude<IUser['username'], undefined>[] | undefined;
	onChange: (value: Exclude<IUser['username'], undefined>[] | undefined) => void;
};

const UsernamesAutoComplete = ({ value, onChange, ...props }: UsernamesAutoCompleteProps): ReactElement => {
	const handleChange = useMutableCallback((currentUsername: Exclude<IUser['username'], undefined>, action: 'remove' | undefined) => {
		const expunged = value?.filter((username) => username !== currentUsername) ?? [];
		if (action === 'remove') {
			onChange(expunged);
			return;
		}

		onChange([...expunged, currentUsername]);
	});

	return <UserAutoCompleteMultiple value={value} onChange={handleChange} {...props} />;
};

export default UsernamesAutoComplete;
