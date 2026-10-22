import { Box, Icon } from '@rocket.chat/fuselage';

export type PhoneNumberProps = {
	number: string;
};

const PhoneNumber = ({ number }: PhoneNumberProps) => {
	return (
		<Box display='flex' flexDirection='row' gap={8} id='rcx-media-call-widget-caller-info'>
			<Icon size='x20' name='phone' aria-hidden='true' />
			<Box fontScale='p2b'>{number}</Box>
		</Box>
	);
};

export default PhoneNumber;
