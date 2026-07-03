import type { MessageAttachmentBase } from '@rocket.chat/core-typings';

import AttachmentsItem from './attachments/AttachmentsItem';
import type { AudioAttachmentSource } from './attachments/file/AudioAttachment';

type AttachmentsProps = {
	attachments: MessageAttachmentBase[];
	id?: string | undefined;
	source?: AudioAttachmentSource;
};

const Attachments = ({ attachments, id, source }: AttachmentsProps) => {
	return (
		<>{attachments?.map((attachment, index) => <AttachmentsItem key={index} id={id} attachment={{ ...attachment }} source={source} />)}</>
	);
};

export default Attachments;
