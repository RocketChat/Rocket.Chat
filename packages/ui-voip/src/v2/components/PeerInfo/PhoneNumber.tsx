import { Box, Icon } from '@rocket.chat/fuselage';

type PhoneNumberProps = {
	number: string;
};

const PhoneNumber = ({ number }: PhoneNumberProps) => {
	return (
		<Box display='flex' flexDirection='row'>
			<Icon size='x20' name='phone' mie={8} />
			<Box fontScale='p2b'>{`+${number}`}</Box>
		</Box>
	);
};

export default PhoneNumber;
