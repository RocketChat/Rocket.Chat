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

	const blogData = [
		{
			title: 'Companies use NFTs to boost image in metaverse',
			body: 'Companies use NFTs to boost image in metaverse Indian companies...'
		},
		{
			title: 'NFT platform bitsCrunch partners with MasterCard',
			body: 'Mastercard is entering the crypto space to facilitate...'
		},
		{
			title: 'NFT marketplace Hot Drops raises $2.4 million in seed funding',
			body: 'Hot Drops seeks to solve issues that have long plagued the entertainment industries...'
		},
		{
			title: 'Elon Musk takes a dig at Twitter, Web3 and NFTs, on Twitter',
			body: 'The worlds richest person in the past months has said he is a free speech absolutist...'
		},
		{
			title: 'Salman Khan-backed BollyCoin announces launch of Chulbul Pandey NFT collection',
			body: 'The NFT marketplace, which kick-started in October 2021, is aiming to get Bollywood into the Metaverse....'
		},
		{
			title: 'NFT marketplace Hot Drops raises $2.4 million in seed funding',
			body: 'Hot Drops seeks to solve issues that have long plagued the entertainment industries...'
		},
		{
			title: 'NFT marketplace Hot Drops raises $2.4 million in seed funding',
			body: 'Hot Drops seeks to solve issues that have long plagued the entertainment industries...'
		},
		{
			title: 'NFT marketplace Hot Drops raises $2.4 million in seed funding',
			body: 'Hot Drops seeks to solve issues that have long plagued the entertainment industries...'
		},
		{
			title: 'NFT marketplace Hot Drops raises $2.4 million in seed funding',
			body: 'Hot Drops seeks to solve issues that have long plagued the entertainment industries...'
		},
		{
			title: 'NFT marketplace Hot Drops raises $2.4 million in seed funding',
			body: 'Hot Drops seeks to solve issues that have long plagued the entertainment industries...'
		},
	]

	return (
		<div id='rocket-chat' className={[embeddedLayout ? 'embedded-view' : undefined, 'menu-nav'].filter(Boolean).join(' ')}>
			{!removeSidenav ? <BlazeTemplate template='sideNav' /> : null}
			<div
				className={['rc-old', 'main-content', 'content-background-color', readReceiptsEnabled ? 'read-receipts-enabled' : undefined]
					.filter(Boolean)
					.join(' ')}
			>
				<Flex.Container wrap='wrap' direction='row' justifyContent='start'>
					{blogData.map((blog, index) => (
						<Flex.Item key={index}>
							<BlogView title={blog.title} body={blog.body} />
						</Flex.Item>
					))}
				</Flex.Container>
			</div>
		</div>
	);
};

export default LayoutWithSidebar;
