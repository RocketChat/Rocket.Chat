import type { Serialized } from '@rocket.chat/core-typings';
import { Select } from '@rocket.chat/fuselage';
import type { ILivechatContactWithManagerData } from '@rocket.chat/rest-typings';
import type { ComponentProps, Key, ReactElement } from 'react';
import { memo, useMemo } from 'react';

type AutoCompleteToProps = Omit<ComponentProps<typeof Select>, 'options' | 'onChange' | 'value'> & {
	contact: Serialized<ILivechatContactWithManagerData> | undefined;
	value: string;
	onChange: (value: Key) => void;
	recipientType: 'phone' | 'email';
};

const AutoCompleteRecipient = ({ contact, recipientType, disabled, value, onChange, ...props }: AutoCompleteToProps): ReactElement => {
	const options = useMemo<[string, string][]>(() => {
		if (!contact) {
			return [];
		}

		if (recipientType === 'phone') {
			return contact.phones?.map((item) => [item.phoneNumber, item.phoneNumber]) ?? [];
		}

		return contact.emails?.map((item) => [item.address, item.address]) ?? [];
	}, [contact, recipientType]);

	return <Select {...props} disabled={disabled || !contact} value={value} options={options} onChange={onChange} />;
};

export default memo(AutoCompleteRecipient);
