import type { Serialized, ILivechatContact } from '@rocket.chat/core-typings';
import { Select } from '@rocket.chat/fuselage';
import type { ComponentProps, Key, ReactElement } from 'react';
import { useMemo } from 'react';

import { formatPhoneNumber } from '../../../../lib/formatPhoneNumber';

type RecipientSelectProps = Omit<ComponentProps<typeof Select>, 'options' | 'onChange' | 'value'> & {
	contact: Serialized<ILivechatContact> | null;
	value: string;
	onChange: (value: Key) => void;
	type: 'phone' | 'email';
};

const RecipientSelect = ({ contact, type, value, disabled, onChange, ...props }: RecipientSelectProps): ReactElement => {
	const options = useMemo<[string, string][]>(() => {
		if (!contact) {
			return [];
		}

		if (type === 'phone') {
			return contact.phones?.map((item) => [item.phoneNumber, formatPhoneNumber(item.phoneNumber)]) ?? [];
		}

		return contact.emails?.map((item) => [item.address, item.address]) ?? [];
	}, [contact, type]);

	return <Select {...props} aria-disabled={disabled} disabled={disabled} value={value} options={options} onChange={onChange} />;
};

export default RecipientSelect;
