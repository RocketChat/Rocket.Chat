import { Button, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { ReactNode, useState } from 'react';

export type ButtonInfo = {
	name: string;
	handler?: () => void;
	states: Array<string>;
	icon: string;
	label: string;
};

export type ButtonsList = {
	buttons: Array<ReactNode>;
	internalStates: Array<{ id: string; state: boolean }>;
};

const defaultButtonsList = [
	{
		name: 'audio-settings',
		icon: 'customize',
		label: 'audio-settings',
		states: ['incoming', 'current', 'disabled'],
	},

	{
		name: 'hold-call',
		icon: 'pause-unfilled',
		label: 'hold-call',
		states: ['current'],
	},

	{
		name: 'mute',
		icon: 'mic-off',
		label: 'mute',
		states: ['current'],
	},
];

const renderButtons = (
	buttonList: Array<ButtonInfo>,
	currentState: string,
	handlers: Array<{ id: string; handler: () => void }>,
	internalStates: Array<{ id: string; state: boolean }>,
): Array<ReactNode> => {
	console.log(buttonList, currentState, handlers, internalStates);
	// const callOnHold = internalStates.find((state) => state.id === 'hold-call')?.state;
	return buttonList
		.slice(0)
		.reverse()
		.filter((button) => button.states.includes(currentState))
		.map((button) => {
			const active = internalStates.find((state) => state.id === button.name)?.state;

			return (
				<Button
					nude
					key={button.name}
					mis={8}
					mie={0}
					borderWidth={0}
					p={0}
					size={28}
					onClick={
						handlers.find((handler) => handler.id === button.name)?.handler || button.handler
					}
					// disabled={callOnHold && button.name !== 'hold-call'}
				>
					<Icon color={active ? 'surface' : 'neutral-500-50'} size={24} name={button.icon} />
				</Button>
			);
		});
};

export const useButtonsList = (
	currentState: string,
	customButtonsList?: Array<ButtonInfo>,
): ButtonsList => {
	// Returns default buttons list plus custom buttons passed via params
	const [paused, setPaused] = useState(false);
	const handlePaused = useMutableCallback(() => {
		console.log('TODO: ADD VOIP METHODS FOR PAUSE HERE', paused);
		setPaused(!paused);
	});

	const [muted, setMuted] = useState(false);
	const handleMuted = useMutableCallback(() => {
		console.log('TODO: ADD VOIP METHODS FOR PAUSE HERE', muted);
		setMuted(!muted);
	});

	const [settingsModalOpen, setSettingsModalOpen] = useState(false);
	const handleSettingsModal = (): void => {
		console.log('TODO: CREATE THE MODAL!');
		setSettingsModalOpen(!settingsModalOpen);
	};

	const handlers = [
		{ id: 'hold-call', handler: handlePaused },
		{ id: 'audio-settings', handler: handleSettingsModal },
		{ id: 'mute', handler: handleMuted },
	];

	const states = [
		{ id: 'hold-call', state: paused },
		{ id: 'audio-settings', state: settingsModalOpen },
		{ id: 'mute', state: muted },
	];

	const Buttons = renderButtons(
		customButtonsList ? [...defaultButtonsList, ...customButtonsList] : defaultButtonsList,
		currentState,
		handlers,
		states,
	);

	return {
		buttons: Buttons,
		internalStates: states,
	};
};
