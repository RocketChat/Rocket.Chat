import type { ILivechatContactChannel, Serialized } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Palette, IconButton } from '@rocket.chat/fuselage';
import { useTranslation, type TranslationKey } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';

import { OmnichannelRoomIcon } from '../../../../../components/RoomIcon/OmnichannelRoomIcon';
import { useTimeAgo } from '../../../../../hooks/useTimeAgo';

type ContactInfoChannelsItemProps = Serialized<ILivechatContactChannel>;

const sourceTypeMap: { [key: string]: string } = {
	widget: 'Livechat',
	email: 'Email',
	sms: 'SMS',
	app: 'Apps',
	api: 'API',
	other: 'Other',
};

const ContactInfoChannelsItem = ({ details, blocked, lastChat }: ContactInfoChannelsItemProps) => {
	const t = useTranslation();
	const timeAgo = useTimeAgo();
	const [showButton, setShowButton] = useState(false);

	const customClass = css`
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
			onFocus={() => setShowButton(true)}
			onPointerEnter={() => setShowButton(true)}
			onPointerLeave={() => setShowButton(false)}
		>
			<Box display='flex' alignItems='center'>
				{details && <OmnichannelRoomIcon source={details} size='x18' placement='default' />}
				{details && (
					<Box mi={4} fontScale='p2b'>
						{t(sourceTypeMap[details?.type] as TranslationKey)} {blocked && `(${t('Blocked')})`}
					</Box>
				)}
				{lastChat && (
					<Box mis={4} fontScale='c1'>
						{timeAgo(lastChat.ts)}
					</Box>
				)}
			</Box>
			<Box minHeight='x24' alignItems='center' mbs={4} display='flex' justifyContent='space-between'>
				<Box>{details?.destination}</Box>
				{showButton && <IconButton icon='menu' tiny />}
			</Box>
		</Box>
	);
};

export default ContactInfoChannelsItem;
