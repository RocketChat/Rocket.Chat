import { styled, View, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { strokeColors, surfaceColors, textIconColors } from '../../Theme';
import { borderWidth, size } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const SidepanelFrame = styled(View, {
	boxSizing: 'content-box',
	minWidth: 'auto',
	minHeight: 'auto',
	flexGrow: 1,
	flexShrink: 0,
	height: size('full'),
	color: String(textIconColors['font-default']),
	borderWidth: 0,
	borderLeftWidth: borderWidth('default'),
	borderRightWidth: borderWidth('default'),
	borderStyle: 'solid',
	borderColor: String(strokeColors['stroke-light']),
	backgroundColor: String(surfaceColors['surface-sidebar']),
});

export type SidepanelProps = HTMLAttributes<HTMLDivElement>;

const Sidepanel = ({ className, ...props }: SidepanelProps) => (
	<SidepanelFrame className={['rcx-sidepanel', className].filter(Boolean).join(' ')} {...(props as GetProps<typeof SidepanelFrame>)} />
);

export default withFuselageProvider(Sidepanel);
