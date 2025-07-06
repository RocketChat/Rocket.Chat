import type { IconProps } from '@rocket.chat/fuselage';
import { Box, ButtonGroup, Icon, IconButton } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import useClipboardWithToast from '../../../../../hooks/useClipboardWithToast';

type ContactInfoDetailsEntryProps = {
	icon: IconProps['name'];
	value: string;
	actions?: ReactNode;
};

const ContactInfoDetailsEntry = ({ icon, value, actions }: ContactInfoDetailsEntryProps) => {
	const { t } = useTranslation();
	const { copy } = useClipboardWithToast(value);

	return (
		<Box display='flex' alignItems='center'>
			<Icon size='x18' name={icon} />
			<Box withTruncatedText display='flex' flexGrow={1} alignItems='center' justifyContent='space-between'>
				{/* } // TODO  data-type={type} */}
				<Box is='p' fontScale='p2' withTruncatedText mi={4}>
					{value}
				</Box>
				<Box display='flex' alignItems='center'>
					<ButtonGroup>
						<IconButton onClick={() => copy()} tiny icon='copy' title={t('Copy')} />

						{actions}
					</ButtonGroup>
				</Box>
			</Box>
		</Box>
	);
};
export default ContactInfoDetailsEntry;
