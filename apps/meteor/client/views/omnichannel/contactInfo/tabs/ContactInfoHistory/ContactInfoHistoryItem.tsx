import type { Serialized } from '@rocket.chat/core-typings';
import {
	Icon,
	IconButton,
	Item,
	ItemActions,
	ItemContent,
	ItemIcon,
	ItemLink,
	ItemMedia,
	ItemMeta,
	ItemRow,
	ItemTitle,
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
import { useTimeFromNow } from '../../../../../hooks/useTimeFromNow';
import { useOmnichannelSource } from '../../../hooks/useOmnichannelSource';
import AdvancedContactModal from '../../AdvancedContactModal';

export type ContactInfoHistoryItemProps = Serialized<ContactSearchChatsResult> & {
	onClick: () => void;
};

const ContactInfoHistoryItem = ({ source, lastMessage, verified, onClick }: ContactInfoHistoryItemProps) => {
	const { t } = useTranslation();
	const getTimeFromNow = useTimeFromNow(true);
	const setModal = useSetModal();
	const { data: hasLicense = false } = useHasLicenseModule('contact-id-verification');
	const { getSourceName } = useOmnichannelSource();

	const isVerified = hasLicense && verified;

	return (
		<Item role='listitem' size='extended' inset='lg'>
			{source && (
				<ItemMedia variant='icon'>
					<OmnichannelRoomIcon source={source} size='x18' placement='default' />
				</ItemMedia>
			)}
			<ItemContent>
				<ItemRow>
					<ItemTitle>
						<ItemLink is='button' onClick={onClick}>
							{getSourceName(source)}
						</ItemLink>
					</ItemTitle>
					{lastMessage && <ItemMeta>{getTimeFromNow(lastMessage.ts)}</ItemMeta>}
					{isVerified && (
						<ItemIcon label={t('Verified')} title={t('Verified')}>
							<Icon size='x16' name='success-circle' color='stroke-highlight' />
						</ItemIcon>
					)}
				</ItemRow>
				{lastMessage?.msg.trim() && (
					<MessageGenericPreview>
						<MessageGenericPreviewContent>
							<MessageGenericPreviewTitle>{t('Closing_chat_message')}:</MessageGenericPreviewTitle>
							<MessageGenericPreviewDescription clamp>{lastMessage?.msg}</MessageGenericPreviewDescription>
						</MessageGenericPreviewContent>
					</MessageGenericPreview>
				)}
			</ItemContent>
			{!isVerified && (
				<ItemActions>
					<IconButton
						title={t('Unverified')}
						aria-label={t('Unverified')}
						onClick={() => setModal(<AdvancedContactModal onCancel={() => setModal(null)} />)}
						icon='question-mark'
						small
					/>
				</ItemActions>
			)}
		</Item>
	);
};

export default ContactInfoHistoryItem;
