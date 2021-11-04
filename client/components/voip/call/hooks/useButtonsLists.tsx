import { Button, Icon } from '@rocket.chat/fuselage';
import React, { ReactNode } from 'react';

export type ButtonInfo = {
	name: string;
	handler: () => void;
	states: Array<string>;
	icon: string;
	label: string;
};

const defaultButtonsList = [
	{
		name: 'audio-settings',
		icon: 'customize',
		label: 'audio-settings',
		states: ['incoming', 'current', 'disabled'],
		handler: (): void => {
			console.log('audio-settings');
		},
	},

	{
		name: 'hold-call',
		icon: 'pause-unfilled',
		label: 'hold-call',
		states: ['incoming', 'current'],
		handler: (): void => {
			console.log('hold-call');
		},
	},

	{
		name: 'mute',
		icon: 'mic-off',
		label: 'mute',
		states: ['incoming', 'current'],
		handler: (): void => {
			console.log('mute');
		},
	},
];

const renderButtons = (buttonList: Array<ButtonInfo>, currentState: string): Array<ReactNode> =>
	buttonList
		.slice(0)
		.reverse()
		.filter((button) => button.states.includes(currentState))
		.map((button) => (
			<Button
				nude
				key={button.name}
				mis={8}
				mie={0}
				borderWidth={0}
				p={0}
				size={28}
				onClick={button.handler}
			>
				<Icon color='neutral-500-50' size={24} name={button.icon} />
			</Button>
		));

export const useButtonsList = (
	currentState: string,
	customButtonsList?: Array<ButtonInfo>,
): Array<ReactNode> =>
	// Returns default buttons list plus custom buttons passed via params
	renderButtons(
		customButtonsList ? [...defaultButtonsList, ...customButtonsList] : defaultButtonsList,
		currentState,
	);
