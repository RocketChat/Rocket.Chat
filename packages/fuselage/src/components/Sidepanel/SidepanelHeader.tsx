import { css } from '@rocket.chat/css-in-js';
import { styled, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { strokeColors } from '../../Theme';
import { useStyle } from '../../hooks/useStyle';
import { size, spacing } from '../../styleTokens';
import { Divider } from '../Divider';
import { SidepanelSectionFrame } from './SidepanelSection';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const SidepanelHeaderFrame = styled(SidepanelSectionFrame, {
	height: size('x44'),
	padding: 0,
	paddingInline: spacing('x16'),
});

// Divider has no variant for the panel's line, which overlaps the header's bottom edge
const panelLine = css`
	margin-block: ${spacing('neg-x2')} ${spacing('none')};
	border-color: ${strokeColors['stroke-light']};
`;

export type SidepanelHeaderProps = HTMLAttributes<HTMLDivElement>;

const SidepanelHeader = ({ className, ...props }: SidepanelHeaderProps) => {
	const lineClassName = useStyle(panelLine, undefined);

	return (
		<div className='rcx-sidepanel-header-wrapper'>
			<SidepanelHeaderFrame
				className={['rcx-sidepanel-header', className].filter(Boolean).join(' ')}
				{...(props as GetProps<typeof SidepanelHeaderFrame>)}
			/>
			<Divider className={`rcx-sidepanel--divider ${lineClassName}`} />
		</div>
	);
};

export default withFuselageProvider(SidepanelHeader);
