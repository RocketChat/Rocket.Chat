import type { HTMLAttributes } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';

export type MessageBodyProps = HTMLAttributes<HTMLDivElement> & {
	/**
	 * Cuts the body at two lines, as in list previews.
	 */
	clamp?: 2;
};

const MessageBody = ({ clamp, className, ...props }: MessageBodyProps) => (
	<div {...props} className={cx(cxx('rcx-message-body')({ clamp: !!clamp }), className)} />
);

export default MessageBody;
