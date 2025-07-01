import { Box, Icon } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';

type ContactInfoActivityInfoProps = {
	icon: Keys;
	label: string;
	value: string;
};

const ContactInfoActivityInfo = ({ icon, label, value }: ContactInfoActivityInfoProps) => (
	<Box display='flex' alignItems='center' mb={8}>
		<Icon size={20} name={icon} />
		<Box withTruncatedText mis={8} fontScale='c1'>
			{label}
		</Box>
		<Box mis={4} withTruncatedText fontScale='c1' color='annotation'>
			{value}
		</Box>
	</Box>
);

export default ContactInfoActivityInfo;
