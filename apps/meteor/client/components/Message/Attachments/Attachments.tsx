import React, { FC } from 'react';

import { FileProp } from '@rocket.chat/core-typings';
import { MessageAttachmentBase } from '@rocket.chat/core-typings';
import { useBlockRendered } from '../hooks/useBlockRendered';
import Item from './Item';

const Attachments: FC<{ attachments: Array<MessageAttachmentBase>; file?: FileProp }> = ({ attachments = null, file }): any => {
	const { className, ref } = useBlockRendered();
	return (
		<>
			<div className={className} ref={ref as any} />
			{attachments?.map((attachment, index) => (
				<Item key={index} file={file} attachment={attachment} />
			))}
		</>
	);
};

export default Attachments;
