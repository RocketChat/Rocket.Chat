import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

const wordBreak = css`
	word-break: break-word;
`;

const InfoPanelText: FC<ComponentProps<typeof Box>> = (props) => (
	<Box mb={8} fontScale='p2' color='hint' className={wordBreak} {...props} />
);

export default InfoPanelText;
