import type { Serialized } from '@rocket.chat/core-typings';
import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ILivechatContactWithManagerData } from '@rocket.chat/rest-typings';
import type { ComponentProps, ReactElement, SyntheticEvent } from 'react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useContactsList } from './useContactsList';

type OptionProps = {
	role: 'option';
	title?: string;
	index: number;
	label: string;
	value: string;
	selected: boolean;
	focus: boolean;
	onMouseDown(event: SyntheticEvent): void;
};

type AutoCompleteContactProps = Omit<
	ComponentProps<typeof PaginatedSelectFiltered>,
	'filter' | 'setFilter' | 'options' | 'endReached' | 'renderItem' | 'value'
> & {
	value: string;
	onChange: (value: string, contact: Serialized<ILivechatContactWithManagerData> | undefined) => void;
	renderItem?: (props: OptionProps, contact: Serialized<ILivechatContactWithManagerData>) => ReactElement;
};

const AutoCompleteContact = ({ value, placeholder, disabled, renderItem, onChange, ...props }: AutoCompleteContactProps): ReactElement => {
	const { t } = useTranslation();
	const [contactsFilter, setContactFilter] = useState<string>('');
	const debouncedContactFilter = useDebouncedValue(contactsFilter, 500);

	const {
		data: contactsItems = [],
		fetchNextPage,
		isPending,
	} = useContactsList({
		filter: debouncedContactFilter,
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
			renderItem={renderItem ? (props: OptionProps) => renderItem(props, contactsItems[props.index]) : undefined}
		/>
	);
};

export default memo(AutoCompleteContact);
