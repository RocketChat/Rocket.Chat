import React from 'react';

import RoomInfo from '../../components/basic/RoomInfo';

const clickHide = () => console.log('hide');
const clickLeave = () => console.log('leave');
const clickEdit = () => console.log('edit');
const clickDelete = () => console.log('delete');

const room = {
	name: 'rocketchat-frontend-team',
	description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
	announcement: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
	topic: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
	type: 'p',
	rid: 'bvgFyg7BT4D36nqpG',
	onClickHide: clickHide,
	onClickLeave: clickLeave,
	onClickEdit: clickEdit,
	onClickDelete: clickDelete,
};

export default () => <RoomInfo icon='lock' {...room} />;
