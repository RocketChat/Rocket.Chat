import { TextInput } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const PhoneNumberInput: FC<{
	phoneNumber: string;
	setPhoneNumber: (phoneNumber: string) => void;
}> = ({ phoneNumber, setPhoneNumber }) => {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		setPhoneNumber(e.target.value);
	};
	return <TextInput onChange={handleChange} value={phoneNumber} />;
};

export default PhoneNumberInput;
