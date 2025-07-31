import { Button, Box, Throbber } from '@rocket.chat/fuselage';

export const RenderQrContent = ({
	isLoading,
	error,
	qrCodeUrl,
	timeLeft,
	handleRenewCode,
}: {
	isLoading: boolean;
	error: string;
	qrCodeUrl: string;
	timeLeft: number;
	handleRenewCode: () => void;
}) => {
	if (isLoading) {
		return (
			<Box display='flex' flexDirection='column' alignItems='center'>
				<Throbber size='x32' />
				<Box fontScale='c1' color='neutral-600' marginBlockStart='x16'>
					Generating code...
				</Box>
			</Box>
		);
	}

	if (error) {
		return (
			<Box display='flex' flexDirection='column' alignItems='center' padding='x16'>
				<Box fontScale='c1' color='danger-500' textAlign='center' marginBlockEnd='x16'>
					{error}
				</Box>
				<Button small secondary onClick={handleRenewCode}>
					Try Again
				</Button>
			</Box>
		);
	}

	if (qrCodeUrl) {
		return (
			<>
				<Box is='img' src={qrCodeUrl} alt='QR code for mobile authentication' width='x256' height='x256' />
				{timeLeft <= 10 && <Box position='absolute' inset='none' backgroundColor='danger-500' opacity={0.1} borderRadius='x8' />}
			</>
		);
	}

	return null;
};
