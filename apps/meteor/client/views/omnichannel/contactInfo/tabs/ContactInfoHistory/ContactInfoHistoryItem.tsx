import type { Serialized } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Palette, IconButton } from '@rocket.chat/fuselage';
import type { ContactSearchChatsResult } from '@rocket.chat/rest-typings';
import { useTranslation, type TranslationKey } from '@rocket.chat/ui-contexts';
import React from 'react';

import { OmnichannelRoomIcon } from '../../../../../components/RoomIcon/OmnichannelRoomIcon';
import { usePreventPropagation } from '../../../../../hooks/usePreventPropagation';
import { useTimeAgo } from '../../../../../hooks/useTimeAgo';

type ContactInfoHistoryItemProps = Serialized<ContactSearchChatsResult> & {
	onClick: () => void;
};

const sourceTypeMap: { [key: string]: string } = {
	widget: 'Livechat',
	email: 'Email',
	sms: 'SMS',
	app: 'Apps',
	api: 'API',
	other: 'Other',
};

const ContactInfoHistoryItem = ({ source, lastMessage, closedAt, onClick }: ContactInfoHistoryItemProps) => {
	const t = useTranslation();
	const timeAgo = useTimeAgo();
	const preventPropagation = usePreventPropagation();

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
			borderBlockEndWidth={1}
			borderBlockEndColor='stroke-extra-light'
			borderBlockEndStyle='solid'
			className={['rcx-box--animated', customClass]}
			pi={24}
			pb={8}
			display='flex'
			flexDirection='column'
			onClick={onClick}
		>
			<Box display='flex' alignItems='center'>
				{source && <OmnichannelRoomIcon source={source} size='x18' placement='default' />}
				{source && (
					<Box mi={4} fontScale='p2b'>
						{t(sourceTypeMap[source?.type] as TranslationKey)}
					</Box>
				)}
				{lastMessage && (
					<Box mis={4} fontScale='c1'>
						{timeAgo(lastMessage.ts)}
					</Box>
				)}
			</Box>
			<Box minHeight='x24' alignItems='center' mbs={4} display='flex' justifyContent='space-between'>
				<Box>{!closedAt ? t('Conversation_in_progress') : t('Conversation_closed_without_comment')}</Box>
				<Box is='span' onClick={preventPropagation}>
					<IconButton icon='warning' tiny />
				</Box>
			</Box>
		</Box>
	);
};

export default ContactInfoHistoryItem;
