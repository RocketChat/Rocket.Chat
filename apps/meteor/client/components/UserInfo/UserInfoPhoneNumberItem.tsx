import type { IUserPhoneNumber } from '@rocket.chat/core-typings';
import { Box, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import useClipboardWithToast from '../../hooks/useClipboardWithToast';
import { formatPhoneNumber } from '../../lib/formatPhoneNumber';

const UserInfoPhoneNumberItem = ({ number, label }: IUserPhoneNumber) => {
	const { t } = useTranslation();
	const formattedNumber = number.startsWith('+') ? formatPhoneNumber(number) : number;
	const { copy } = useClipboardWithToast(number);

	return (
		<Box is='li' display='flex' alignItems='center' justifyContent='space-between' gap={8}>
			<Box display='flex' flexDirection='column' minWidth={0}>
				{label && (
					<Box fontScale='p2' color='default' withTruncatedText>
						{label}
					</Box>
				)}
				<Box fontScale='p2' color='hint' withTruncatedText>
					{formattedNumber}
				</Box>
			</Box>
			<Box display='flex' flexShrink={0} gap={4}>
				<IconButton
					is='a'
					small
					icon='phone'
					href={`tel:${number}`}
					title={t('Call')}
					aria-label={`${t('Call')} ${label || formattedNumber}`}
				/>
				<IconButton
					small
					icon='copy'
					title={t('Copy_phone_number')}
					aria-label={`${t('Copy_phone_number')} ${label || formattedNumber}`}
					onClick={() => copy()}
				/>
			</Box>
		</Box>
	);
};

export default UserInfoPhoneNumberItem;
