import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

const hoverUnderlineStyle = css`
	&:hover {
		text-decoration: underline;
	}
`;

type AttachmentAuthorTimestampProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentAuthorTimestamp = ({ href, ...props }: AttachmentAuthorTimestampProps) =>
	href ? (
		<Box is='a' href={href} className={hoverUnderlineStyle} color='default' fontScale='c1' {...props} />
	) : (
		<Box fontScale='c1' {...props} />
	);

export default AttachmentAuthorTimestamp;
