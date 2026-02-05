import type { IMessage, MessageAttachmentBase } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';

import AttachmentsItem from './attachments/AttachmentsItem';

type AttachmentsProps = {
	attachments: MessageAttachmentBase[];
	id?: string | undefined;
	mentions?: IMessage['mentions'];
};

const Attachments = ({ attachments, id, mentions }: AttachmentsProps): ReactElement => {
	return (
		<>
			{attachments?.map((attachment, index) => <AttachmentsItem key={index} id={id} attachment={{ ...attachment }} mentions={mentions} />)}
		</>
	);
};

export default Attachments;
