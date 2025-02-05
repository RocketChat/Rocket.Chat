import type { IconProps } from '@rocket.chat/fuselage';
import { Box, Icon, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import ContactInfoCallButton from './ContactInfoCallButton';
import { useIsCallReady } from '../../../../../contexts/CallContext';
import useClipboardWithToast from '../../../../../hooks/useClipboardWithToast';

type ContactInfoDetailsEntryProps = {
	icon: IconProps['name'];
	isPhone: boolean;
	value: string;
};

const ContactInfoDetailsEntry = ({ icon, isPhone, value }: ContactInfoDetailsEntryProps) => {
	const { t } = useTranslation();
	const { copy } = useClipboardWithToast(value);

	const isCallReady = useIsCallReady();

	return (
		<Box display='flex' alignItems='center'>
			<Icon size='x18' name={icon} />
			<Box withTruncatedText display='flex' flexGrow={1} alignItems='center' justifyContent='space-between'>
				<Box is='p' fontScale='p2' withTruncatedText data-type={isPhone ? 'phone' : 'email'} mi={4}>
					{value}
				</Box>
				<Box display='flex' alignItems='center'>
					{isCallReady && isPhone && <ContactInfoCallButton phoneNumber={value} />}
					<IconButton onClick={() => copy()} tiny title={t('Copy')} icon='copy' />
				</Box>
			</Box>
		</Box>
	);
};

export default ContactInfoDetailsEntry;
