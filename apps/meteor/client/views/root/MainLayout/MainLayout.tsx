import React, { ReactElement, useMemo } from 'react';
import { Flex } from '@rocket.chat/fuselage';

import BlazeTemplate from '../BlazeTemplate';
import AuthenticationCheck from './AuthenticationCheck';
import Preload from './Preload';
import { useCustomScript } from './useCustomScript';
import BlogView from './BlogView'

type MainLayoutProps = {
	center?: string;
} & Record<string, unknown>;

const MainLayout = ({ center }: MainLayoutProps): ReactElement => {
	useCustomScript();

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
		<Preload>
			<AuthenticationCheck>{useMemo(() => (center ?
				<>
					{/* <Flex.Container wrap='wrap' direction='row' justifyContent='start'>{blogData.map((blog, index) => (<Flex.Item key={index}><BlogView title={blog.title} body={blog.body} /></Flex.Item>))}</Flex.Container> */}
					<BlazeTemplate template={center} />
				</>
				: null), [center])}</AuthenticationCheck>
		</Preload>
	);
};

export default MainLayout;
