import React from 'react';

import ChannelToTeamModal from './ChannelToTeamModal';

export default {
	title: 'teams/ChannelToTeamModal',
	component: ChannelToTeamModal,
};

const options = [
	[1, 'a teste 1'],
	[2, 'b teste 2', true],
	[3, 'c teste 3'],
	[4, 'd teste 4'],
	[5, 'd teste 5'],
	[6, 'd teste 6'],
	[7, 'd teste 7'],
	[8, 'd teste 8'],
	[9, 'd teste 9'],
	[10, 'd teste 10'],
];

export const Default = () =>
	<ChannelToTeamModal channels={options} />;

export const Confirmation = () =>
	<ChannelToTeamModal channels={options} currentStep={2} />;
