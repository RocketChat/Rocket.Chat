import { Box } from '@rocket.chat/fuselage';

type TotpQrCodeProps = {
	src?: string;
};

/**
 * The QR code an authenticator app scans, pulled into the space its own quiet zone leaves around it.
 */
const TotpQrCode = ({ src }: TotpQrCodeProps) => (
	<Box marginInlineStart='neg-x16' marginBlockStart='neg-x16' is='img' size='x200' src={src} aria-hidden='true' />
);

export default TotpQrCode;
