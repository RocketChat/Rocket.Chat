import React, { useCallback, useMemo } from 'react';
import { Field, TextInput, TextAreaInput, PasswordInput, MultiSelectFiltered, Box, ToggleSwitch, Icon } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { isEmail } from '../../../app/utils/lib/isEmail.js';
import VerticalBar from '../../components/basic/VerticalBar';
import UserAvatar from '../../components/basic/avatar/UserAvatar';
import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import { FormSkeleton } from './Skeleton';

export default function AgentEdit({ uid, ...props }) {
	const t = useTranslation();
	const { data, state } = useEndpointDataExperimental(`livechat/users/agent/${ uid }`);

	if (state === 'LOADING') {
		return <FormSkeleton/>;
	}
	console.log(data);
	
	const { user } = data || { user: {} };
	const {
		name,
		username,
		email,
	} = user;


	return <VerticalBar.ScrollableContent is='form' { ...props }>
		<UserAvatar margin='auto' size={'x332'} title={username} username={username}/>
		<Field>
			<Field.Label>{t('Name')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={name} disabled/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Username')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={username} disabled addon={<Icon name='at' size='x20'/>}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Email')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={email} disabled addon={<Icon name='mail' size='x20'/>}/>
			</Field.Row>

		</Field>
	</VerticalBar.ScrollableContent>;
}
