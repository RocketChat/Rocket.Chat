import type { ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTimeFromNow } from '../../../../hooks/useTimeFromNow';
import useOutboundProvidersList from '../hooks/useOutboundProvidersList';
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
	const [channelsFilter, setChannelsFilter] = useState<string>('');
	const { t } = useTranslation();
	const getTimeFromNow = useTimeFromNow(true);

	const { data: options, isPending } = useOutboundProvidersList({
		queryKey: ['/v1/omnichannel/outbound/providers', contact?._id],
		select: ({ providers = [] }) => {
			return providers.map((prov) => {
				const lastChat = findLastChatFromChannel(contact?.channels, prov.providerId);
				return {
					label: prov.providerName,
					value: prov.providerId,
					description: lastChat ? t('Last_message_received__time__', { time: getTimeFromNow(lastChat) }) : '',
				};
			});
		},
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
			filter={channelsFilter}
			setFilter={setChannelsFilter as (value: string | number | undefined) => void}
			options={options}
			onChange={onChange}
		/>
	);
};

export default AutoCompleteOutboundProvider;
