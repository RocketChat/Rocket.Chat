import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import ContactInfoDetailsEntry from './ContactInfoDetailsEntry';

type ContactInfoDetailsGroupProps = {
	type: 'phone' | 'email';
	label: string;
	values: string[];
};

const ContactInfoDetailsGroup = ({ type, label, values }: ContactInfoDetailsGroupProps) => {
	return (
		<Box>
			<Box mbe={4} fontScale='p2'>
				{label}
			</Box>
			{values.map((value, index) => (
				<ContactInfoDetailsEntry type={type} label={label} key={index} value={value} />
			))}
		</Box>
	);
};

export default ContactInfoDetailsGroup;
