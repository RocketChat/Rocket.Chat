import { Box, Icon, Tabs, Grid } from '@rocket.chat/fuselage';
import React from 'react';
import Page from '../../components/Page';
import TopBar from '../../../client/topbar/TopBar';
import SingleBlogPost from './SingleBlogPost';

import './blog.css';

type Props = {};

const BlogView = (props: Props) => {
	const data = [
		{
			author: 'Tanjiro Kamado',
			location: 'Japan',
			content:
				"Tanjiro Kamado is a fictional character and the main protagonist in Koyoharu Gotouge's manga Demon Slayer: Kimetsu no Yaiba.",
			images: 'images/blog_images/Kimetsu_no_yaiba_1.jpg',
			createdAt: 'April',
		},
		{
			author: 'Zenitsu Agatsuma',
			location: 'Japan',
			content:
				'is one of the main protagonists of Demon Slayer: Kimetsu no Yaiba and along with Inosuke Hashibira, a travelling companion of Tanjiro Kamado and Nezuko Kamado.',
			images: 'images/blog_images/Kimetsu_no_yaiba_2.jpg',
			createdAt: 'April',
		},
		{
			author: 'Hashibira Inosuke',
			location: 'Japan',
			content:
				'is one of the main protagonists of Demon Slayer: Kimetsu no Yaiba and along with Zenitsu Agatsuma, a traveling companion of Tanjiro Kamado and Nezuko Kamado.',
			images: 'images/blog_images/Kimetsu_no_yaiba_3.png',
			createdAt: 'April',
		},
		{
			author: 'Nezuko Kamado',
			location: 'Japan',
			content: "Nezuko Kamado is a fictional character from Koyoharu Gotouge's manga Demon Slayer: Kimetsu no Yaiba.",
			images: 'images/blog_images/Kimetsu_no_yaiba_4.jpg',
			createdAt: 'April',
		},
		{
			author: 'Tanjiro Kamado',
			location: 'Japan',
			content: 'is a major supporting character of Demon Slayer: Kimetsu no Yaiba and a major character in the Entertainment District Arc.',
			images: 'images/blog_images/Kimetsu_no_yaiba_5.png',
			createdAt: 'April',
		},
	];
	return (
		<Page flexDirection='row'>
			<Page>
				<TopBar />
				<Box display='flex' justifyContent='space-between' style={{ marginTop: '20px' }}>
					<Tabs>
						<Tabs.Item>
							<Icon name='chevron-right' />
						</Tabs.Item>
						<Tabs.Item>anime</Tabs.Item>
						<Tabs.Item>art</Tabs.Item>
						<Tabs.Item>cook</Tabs.Item>
						<Tabs.Item>sport</Tabs.Item>
						<Tabs.Item>
							<Icon name='chevron-left' />
						</Tabs.Item>
					</Tabs>
				</Box>
				<Page.Content>
					<Grid style={{ overflowY: 'auto', overflowX: 'hidden' }}>
						{data.map((item, index) => (
							<Grid.Item xs={4} md={4} lg={6}>
								<SingleBlogPost key={index} {...item} />
							</Grid.Item>
						))}
					</Grid>
				</Page.Content>
			</Page>
		</Page>
	);
};

export default BlogView;
