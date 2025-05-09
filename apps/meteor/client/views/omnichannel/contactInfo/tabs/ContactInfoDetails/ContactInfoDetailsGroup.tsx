import { Box } from '@rocket.chat/fuselage';

import ContactInfoDetailsEntry from './ContactInfoDetailsEntry';
import { parseOutboundPhoneNumber } from '../../../../../lib/voip/parseOutboundPhoneNumber';

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
				<ContactInfoDetailsEntry
					key={index}
					isPhone={type === 'phone'}
					icon={type === 'phone' ? 'phone' : 'mail'}
					value={type === 'phone' ? parseOutboundPhoneNumber(value) : value}
				/>
			))}
		</Box>
	);
};

export default ContactInfoDetailsGroup;
