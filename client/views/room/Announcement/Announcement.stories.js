import React from 'react';

import { Announcement } from './Announcement';

export default {
	title: 'components/Announcement',
	component: Announcement,
};

export const Default = () =>
	<Announcement onClickOpen={alert}>Lorem Ipsum Indolor</Announcement>;
