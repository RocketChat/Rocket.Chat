import type { MessageAttachmentBase } from '@rocket.chat/core-typings';

import AttachmentsItem from './attachments/AttachmentsItem';
import type { AudioAttachmentSource } from './attachments/file/AudioAttachment';

export type AttachmentsProps = {
	attachments: MessageAttachmentBase[];
	id?: string | undefined;
	source?: AudioAttachmentSource;
	/** Prefixes nested attachments' collapse-state keys so they don't collide with the top-level ones. */
	keyPrefix?: string;
};

const Attachments = ({ attachments, id, source, keyPrefix }: AttachmentsProps) => {
	return (
		<>
			{attachments?.map((attachment, index) => {
				const path = keyPrefix ? `${keyPrefix}-${index}` : String(index);
				return <AttachmentsItem key={index} id={id} attachment={{ ...attachment }} source={source} path={path} />;
			})}
		</>
	);
};

export default Attachments;
