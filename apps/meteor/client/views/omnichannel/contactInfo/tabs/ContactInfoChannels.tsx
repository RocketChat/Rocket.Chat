import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { ContextualbarScrollableContent } from '../../../../components/Contextualbar';
import { OmnichannelRoomIcon } from '../../../../components/RoomIcon/OmnichannelRoomIcon';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { useOmnichannelRoom } from '../../../room/contexts/RoomContext';
import ContactInfoHistoryItem from '../components/ContactInfoHistoryItem';

const dummyData = [
	{
		id: '1',
		name: 'WhatsApp',
		number: '+1 406 555 0120 (360Dialog)',
		block: false,
		ts: new Date(),
	},
	{
		id: '2',
		name: 'Custom',
		block: false,
		ts: new Date(),
	},
	{
		id: '3',
		name: 'Blocked',
		block: true,
		ts: new Date(),
	},
];

const ContactInfoChannels = () => {
	// const t = useTranslation();
	// const room = useOmnichannelRoom();
	// const formatDate = useFormatDate();

	const blockedContacts = dummyData.filter((data) => data.block);

	return (
		<ContextualbarScrollableContent>
			<Box fontScale='p2m'>Last contacts</Box>
			{dummyData.map(
				(data) => !data.block && <ContactInfoHistoryItem key={data.id} name={data.name} description={data.number} time={data.ts} />,
			)}
			{blockedContacts && blockedContacts.length > 0 && (
				<>
					<Box fontScale='p2m'>Blocked contacts</Box>
					{blockedContacts.map((data) => (
						<ContactInfoHistoryItem key={data.id} name={data.name} description={data.number} time={data.ts} />
					))}
				</>
			)}
		</ContextualbarScrollableContent>
	);
};

export default ContactInfoChannels;
