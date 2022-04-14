import React, { ReactElement, ReactNode, useCallback } from 'react';
import { Flex } from '@rocket.chat/fuselage';


import { useLayout } from '../../../contexts/LayoutContext';
import { useCurrentRoute, useRoutePath } from '../../../contexts/RouterContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import BlazeTemplate from '../BlazeTemplate';
import BlogView from './BlogView'

const LayoutWithSidebar = ({ children }: { children: ReactNode }): ReactElement => {
	const { isEmbedded: embeddedLayout } = useLayout();
	const [currentRouteName = '', currentParameters = {}] = useCurrentRoute();
	const currentRoutePath = useRoutePath(currentRouteName, currentParameters);
	const removeSidenav = useReactiveValue(
		useCallback(() => embeddedLayout && !currentRoutePath?.startsWith('/admin'), [currentRoutePath, embeddedLayout]),
	);
	const readReceiptsEnabled = useSetting('Message_Read_Receipt_Store_Users');

	return (
		<div id='rocket-chat' className={[embeddedLayout ? 'embedded-view' : undefined, 'menu-nav'].filter(Boolean).join(' ')}>
			{!removeSidenav ? <BlazeTemplate template='sideNav' /> : null}
			<div
				className={['rc-old', 'main-content', 'content-background-color', readReceiptsEnabled ? 'read-receipts-enabled' : undefined]
					.filter(Boolean)
					.join(' ')}
			>
				<Flex.Container wrap='wrap' direction='row' justifyContent='start'>
					<Flex.Item>
						<BlogView title={'Companies use NFTs to boost image in metaverse'} body={'Companies use NFTs to boost image in metaverse Indian companies...'} />
					</Flex.Item>
					<Flex.Item>
						<BlogView title={'Companies use NFTs to boost image in metaverse'} body={'Companies use NFTs to boost image in metaverse Indian companies...'} />
					</Flex.Item>
					<Flex.Item>
						<BlogView title={'Companies use NFTs to boost image in metaverse'} body={'Companies use NFTs to boost image in metaverse Indian companies...'} />
					</Flex.Item>
				</Flex.Container>
			</div>
		</div>
	);
};

export default LayoutWithSidebar;
