import { styled, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { size, spacing } from '../../styleTokens';
import { Divider } from '../Divider';
import { SidepanelSectionFrame } from './SidepanelSection';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const SidepanelHeaderFrame = styled(SidepanelSectionFrame, {
	height: size('x44'),
	padding: 0,
	paddingInline: spacing('x16'),
});

export type SidepanelHeaderProps = HTMLAttributes<HTMLDivElement>;

const SidepanelHeader = ({ className, ...props }: SidepanelHeaderProps) => (
	<div className='rcx-sidepanel-header-wrapper'>
		<SidepanelHeaderFrame
			className={['rcx-sidepanel-header', className].filter(Boolean).join(' ')}
			{...(props as GetProps<typeof SidepanelHeaderFrame>)}
		/>
		<Divider rcx-sidepanel--divider marginBlockStart={-2} marginBlockEnd={0} />
	</div>
);

export default withFuselageProvider(SidepanelHeader);
