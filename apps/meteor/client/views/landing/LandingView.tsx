import { Modal, Button, ButtonGroup, Box, Margins } from '@rocket.chat/fuselage';
import React, { ReactElement, useEffect, useState } from 'react';

import BottomBar from '../../components/BottomBar';
import Page from '../../components/Page';
import TopBar from '../../topbar/TopBar';
import SingleBlogPost from '../blog/SingleBlogPost';

type Props = {
	title: string;
	body: string;
};

const LandingView = ({ title, body }: Props): ReactElement => {
	const [blogResults, setBlogResults] = useState([]);
	useEffect(() => {
		Meteor.call('getBlogs', 10, (error, result) => {
			// TODO: Add a success and error messages
			setBlogResults(result.records);
		});
	}, []);
	return (
		<Page flexDirection='row'>
			<Page>
				<TopBar />
				<h3 style={{ marginLeft: '20px', marginTop: '10px', fontSize: '20px' }}>Top 10 Blog Posts</h3>
				<Page.Content>{blogResults.length && blogResults.map((result, index) => <SingleBlogPost {...result} />)}</Page.Content>
				<BottomBar />
			</Page>
		</Page>
	);
};

export default LandingView;
