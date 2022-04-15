import { Template } from 'meteor/templating';
import { Flex } from '@rocket.chat/fuselage';

import { settings } from '../../../../settings';
import './home.html'
import BlogView from '../../../../../client/views/root/MainLayout/BlogView'

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


Template.home.helpers({
	pageHeader() {
		return 'Top 10 Blog Posts';
	},
	blogs() {
		return blogData
	},
	BlogView() {
		return BlogView;
	},
});
