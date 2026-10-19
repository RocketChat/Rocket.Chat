import type { ChangeEvent, RefAttributes } from 'react';
import { useMemo } from 'react';

import { Input } from '../InputBox';
import type { PaginatedSelectProps } from './PaginatedSelect';
import { PaginatedSelect } from './PaginatedSelect';

export type PaginatedSelectFilteredProps = Omit<PaginatedSelectProps, 'setFilter'> &
	RefAttributes<HTMLInputElement> & {
		setFilter: (value: string | undefined | number) => void;
	};

const PaginatedSelectFiltered = ({ filter, setFilter, options, placeholder, ...props }: PaginatedSelectFilteredProps) => {
	const anchor = useMemo(
		() =>
			// eslint-disable-next-line react/display-name, react/no-multi-comp -- anchor closes over placeholder and setFilter
			({ filter, onChange: _onChange, ...props }: PaginatedSelectFilteredProps) => (
				<Input
					marginInline={4}
					flexGrow={1}
					className='rcx-select__focus'
					placeholder={placeholder}
					value={filter}
					onChange={(e: ChangeEvent<HTMLInputElement>) => {
						setFilter(e.currentTarget.value);
					}}
					{...props}
					rcx-input-box--undecorated
				/>
			),
		[placeholder, setFilter],
	);

	return <PaginatedSelect placeholder={undefined} filter={filter} options={options} {...props} anchor={anchor} />;
};

export default PaginatedSelectFiltered;
