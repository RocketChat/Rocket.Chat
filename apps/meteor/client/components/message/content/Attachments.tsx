import type { MessageAttachmentBase } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';

import AttachmentsItem from './attachments/AttachmentsItem';

type AttachmentsProps = {
	attachments: MessageAttachmentBase[];
	id?: string | undefined;
};

const Attachments = ({ attachments, id }: AttachmentsProps): ReactElement => {
	return <>{attachments?.map((attachment, index) => <AttachmentsItem key={index} id={id} attachment={{ ...attachment }} />)}</>;
};

export default Attachments;
