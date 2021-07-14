import {
	AutoComplete,
	Box,
	Option,
	Options,
	Chip,
	Skeleton,
	AutoCompleteProps,
} from '@rocket.chat/fuselage';
import { useMutableCallback, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { FC, memo, useState, useCallback } from 'react';

import { IUser } from '../../../definition/IUser';
import UserAvatar from '../avatar/UserAvatar';
import { useUsersAutoComplete } from './useUserAutoComplete';

type UserAutoCompleteMultipleProps = {
	value: Array<IUser['username']>;
	onChange: AutoCompleteProps['onChange'];
	handleById?: boolean;
	placeholder?: string;
};

const UserAutoCompleteMultiple: FC<UserAutoCompleteMultipleProps> = ({
	handleById = false,
	onChange,
	...props
}) => {
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);
	const [options, labelData] = useUsersAutoComplete(debouncedFilter, handleById);

	const onClickRemove = useMutableCallback((e) => {
		e.stopPropagation();
		e.preventDefault();
		onChange(e.currentTarget.value, 'remove');
	});

	const renderSelected = useCallback<FC<{ value?: string[] }>>(
		({ value: selected }) => (
			<>
				{selected?.map((value) => {
					if (!labelData[value]) {
						return (
							<Chip
								key={value}
								{...props}
								height='x20'
								value={value}
								onClick={onClickRemove}
								mie='x4'
							>
								<Skeleton width='x48' />
							</Chip>
						);
					}

					return (
						<Chip
							key={value}
							{...props}
							height='x20'
							value={value}
							onClick={onClickRemove}
							mie='x4'
						>
							<UserAvatar size='x20' username={labelData[value] as string} />
							<Box is='span' margin='none' mis='x4'>
								{labelData[value]}
							</Box>
						</Chip>
					);
				})}
			</>
		),
		[onClickRemove, props, labelData],
	);

	const renderItem: FC<{ value: string }> = ({ value, ...props }) => (
		<Option
			key={value}
			{...props}
			avatar={<UserAvatar size={Options.AvatarSize} username={labelData[value] as string} />}
		/>
	);

	return (
		<AutoComplete
			{...props}
			filter={filter}
			setFilter={setFilter}
			renderSelected={renderSelected}
			renderItem={renderItem}
			options={options}
			onChange={onChange}
		/>
	);
};

export default memo(UserAutoCompleteMultiple);
