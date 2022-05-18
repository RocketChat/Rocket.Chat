import { Meteor } from 'meteor/meteor';
import React, { ReactElement, useState } from 'react';
import { isMobile } from 'react-device-detect';

import BottomBar from '../../components/BottomBar';
import Page from '../../components/Page';
import TopBar from '../../topbar/TopBar';
import SingleBlogPost from '../blog/SingleBlogPost';

const LandingView = (): ReactElement => {
	const [blogResults, setBlogResults] = useState([]);

	Meteor.startup(() => {
		if (!blogResults.length)
			Meteor.call('getBlogs', 10, (error, result) => {
				// TODO: Add a success and error messages
				if (result) {
					setBlogResults(result);
				} else {
					console.log(error, 'error');
				}
			});
	});
	return (
		<Page flexDirection='row'>
			<Page>
				<TopBar />
				<h3 style={{ marginLeft: '20px', marginTop: '10px', fontSize: '20px' }}>Top 10 Blog Posts</h3>
				<Page.Content>{blogResults.length && blogResults.map((result, index) => <SingleBlogPost key={index} {...result} />)}</Page.Content>
				{isMobile ? <BottomBar /> : null}
			</Page>
		</Page>
	);
};

export default LandingView;
