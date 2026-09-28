import { Button } from '@rocket.chat/fuselage';
import type { Meta, StoryFn, StoryObj } from '@storybook/react-webpack5';
import { useEffect, useState } from 'react';

import type { ToastBarContextValue } from './ToastBarContext';
import { useToastBarDispatch } from './ToastBarContext';

export default {
	title: 'view/ToastBar',
	parameters: {
		layout: 'centered',
		actions: { argTypesRegex: '^on.*' },
	},
} satisfies Meta;

const DEFAULT_MESSAGE = 'Lorem Ipsum';

export const Default: StoryFn = () => {
	const [counter, setCounter] = useState(0);
	const dispatchToastMessage = useToastBarDispatch();

	const messageArray = [
		'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ipsam nihi Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ipsam nihi',
		'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ipsam nihi Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ipsam nihi',
		'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ipsam nihi Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ipsam nihi',
		DEFAULT_MESSAGE,
		'Lorem ipsum dolor, sit amet consectetur adipisicing elit.',
	];

	const handleToast = () => {
		dispatchToastMessage({
			type: 'success',
			message: messageArray[counter],
		});

		dispatchToastMessage({
			type: 'error',
			message: messageArray[counter],
			time: 10,
			position: 'bottom-start',
		});

		if (counter === messageArray.length - 1) {
			return setCounter(0);
		}

		return setCounter((prevState) => prevState + 1);
	};

	return (
		<Button primary onClick={handleToast}>
			Dispatch ToastBar
		</Button>
	);
};

type ToastArgs = Partial<Parameters<ToastBarContextValue['dispatch']>[0]>;

const Dispatcher = ({ toast }: { toast: ToastArgs }) => {
	const dispatchToastMessage = useToastBarDispatch();

	useEffect(() => {
		dispatchToastMessage({
			type: 'success',
			message: DEFAULT_MESSAGE,
			...toast,
		});
	}, [toast, dispatchToastMessage]);

	return (
		<Button
			primary
			onClick={() =>
				dispatchToastMessage({
					type: 'success',
					message: DEFAULT_MESSAGE,
					...toast,
				})
			}
		>
			Dispatch ToastBar
		</Button>
	);
};

type Story = StoryObj<ToastArgs>;

const render: Story['render'] = (args) => <Dispatcher toast={args} />;

export const TopStart: Story = {
	render,
	args: {
		position: 'top-start',
	},
};

export const TopEnd: Story = {
	render,
	args: {
		position: 'top-end',
	},
};

export const BottomStart: Story = {
	render,
	args: {
		position: 'bottom-start',
	},
};

export const BottomEnd: Story = {
	render,
	args: {
		position: 'bottom-end',
	},
};

export const Persistent: Story = {
	render,
	args: {
		isPersistent: true,
	},
};
