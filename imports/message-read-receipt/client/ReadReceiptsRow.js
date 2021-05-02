import React from 'react';
import { Box, Tag, Modal, ButtonGroup, Button, Avatar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import Emoji from '../../../../client/components/Emoji';
import { openUserCard } from '../../../ui/client/lib/UserCard';


export default function ReadReceiptsRow({ rid }) {
	const t = useTranslation();
	const onClick = useMutableCallback((e) => {

	});

	return <>
        <li class="read-receipts__user background-transparent-dark-hover">
            {{> avatar username=user.username}}
            <Avatar
                key={index}
                size='x48'
                title={username}
                url={avatarUrl}
                data-username={username}
			/>
            <div class="read-receipts__name color-primary-font-color">{{displayName}}</div>
            <span class="read-receipts__time color-info-font-color" title="{{dateTime}}">{{time}}</span>
        </li>
	</>;
}