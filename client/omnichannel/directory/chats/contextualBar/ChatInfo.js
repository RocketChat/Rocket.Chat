import React from 'react';
import moment from 'moment';
import { Box, Margins, Tag } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

import VerticalBar from '../../../../components/VerticalBar';
import UserCard from '../../../../components/UserCard';
import { FormSkeleton } from '../../Skeleton';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { ContactManagerInfo } from '../../../../../ee/client/omnichannel/ContactManager';


const wordBreak = css`
	word-break: break-word;
`;
const Label = (props) => <Box fontScale='p2' color='default' {...props} />;
const Info = ({ className, ...props }) => <UserCard.Info className={[className, wordBreak]} flexShrink={0} {...props}/>;

const DepartmentField = ({ departmentId }) => {
	const t = useTranslation();
	const { value: data, phase: state } = useEndpointData(`livechat/department/${ departmentId }`);
	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}
	const { department: { name } } = data || { department: {} };
	return <>
		<Label>{t('Department')}</Label>
		<Info>{name}</Info>
	</>;
};

const ContactField = ({ name, uid }) => {
	const t = useTranslation();
	const { value: data, phase: state } = useEndpointData(`omnichannel/contact?contactId=${ uid }`);
	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}
	const { contact: { contactManager } } = data || { contact: { contactManager: {} } };
	if (contactManager) {
		return <>
			<Label>{t('Contact')}</Label>
			<ContactManagerInfo username={contactManager.username} />
		</>;
	}
	return <>
		<Label>{t('Contact')}</Label>
		<Info>
			{name}
		</Info>
	</>;
};

export function ChatInfo({ id }) {
	const t = useTranslation();

	const formatDate = useFormatDate();

	const { value: data, phase: state, error } = useEndpointData(`rooms.info?roomId=${ id }`);
	const { room: { fname, ts, tags, closedAt, departmentId, v: { _id } } } = data || { room: { v: { } } };

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	if (error || !data || !data.room) {
		return <Box mbs='x16'>{t('Room_not_found')}</Box>;
	}

	console.log(data.room);

	return <>
		<VerticalBar.ScrollableContent p='x24'>
			<Margins block='x4'>
				<ContactField uid={_id} name={fname} />
				{ departmentId && <DepartmentField departmentId={departmentId} /> }
				{tags && tags.length > 0 && <>
					<Label>{t('Tags')}</Label>
					<Info>
						{tags.map((tag) => (
							<Box key={tag} mie='x4' display='inline'>
								<Tag style={{ display: 'inline' }} disabled>{tag}</Tag>
							</Box>
						))}
					</Info>
				</>}
				{closedAt && <>
					<Label>{t('Chat_Duration')}</Label>
					<Info>{moment(closedAt).from(moment(ts), true)}</Info>
				</>}
				{ts && <>
					<Label>{t('Created_at')}</Label>
					<Info>{formatDate(ts)}</Info>
				</>}
				{closedAt && <>
					<Label>{t('Closed_At')}</Label>
					<Info>{formatDate(closedAt)}</Info>
				</>}
			</Margins>
		</VerticalBar.ScrollableContent>
	</>;
}
