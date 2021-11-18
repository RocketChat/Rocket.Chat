import { ActionButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { ReactNode, useState } from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';

export type ButtonInfo = {
	name: string;
	handler?: () => void;
	states: Array<string>;
	icon: string;
	label: string;
	order: number;
};

export type ButtonsList = {
	buttons: Array<ReactNode>;
	internalStates: Array<{ id: string; state: boolean }>;
};

const defaultButtonsList = [
	{
		name: 'audio-settings',
		icon: 'customize',
		label: 'Audio_settings',
		states: ['incoming', 'current', 'disabled'],
		order: 15,
	},

	{
		name: 'hold-call',
		icon: 'pause-unfilled',
		label: 'Hold_call',
		states: ['current'],
		order: 10,
	},

	{
		name: 'mute',
		icon: 'mic-off',
		label: 'Mute',
		states: ['current'],
		order: 5,
	},
];

const renderButtons = (
	buttonList: Array<ButtonInfo>,
	currentState: string,
	handlers: Array<{ id: string; handler: () => void }>,
	internalStates: Array<{ id: string; state: boolean }>,
): Array<ReactNode> =>
	// const callOnHold = internalStates.find((state) => state.id === 'hold-call')?.state;
	buttonList
		.slice(0)
		.sort((a, b) => a.order - b.order)
		.filter((button) => button.states.includes(currentState))
		.map((button) => {
			const active = internalStates.find((state) => state.id === button.name)?.state;
			const t = useTranslation();

			return (
				<ActionButton
					// Using Action Button instead of Sidebar.TopBar.ActionButton because TS issues on the icon prop
					key={button.name}
					nude
					small
					// TODO: find a way to use generic strings on the useTranslation types
					title={t(button.label as 'Audio_settings')}
					onClick={
						handlers.find((handler) => handler.id === button.name)?.handler || button.handler
					}
					icon={button.icon as 'phone'}
					color={active ? 'surface' : 'neutral-500-50'}
				></ActionButton>
			);
		});
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
