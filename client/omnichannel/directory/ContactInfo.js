import React, { useEffect, useState } from 'react';
import { Box, Margins, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import VerticalBar from '../../components/VerticalBar';
import UserCard from '../../components/UserCard';
import { FormSkeleton } from './Skeleton';
import { useEndpointData } from '../../hooks/useEndpointData';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute } from '../../contexts/RouterContext';
import { hasPermission } from '../../../app/authorization';
import { useFormatDate } from '../../hooks/useFormatDate';
import UserAvatar from '../../components/avatar/UserAvatar';
import { UserStatus } from '../../components/UserStatus';
import { AsyncStatePhase } from '../../hooks/useAsyncState';

const wordBreak = css`
	word-break: break-word;
`;
const Label = (props) => <Box fontScale='p2' color='default' {...props} />;
const Info = ({ className, ...props }) => <UserCard.Info className={[className, wordBreak]} flexShrink={0} {...props}/>;

function ContactManagerField({ username }) {
	const { value: data, phase: state } = useEndpointData(`users.info?username=${ username }`);
	if (!data && state === AsyncStatePhase.LOADING) { return null; }
	const { user: { name, status } } = data;
	return <>
		<Info style={{ display: 'flex' }}>
			<UserAvatar title={username} username={username} />
			<UserCard.Username mis='x10' name={username} status={<UserStatus status={status} />} />
			<Box display='flex' mis='x7' mb='x9' align='center' justifyContent='center'>({name})</Box>
		</Info>
	</>;
}

export function ContactInfo({ id }) {
	const t = useTranslation();
	const directoryRoute = useRoute('omnichannel-directory');

	const { value: allCustomFields, phase: stateCustomFields } = useEndpointData('livechat/custom-fields');

	const [customFields, setCustomFields] = useState([]);

	const formatDate = useFormatDate();


	const canViewCustomFields = () => hasPermission('view-livechat-room-customfields');

	const onEditButtonClick = useMutableCallback(() => directoryRoute.push({
		tab: 'contacts',
		context: 'edit',
		id,
	}));

	useEffect(() => {
		if (allCustomFields && stateCustomFields === AsyncStatePhase.DONE) {
			const { customFields: customFieldsAPI } = allCustomFields;
			setCustomFields(customFieldsAPI);
		}
	}, [allCustomFields, stateCustomFields]);


	const { value: data, phase: state, error } = useEndpointData(`contact?contactId=${ id }`);

	const { contact: { name, username, visitorEmails, phone, livechatData, ts, lastChat, user } } = data || { contact: {} };

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	if (error || !data || !data.contact) {
		return <Box mbs='x16'>{t('Contact_not_found')}</Box>;
	}

	const checkIsVisibleAndScopeVisitor = (key) => {
		const field = customFields.find(({ _id }) => _id === key);
		if (field && field.visibility === 'visible' && field.scope === 'visitor') { return true; }
		return false;
	};

	return <>
		<VerticalBar.ScrollableContent p='x24'>
			<Margins block='x4'>
				{username && username !== name && <>
					<Label>{t('Name/Username')}</Label>
					<Info>{`${ name }/${ username }`}</Info>
				</>}
				{visitorEmails && visitorEmails.length && <>
					<Label>{t('Email')}</Label>
					<Info>{visitorEmails[0].address}</Info>
				</>}
				{phone && phone.length && <>
					<Label>{t('Phone')}</Label>
					<Info>{phone[0].phoneNumber}</Info>
				</>}
				{ts && <>
					<Label>{t('CreatedAt')}</Label>
					<Info>{formatDate(ts)}</Info>
				</>}

				{lastChat && <>
					<Label>{t('LastChat')}</Label>
					<Info>{formatDate(lastChat.ts)}</Info>
				</>}

				{ canViewCustomFields() && livechatData && Object.keys(livechatData).map((key) => <Box key={key}>
					{ checkIsVisibleAndScopeVisitor(key) && livechatData[key] && <><Label>{key}</Label>
						<Info>{livechatData[key]}</Info></>
					}
				</Box>)
				}
				{lastChat && <>
					<Label>{t('LastChat')}</Label>
					<Info>{formatDate(lastChat.ts)}</Info>
				</>}
				{ user && <>
					<Label>{t('Contact_Manager')}</Label>
					<ContactManagerField username={user.username} />
				</>
				}
			</Margins>
		</VerticalBar.ScrollableContent>
		<VerticalBar.Footer>
			<ButtonGroup stretch>
				{/* <Button><Icon name='history' size='x20'/> {t('Chat_History')}</Button> */}
				<Button onClick={onEditButtonClick}><Icon name='pencil' size='x20'/> {t('Edit')}</Button>
			</ButtonGroup>
		</VerticalBar.Footer>
	</>;
}
