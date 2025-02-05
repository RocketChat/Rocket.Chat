import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

const wordBreak = css`
	word-break: break-word;
`;

type InfoPanelTextProps = ComponentPropsWithoutRef<typeof Box>;

const InfoPanelText = (props: InfoPanelTextProps) => <Box mb={8} fontScale='p2' color='hint' className={wordBreak} {...props} />;

export default InfoPanelText;
