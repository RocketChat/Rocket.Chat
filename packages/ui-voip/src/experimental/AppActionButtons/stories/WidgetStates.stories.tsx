import { Box, Button, ButtonGroup, Tag } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import { useMediaCallView, useWidgetExternalControls } from '../../../context';
import MockedMediaCallProvider from '../../../providers/MockedMediaCallProvider';
import { MediaCallWidget } from '../../../views';
import type { AppButtonInteractionHandler, MediaCallAppActionDescriptor } from '../context/MediaCallAppActionsContext';
import MockedMediaCallAppActionsProvider from '../providers/MockedMediaCallAppActionsProvider';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		// NewCall
		New_call: 'New call',
		Call: 'Call',
		Enter_username_or_number: 'Enter username or number',
		Close: 'Close',
		// IncomingCall / IncomingCallTransfer
		Incoming_call: 'Incoming call',
		Reject: 'Reject',
		Accept: 'Accept',
		Transferring_call_incoming: 'Incoming call transfer',
		Transferring_call_incoming__from_: 'From {{from}}',
		// OutgoingCall / OutgoingCallTransfer
		Calling: 'Calling',
		Cancel: 'Cancel',
		Transferring_call: 'Transferring call',
		Transferred_call__from__to: '{{from}} transferred call to',
		// OngoingCall
		Mute: 'Mute',
		Unmute: 'Unmute',
		Hold: 'Hold',
		Resume: 'Resume',
		Forward: 'Forward',
		Dialpad: 'Dialpad',
		Direct_Message: 'Direct Message',
		Call_feature_unsupported: 'Call feature unsupported',
		meteor_status_connecting: 'Connecting...',
		Voice_call__user__hangup: 'Hang up',
		Share_screen: 'Share screen',
		Stop_sharing_screen: 'Stop sharing screen',
	})
	.buildStoryDecorator();

/**
 * Actions covering every distinct callState value so each one clearly
 * appears or disappears as the widget transitions between states.
 */
const stateAwareActions: MediaCallAppActionDescriptor[] = [
	{
		appId: 'app-id',
		actionId: 'always-visible',
		label: 'Always visible (no filter)',
	},
	{
		appId: 'app-id',
		actionId: 'ringing-states',
		label: 'Ringing & ringing-transfer',
		callStates: ['ringing'],
	},
	{
		appId: 'app-id',
		actionId: 'calling-states',
		label: 'Calling & calling-transfer',
		callStates: ['calling'],
	},
	{
		appId: 'app-id',
		actionId: 'ongoing-only',
		label: 'Ongoing only',
		callStates: ['ongoing'],
	},
	{
		appId: 'app-id',
		actionId: 'danger-action',
		label: 'Danger — ringing or ongoing',
		variant: 'danger',
		callStates: ['ringing', 'ongoing'],
	},
];

const handleInteraction: AppButtonInteractionHandler = async ({ button, sessionState }) => {
	switch (button.actionId) {
		case 'always-visible':
			return { update: { label: `Clicked with call id ${sessionState.callId}`, actionId: 'default' } };
		case 'new-only':
		case 'ringing-states':
		case 'calling-states':
		case 'ongoing-only':
		case 'danger-action':
			return { update: { label: `Clicked with call id ${sessionState.callId} (filtered)` } };
		default:
			return undefined;
	}
};

type StoryArgs = {
	state: 'new' | 'ringing' | 'calling' | 'ongoing';
	transferredBy?: string;
};

/**
 * Renders a small status bar + a "Receive call" shortcut button so the user
 * can recover from the `closed` state (when the widget renders nothing) without
 * needing to change the Storybook control.
 */
const StateControls = () => {
	const { sessionState, onCall } = useMediaCallView();
	const { toggleWidget } = useWidgetExternalControls();
	const { state } = sessionState;

	return (
		<Box display='flex' flexDirection='column' alignItems='flex-start' mbe={16} gap={8}>
			<Box color='hint' fontScale='c1'>
				Current state: <Tag>{state}</Tag>
			</Box>
			<ButtonGroup vertical>
				<Button small onClick={() => void onCall()}>
					Receive call (→ ringing)
				</Button>
				<Button small onClick={() => toggleWidget()} disabled={state !== 'new' && state !== 'closed'}>
					Toggle widget
				</Button>
			</ButtonGroup>
		</Box>
	);
};

const meta = {
	title: 'Experimental/AppActionButtons/WidgetStates',
	component: MediaCallWidget,
	args: {
		state: 'new',
	},
	argTypes: {
		state: {
			description: 'Initial widget state. Changing this remounts the widget from scratch.',
			control: { type: 'select' },
			options: ['new', 'ringing', 'calling', 'ongoing'] satisfies StoryArgs['state'][],
		},
		transferredBy: {
			description: 'When set, ringing becomes an IncomingCallTransfer and calling becomes an OutgoingCallTransfer.',
			control: { type: 'text' },
		},
	},
	decorators: [
		mockedContexts,
		(Story, { args }) => (
			<MockedMediaCallAppActionsProvider actions={stateAwareActions} handleInteraction={handleInteraction}>
				<MockedMediaCallProvider state={args.state} transferredBy={args.transferredBy}>
					<Story />
				</MockedMediaCallProvider>
			</MockedMediaCallAppActionsProvider>
		),
	],
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Use the **state** control (bottom panel → Controls) to start from any widget
 * state and observe which AppActions buttons are shown or hidden.
 *
 * Then interact with the widget's own buttons (Accept, Reject, Hold, End…) to
 * drive it through the full call lifecycle and watch the action list update on
 * every transition.
 *
 * If the widget disappears (state reached `closed`), the "Receive call" shortcut
 * button lets you jump back to `ringing` without changing the control.
 */
export const StateTransitions: Story = {
	render: () => (
		<>
			<StateControls />
			<MediaCallWidget />
		</>
	),
};
