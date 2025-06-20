import type { ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps, ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { findLastChatFromChannel } from '../utils/findLastChatFromChannel';

type AutoCompleteOutboundProviderProps = Omit<
	ComponentProps<typeof PaginatedSelectFiltered>,
	'filter' | 'setFilter' | 'options' | 'endReached' | 'renderItem'
> & {
	contact?: Serialized<Omit<ILivechatContact, 'contactManager'>> | null;
	value: string;
	onChange: (value: string) => void;
};

const AutoCompleteOutboundProvider = ({
	contact,
	disabled,
	value,
	placeholder,
	onChange,
	...props
}: AutoCompleteOutboundProviderProps): ReactElement => {
	const getProviders = useEndpoint('GET', '/v1/omnichannel/outbound/providers');
	const [channelsFilter, setChannelsFilter] = useState<string>('');
	const { t } = useTranslation();

	const { data: options, isFetching } = useQuery({
		queryKey: ['/v1/omnichannel/outbound/providers', contact?._id],
		queryFn: () => getProviders({ type: 'phone' }),
		select: (providers) => {
			return providers.map((prov) => {
				const lastChat = findLastChatFromChannel(contact?.channels, prov.providerId);
				return {
					label: prov.providerName,
					value: prov.providerId,
					description: lastChat ? t('Last_message_received__time__', { time: lastChat }) : '',
				};
			});
		},
		initialData: [],
	});

	const isLoading = isFetching && !options.length;

	return (
		<PaginatedSelectFiltered
			{...props}
			aria-busy={isLoading}
			placeholder={isLoading ? t('Loading...') : placeholder}
			aria-disabled={isLoading || disabled}
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
