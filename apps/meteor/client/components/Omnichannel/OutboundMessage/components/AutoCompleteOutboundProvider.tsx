import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps, ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getProvidersMock } from '../mocks';

type AutoCompleteOutboundProviderProps = Omit<
	ComponentProps<typeof PaginatedSelectFiltered>,
	'filter' | 'setFilter' | 'options' | 'endReached' | 'renderItem'
> & {
	value: string;
	onChange: (value: string) => void;
};

const AutoCompleteOutboundProvider = ({
	disabled,
	value,
	placeholder,
	onChange,
	...props
}: AutoCompleteOutboundProviderProps): ReactElement => {
	const [channelsFilter, setChannelsFilter] = useState<string>('');
	const { t } = useTranslation();

	const { data: options, isFetching } = useQuery({
		queryKey: ['/v1/omnichannel/outbound/providers'],
		queryFn: () => getProvidersMock(),
		select: (providers) =>
			providers.map((prov) => ({
				label: prov.providerName,
				value: prov.providerId,
				description: prov.lastChat ? t('Last_message_received__time__', { time: prov.lastChat }) : '',
			})),
		initialData: [],
	});

	const isLoading = isFetching && !options.length;

	return (
		<PaginatedSelectFiltered
			{...props}
			aria-busy={isLoading}
			placeholder={isLoading ? t('Loading...') : placeholder}
			disabled={isLoading || disabled}
			value={value}
			flexShrink={0}
			filter={channelsFilter}
			setFilter={setChannelsFilter as (value: string | number | undefined) => void}
			options={options}
			onChange={onChange}
		/>
	);
};

export default AutoCompleteOutboundProvider;
