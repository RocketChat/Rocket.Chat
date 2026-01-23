import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

const wordBreak = css`
	word-break: break-word;
`;

type AuditModalTextProps = ComponentPropsWithoutRef<typeof Box>;

const AuditModalText = (props: AuditModalTextProps) => <Box fontScale='p2' color='default' className={wordBreak} {...props} />;

export default AuditModalText;
