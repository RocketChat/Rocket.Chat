import { Template } from 'meteor/templating';
import { Flex } from '@rocket.chat/fuselage';

import { settings } from '../../../../settings';
import BlogView from '../../../../../client/views/root/MainLayout/BlogView'


Template.home.helpers({
	title() {
		return 'Top 10 Blog Posts';
	},
	body() {
		return <BlogView title='New Container' body='Container Body'/>
	},
});
