import type { ILivechatContactChannel, Serialized } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation, type TranslationKey } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';

import { OmnichannelRoomIcon } from '../../../../../components/RoomIcon/OmnichannelRoomIcon';
import { useTimeAgo } from '../../../../../hooks/useTimeAgo';
import { useBlockChannel } from './useBlockChannel';

type ContactInfoChannelsItemProps = Serialized<ILivechatContactChannel>;

const sourceTypeMap: { [key: string]: string } = {
	widget: 'Livechat',
	email: 'Email',
	sms: 'SMS',
	app: 'Apps',
	api: 'API',
	other: 'Other',
};

const ContactInfoChannelsItem = ({ visitorId, details, blocked, lastChat }: ContactInfoChannelsItemProps) => {
	const t = useTranslation();
	const timeAgo = useTimeAgo();
	const [showButton, setShowButton] = useState(false);
	const handleBlockContact = useBlockChannel({ visitorId, blocked });

	const customClass = css`
		&:hover,
		&:focus {
			background: ${Palette.surface['surface-hover']};
		}
	`;

	const menuItems: GenericMenuItemProps[] = [
		{
			id: 'block',
			icon: 'ban',
			content: blocked ? t('Unblock') : t('Block'),
			variant: 'danger',
			onClick: handleBlockContact,
		},
	];

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
				{showButton && <GenericMenu detached title={t('Options')} sections={[{ items: menuItems }]} tiny />}
			</Box>
		</Box>
	);
};

export default ContactInfoChannelsItem;
