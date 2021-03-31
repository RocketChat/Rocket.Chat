import React, { useEffect, useState } from 'react';
import { Box, Margins, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { FlowRouter } from 'meteor/kadira:flow-router';

import VerticalBar from '../../../../components/VerticalBar';
import UserCard from '../../../../components/UserCard';
import { FormSkeleton } from '../../Skeleton';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useRoute } from '../../../../contexts/RouterContext';
import { hasPermission } from '../../../../../app/authorization';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { ContactManagerInfo } from '../../../../../ee/client/omnichannel/ContactManager';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { UserStatus } from '../../../../components/UserStatus';


const wordBreak = css`
	word-break: break-word;
`;
const Label = (props) => <Box fontScale='p2' color='default' {...props} />;
const Info = ({ className, ...props }) => <UserCard.Info className={[className, wordBreak]} flexShrink={0} {...props}/>;
const CustomField = ({ id, value }) => {
	const t = useTranslation();
	const { value: data, phase: state, error } = useEndpointData(`livechat/custom-fields/${ id }`);
	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}
	if (error || !data || !data.customField) {
		return <Box mbs='x16'>{t('Custom_Field_Not_Found')}</Box>;
	}
	const { label } = data.customField;
	return label && <Box>
		<Label>{label}</Label>
		<Info>{value}</Info>
	</Box>;
};


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
		if (allCustomFields) {
			const { customFields: customFieldsAPI } = allCustomFields;
			setCustomFields(customFieldsAPI);
		}
	}, [allCustomFields, stateCustomFields]);

	const { value: data, phase: state, error } = useEndpointData(`omnichannel/contact?contactId=${ id }`);
	const { contact: { name, username, visitorEmails, phone, livechatData, ts, lastChat, contactManager } } = data || { contact: {} };
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

	const onChatHistory = () => {
		const { _id } = lastChat;
		FlowRouter.go(`/live/${ _id }/contact-chat-history`);
	};

	const showContactHistory = FlowRouter.getRouteName() === 'live';

	const displayName = name || username;

	return <>
		<VerticalBar.ScrollableContent p='x24'>
			<Margins block='x4'>
				{displayName && <>
					<Label>{`${ t('Name') } / ${ t('Username') }`}</Label>
					<Info style={{ display: 'flex' }}>
						<UserAvatar size='x40' title={username} username={username} />
						<UserCard.Username mis='x10' name={displayName} status={<UserStatus status={status} />} />
						{username && name && <Box display='flex' mis='x7' mb='x9' align='center' justifyContent='center'>({username})</Box>}
					</Info>
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
					<Label>{t('Created_at')}</Label>
					<Info>{formatDate(ts)}</Info>
				</>}

				{lastChat && <>
					<Label>{t('Last_Chat')}</Label>
					<Info>{formatDate(lastChat.ts)}</Info>
				</>}
				{ canViewCustomFields()
					&& livechatData
					&& Object.keys(livechatData).map((key) => checkIsVisibleAndScopeVisitor(key) && livechatData[key] && <CustomField key={key} id={key} value={livechatData[key]} />)
				}
				{ contactManager && <>
					<Label>{t('Contact_Manager')}</Label>
					<ContactManagerInfo username={contactManager.username} />
				</>
				}
			</Margins>
		</VerticalBar.ScrollableContent>
		<VerticalBar.Footer>
			<ButtonGroup stretch>
				{ showContactHistory && lastChat && <Button onClick={onChatHistory}><Icon name='history' size='x20'/> {t('Chat_History')}</Button>}
				<Button onClick={onEditButtonClick}><Icon name='pencil' size='x20'/> {t('Edit')}</Button>
			</ButtonGroup>
		</VerticalBar.Footer>
	</>;
}
