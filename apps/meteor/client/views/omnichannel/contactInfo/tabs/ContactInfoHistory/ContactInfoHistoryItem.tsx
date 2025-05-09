import type { Serialized } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import {
	Box,
	Palette,
	IconButton,
	Icon,
	MessageGenericPreview,
	MessageGenericPreviewContent,
	MessageGenericPreviewDescription,
	MessageGenericPreviewTitle,
} from '@rocket.chat/fuselage';
import type { ContactSearchChatsResult } from '@rocket.chat/rest-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { OmnichannelRoomIcon } from '../../../../../components/RoomIcon/OmnichannelRoomIcon';
import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';
import { usePreventPropagation } from '../../../../../hooks/usePreventPropagation';
import { useTimeFromNow } from '../../../../../hooks/useTimeFromNow';
import { useOmnichannelSource } from '../../../hooks/useOmnichannelSource';
import AdvancedContactModal from '../../AdvancedContactModal';

type ContactInfoHistoryItemProps = Serialized<ContactSearchChatsResult> & {
	onClick: () => void;
};

const ContactInfoHistoryItem = ({ source, lastMessage, verified, onClick }: ContactInfoHistoryItemProps) => {
	const { t } = useTranslation();
	const getTimeFromNow = useTimeFromNow(true);
	const setModal = useSetModal();
	const preventPropagation = usePreventPropagation();
	const hasLicense = useHasLicenseModule('contact-id-verification') as boolean;
	const { getSourceName } = useOmnichannelSource();

	const customClass = css`
		&:hover {
			cursor: pointer;
		}

		&:hover,
		&:focus {
			background: ${Palette.surface['surface-hover']};
		}
	`;

	return (
		<Box
			tabIndex={0}
			role='listitem'
			aria-label={getSourceName(source)}
			borderBlockEndWidth={1}
			borderBlockEndColor='stroke-extra-light'
			borderBlockEndStyle='solid'
			className={['rcx-box--animated', customClass]}
			pi={24}
			pb={12}
			display='flex'
			flexDirection='column'
			onClick={onClick}
		>
			<Box display='flex' justifyContent='space-between'>
				<Box display='flex' alignItems='center'>
					{source && <OmnichannelRoomIcon source={source} size='x18' placement='default' />}
					{source && (
						<Box mi={4} fontScale='p2b'>
							{getSourceName(source)}
						</Box>
					)}
					{lastMessage && (
						<Box mis={4} fontScale='c1'>
							{getTimeFromNow(lastMessage.ts)}
						</Box>
					)}
				</Box>
				<Box mis={4} is='span' onClick={preventPropagation}>
					{hasLicense && verified ? (
						<Icon title={t('Verified')} mis={4} size='x16' name='success-circle' color='stroke-highlight' />
					) : (
						<IconButton
							title={t('Unverified')}
							onClick={() => setModal(<AdvancedContactModal onCancel={() => setModal(null)} />)}
							icon='question-mark'
							tiny
						/>
					)}
				</Box>
			</Box>
			{lastMessage?.msg.trim() && (
				<Box width='full' mbs={8}>
					<MessageGenericPreview>
						<MessageGenericPreviewContent>
							<MessageGenericPreviewTitle>{t('Closing_chat_message')}:</MessageGenericPreviewTitle>
							<MessageGenericPreviewDescription clamp>{lastMessage?.msg}</MessageGenericPreviewDescription>
						</MessageGenericPreviewContent>
					</MessageGenericPreview>
				</Box>
			)}
		</Box>
	);
};

export default ContactInfoHistoryItem;
