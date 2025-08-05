import type { IOutboundProviderMetadata } from '@rocket.chat/core-typings';
import { Select } from '@rocket.chat/fuselage';
import { useMemo, type ComponentProps } from 'react';

import { formatPhoneNumber } from '../../../../lib/formatPhoneNumber';

type SenderSelectProps = Omit<ComponentProps<typeof Select>, 'options'> & {
	provider: IOutboundProviderMetadata | undefined;
};

const SenderSelect = ({ provider, value, onChange, ...props }: SenderSelectProps) => {
	const options = useMemo<[string, string][]>(() => {
		if (!provider) {
			return [];
		}

		const phones = Object.keys(provider.templates);

		return phones.length ? phones.map((phone) => [phone, formatPhoneNumber(phone)]) : [];
	}, [provider]);

	return <Select {...props} value={value} options={options} onChange={onChange} />;
};

export default SenderSelect;
