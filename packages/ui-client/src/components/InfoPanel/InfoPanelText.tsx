import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

const wordBreak = css`
	word-break: break-word;
`;

// Curated surface: `withTruncatedText` toggles the truncation variation; `is` +
// `aria-labelledby` support the definition-list markup used by UserInfo; the flex
// props let a few call sites lay out inline content. These layout escape hatches
// are a call-site smell to revisit — prefer wrapping content in a Box instead.
export type InfoPanelTextProps = {
	children?: ReactNode;
	'aria-labelledby'?: string;
} & Pick<ComponentProps<typeof Box>, 'is' | 'withTruncatedText' | 'display' | 'flexDirection' | 'alignItems'>;

const InfoPanelText = (props: InfoPanelTextProps) => (
	<Box marginBlock={8} fontScale='p2' color='hint' className={wordBreak} {...props} />
);

export default InfoPanelText;
