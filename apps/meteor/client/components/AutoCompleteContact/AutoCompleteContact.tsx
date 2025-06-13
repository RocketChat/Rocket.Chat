import type { Serialized } from '@rocket.chat/core-typings';
import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { ILivechatContactWithManagerData } from '@rocket.chat/rest-typings';
import type { ComponentProps, ReactElement } from 'react';
import { memo, useMemo, useState } from 'react';

import { useContactsList } from './useContactsList';

type AutoCompleteContactProps = Omit<
	ComponentProps<typeof PaginatedSelectFiltered>,
	'filter' | 'setFilter' | 'options' | 'endReached' | 'renderItem' | 'value'
> & {
	value: Serialized<ILivechatContactWithManagerData>;
	onChange: (value: Serialized<ILivechatContactWithManagerData> | undefined) => void;
};

const AutoCompleteContact = ({ value, onChange, ...props }: AutoCompleteContactProps): ReactElement => {
	const [contactsFilter, setContactFilter] = useState<string>('');
	const debouncedContactFilter = useDebouncedValue(contactsFilter, 500);

	const { data: contactsItems, fetchNextPage } = useContactsList({
		filter: debouncedContactFilter,
	});

	const map = useMemo(() => {
		return new Map(contactsItems.map((contact) => [contact._id, contact]));
	}, [contactsItems]);

	const handleChange = useEffectEvent((contactId: string) => {
		onChange(contactId ? map.get(contactId) : undefined);
	});

	return (
		<PaginatedSelectFiltered
			{...props}
			value={value?._id}
			flexShrink={0}
			filter={contactsFilter}
			setFilter={setContactFilter as (value: string | number | undefined) => void}
			options={contactsItems}
			onChange={handleChange}
			endReached={() => fetchNextPage()}
		/>
	);
};

export default memo(AutoCompleteContact);
