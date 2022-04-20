import { Box, Flex, Icon, Tabs, Tile, Grid } from '@rocket.chat/fuselage';
import React from 'react';
import Page from '../../components/Page';
import Kimetsu_1 from '../../../public/images/blog_images/Kimetsu_no_yaiba_1.jpg';

type Props = {};

const BlogView = (props: Props) => {
	return (
		<Page flexDirection='row'>
			<Page>
				<Box display='flex' justifyContent='center'>
					<Tabs>
						<Tabs.Item>anime</Tabs.Item>
						<Tabs.Item>art</Tabs.Item>
						<Tabs.Item>cook</Tabs.Item>
						<Tabs.Item>sport</Tabs.Item>
					</Tabs>
				</Box>
				<Page.Content>
					<Grid>
						<Grid.Item xs={4} md={4} lg={4}>
							<Tile>
								<Box>
									<div>
										<Icon name='avatar' />
										<span>Tanjiro Kamado</span>
									</div>
									<span>June</span>
								</Box>
								<p>
									Tanjiro Kamado is a fictional character and the main protagonist in Koyoharu Gotouge's manga Demon Slayer: Kimetsu no
									Yaiba #demonslayer
								</p>
								<div>
									<img src='' alt='blog image' />
								</div>
								<Box>
									<Icon name='reply' />
									<Icon name='star' />
									<Icon name='send' />
								</Box>
							</Tile>
						</Grid.Item>
					</Grid>
				</Page.Content>
			</Page>
		</Page>
	);
};

export default BlogView;
