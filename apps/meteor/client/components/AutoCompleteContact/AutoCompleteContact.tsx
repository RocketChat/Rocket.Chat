import type { Serialized } from '@rocket.chat/core-typings';
import { Option, PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ILivechatContactWithManagerData } from '@rocket.chat/rest-typings';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps, ReactElement } from 'react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useContactsList } from './useContactsList';

type AutoCompleteContactProps = Omit<
	ComponentProps<typeof PaginatedSelectFiltered>,
	'filter' | 'setFilter' | 'options' | 'endReached' | 'renderItem' | 'value'
> & {
	value: string;
	onChange: (value: string, contact: Serialized<ILivechatContactWithManagerData> | undefined) => void;
	optionFormatter?(contact: Serialized<ILivechatContactWithManagerData>): { value: string; label: string };
};

const AutoCompleteContact = ({
	value,
	placeholder,
	disabled,
	optionFormatter,
	onChange,
	...props
}: AutoCompleteContactProps): ReactElement => {
	const { t } = useTranslation();
	const [contactsFilter, setContactFilter] = useState<string>('');
	const debouncedContactFilter = useDebouncedValue(contactsFilter, 500);

	const {
		data: contactsItems,
		fetchNextPage,
		isPending,
	} = useContactsList({
		filter: debouncedContactFilter,
		optionFormatter,
	});

	return (
		<PaginatedSelectFiltered
			{...props}
			aria-busy={isPending}
			placeholder={isPending ? t('Loading...') : placeholder}
			aria-disabled={isPending || disabled}
			disabled={isPending || disabled}
			value={value}
			flexShrink={0}
			filter={contactsFilter}
			setFilter={setContactFilter as (value: string | number | undefined) => void}
			options={contactsItems}
			onChange={onChange}
			endReached={() => fetchNextPage()}
			renderItem={({ label, ...props }) => (
				<Option {...props} label={label} avatar={<UserAvatar title={label} username={label} size='x20' />} />
			)}
		/>
	);
};

export default memo(AutoCompleteContact);
