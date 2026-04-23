import { Box, Icon } from '@rocket.chat/fuselage';

type PhoneNumberProps = {
	number: string;
};

const PhoneNumber = ({ number }: PhoneNumberProps) => {
	return (
		<Box display='flex' flexDirection='row' id='rcx-media-call-widget-caller-info'>
			<Icon size='x20' name='phone' mie={8} aria-hidden='true' />
			<Box fontScale='p2b'>{number}</Box>
		</Box>
	);
};

export default PhoneNumber;
