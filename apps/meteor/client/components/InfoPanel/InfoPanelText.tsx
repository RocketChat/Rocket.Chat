import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const wordBreak = css`
	word-break: break-word;
`;

const InfoPanelText: FC<ComponentProps<typeof Box>> = (props) => (
	<Box mb='x8' fontScale='p2' color='hint' className={wordBreak} {...props} />
);

export default InfoPanelText;
