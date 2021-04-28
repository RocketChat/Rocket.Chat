import React, { FC } from 'react';

import { useBlockRendered } from '../hooks/useBlockRendered';
import { AttachmentProps } from './AttachmentProps';
import { FileProp } from './FileProp';
import Item from './Item';

const Attachments: FC<{ attachments: Array<AttachmentProps>; file?: FileProp }> = ({
	attachments = null,
	file,
}): any => {
	const { className, ref } = useBlockRendered();
	return (
		<>
			<div className={className} ref={ref as any} />
			{attachments &&
				attachments.map((attachment, index) => (
					<Item key={index} file={file} attachment={attachment} />
				))}
		</>
	);
};

export default Attachments;
