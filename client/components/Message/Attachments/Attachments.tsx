import React, { FC } from 'react';

import { useBlockRendered } from '../hooks/useBlockRendered';
import { FileProp } from './Files/definitions/FileProp';
import Item from './Item';
import { AttachmentProps } from './definitions/AttachmentProps';

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
