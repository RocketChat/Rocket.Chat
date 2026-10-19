import { styled, View, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { strokeColors, surfaceColors } from '../../Theme';
import { borderWidth, spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const NavBarFrame = styled(View, {
	render: 'nav',
	boxSizing: 'content-box',
	minWidth: 'auto',
	minHeight: 'auto',
	flexDirection: 'row',
	flexShrink: 1,
	justifyContent: 'space-between',
	alignItems: 'center',
	width: '100%',
	paddingBlock: spacing('x8'),
	paddingInline: spacing('x16'),
	borderWidth: 0,
	borderBottomWidth: borderWidth('default'),
	borderStyle: 'solid',
	borderColor: String(strokeColors['stroke-light']),
	backgroundColor: String(surfaceColors['surface-sidebar']),
});

export type NavBarProps = HTMLAttributes<HTMLElement>;

const NavBar = (props: NavBarProps) => <NavBarFrame className='rcx-navbar' {...(props as GetProps<typeof NavBarFrame>)} />;

export default withFuselageProvider(NavBar);
