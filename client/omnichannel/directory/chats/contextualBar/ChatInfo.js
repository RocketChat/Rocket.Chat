import React from 'react';
import moment from 'moment';
import { Box, Margins, Tag } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';
// import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import VerticalBar from '../../../../components/VerticalBar';
import UserCard from '../../../../components/UserCard';
import { FormSkeleton } from '../../Skeleton';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { useTranslation } from '../../../../contexts/TranslationContext';
// import { useRoute } from '../../contexts/RouterContext';
// import { hasPermission } from '../../../app/authorization';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
// import { ContactManagerInfo } from '../../../ee/client/omnichannel/ContactManager';


const wordBreak = css`
	word-break: break-word;
`;
const Label = (props) => <Box fontScale='p2' color='default' {...props} />;
const Info = ({ className, ...props }) => <UserCard.Info className={[className, wordBreak]} flexShrink={0} {...props}/>;

export function ChatInfo({ id }) {
	const t = useTranslation();
	// const directoryRoute = useRoute('omnichannel-directory');

	// const { value: allCustomFields, phase: stateCustomFields } = useEndpointData('livechat/custom-fields');

	// const [customFields, setCustomFields] = useState([]);

	const formatDate = useFormatDate();


	// const onEditButtonClick = useMutableCallback(() => directoryRoute.push({
	// 	tab: 'contacts',
	// 	context: 'edit',
	// 	id,
	// }));

	// useEffect(() => {
	// 	if (allCustomFields) {
	// 		const { customFields: customFieldsAPI } = allCustomFields;
	// 		setCustomFields(customFieldsAPI);
	// 	}
	// }, [allCustomFields, stateCustomFields]);

	const { value: data, phase: state, error } = useEndpointData(`rooms.info?roomId=${ id }`);
	const { room: { ts, tags, closedAt } } = data || { room: {} };

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	if (error || !data || !data.room) {
		return <Box mbs='x16'>{t('Room_not_found')}</Box>;
	}

	console.log(data.room);

	// const checkIsVisibleAndScopeVisitor = (key) => {
	// 	const field = customFields.find(({ _id }) => _id === key);
	// 	if (field && field.visibility === 'visible' && field.scope === 'visitor') { return true; }
	// 	return false;
	// };

	return <>
		<VerticalBar.ScrollableContent p='x24'>
			<Margins block='x4'>
				{ts && <>
					<Label>{t('Created_at')}</Label>
					<Info>{formatDate(ts)}</Info>
				</>}
				{closedAt && <>
					<Label>{t('Chat_Duration')}</Label>
					<Info>{moment(closedAt).from(moment(ts), true)}</Info>
				</>}
				{tags && tags.length > 0 && <>
					<Label>{t('Tags')}</Label>
					<Info>
						{tags.map((tag) => (
							<Box style={{ whiteSpace: 'nowrap', overflow: tag.length > 10 ? 'hidden' : 'visible', textOverflow: 'ellipsis' }} key={tag} mie='x4'>
								<Tag style={{ display: 'inline' }} disabled>{tag}</Tag>
							</Box>
						))}
					</Info>
				</>}
				{/* { contactManager && <>
					<Label>{t('Contact_Manager')}</Label>
					<ContactManagerInfo username={contactManager.username} />
				</>
				} */}
			</Margins>
		</VerticalBar.ScrollableContent>
	</>;
}
