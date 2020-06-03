import React from 'react';

import ThreadsList from './ThreadsList';

const msg = {
	msg: 'Lorem ipsum dolor sit amet.',
	username: 'Guilherme.gazzo.guilherme.gazzo.guilherme.gazzo',
	ts: '03:34 PM',
	replies: 1,
	parcipants: 2,
};

const msg2 = {
	msg: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla convallis quam rutrum bibendum pulvinar. Nulla in volutpat est, sit amet venenatis urna. Donec lobortis aliquet augue eget mollis. Vivamus non luctus orci. Nulla et aliquam eros, et dapibus metus. Sed non urna non quam tincidunt molestie nec in lacus. Curabitur ut vulputate augue. Donec in malesuada mauris, sit amet consequat sapien. Sed rutrum, odio venenatis condimentum sodales, ante lorem tempor risus, eu volutpat libero odio in sem. Aliquam id nisl magna.

	Duis non ipsum quis tellus scelerisque pellentesque. Curabitur in aliquet lacus, at scelerisque velit. In vel luctus ex, eget aliquet erat. In pulvinar elementum quam sit amet varius. Curabitur libero turpis, mattis in dignissim sit amet, consectetur quis velit. Morbi semper, turpis quis pharetra semper, arcu ligula tristique erat, eu elementum felis risus non nisl. Aenean eget neque leo.

	Nullam auctor faucibus eros, eu maximus sapien lacinia quis. In lacinia lectus orci, sit amet placerat nibh efficitur ac. Proin hendrerit est eu aliquam sollicitudin. Phasellus mollis justo at viverra viverra. Nulla non mi vel nisi faucibus sagittis mattis at lectus. Mauris dictum convallis bibendum. Aliquam sem arcu, vulputate ac mi et, finibus placerat est.`,
	username: 'Guilherme.gazzo',
	ts: '03:34 PM',
};

export default {
	title: 'ContextualBar/ThreadList',
	component: ThreadsList,
};

export const _default = () => <><ThreadsList threads={[msg, msg2]}/></>;
