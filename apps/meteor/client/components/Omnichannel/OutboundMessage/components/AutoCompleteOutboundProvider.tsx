import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps, ReactElement } from 'react';
import { memo, useState } from 'react';

import { getProvidersMock } from '../mocks';

type AutoCompleteOutboundProviderProps = Omit<
	ComponentProps<typeof PaginatedSelectFiltered>,
	'filter' | 'setFilter' | 'options' | 'endReached' | 'renderItem'
> & {
	value: string;
	onChange: (value: string) => void;
};

const AutoCompleteOutboundProvider = ({ disabled, value, onChange, ...props }: AutoCompleteOutboundProviderProps): ReactElement => {
	const [channelsFilter, setChannelsFilter] = useState<string>('');

	const { data: options } = useQuery({
		queryKey: ['/v1/omnichannel/outbound/providers'],
		queryFn: () => getProvidersMock(),
		select: (providers) => providers.map((prov) => ({ label: prov.providerName, value: prov.providerId })),
		initialData: [],
	});

	return (
		<PaginatedSelectFiltered
			{...props}
			disabled={disabled}
			value={value}
			flexShrink={0}
			filter={channelsFilter}
			setFilter={setChannelsFilter as (value: string | number | undefined) => void}
			options={options}
			onChange={onChange}
		/>
	);
};

export default memo(AutoCompleteOutboundProvider);
