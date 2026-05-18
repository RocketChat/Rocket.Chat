import { ActionButton, ButtonGroup } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionStrip, Timer, ActionToggleChat, ToggleButton } from '../../../components';
import MockedMediaCallProvider from '../../../providers/MockedMediaCallProvider';
import AppActions from '../components/AppActions';
import { useVisibleAppActions } from '../hooks/useVisibleAppActions';
import MockedMediaCallAppActionsProvider from '../providers/MockedMediaCallAppActionsProvider';

export default {
	title: 'Experimental/AppActionButtons/Components/ActionStrip',
	component: ActionStrip,
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				Mute: 'Mute',
				Unmute: 'Unmute',
				Hold: 'Hold',
				Resume: 'Resume',
				Show_chat: 'Show chat',
				Hide_chat: 'Hide chat',
				Screen_sharing: 'Screen sharing',
				Screen_sharing_off: 'Screen sharing off',
				Forward: 'Forward',
				Voice_call__user__hangup: 'Hang up {{user}}',
			})
			.buildStoryDecorator(),
		(Story) => (
			<MockedMediaCallAppActionsProvider>
				<MockedMediaCallProvider state='ongoing'>
					<Story />
				</MockedMediaCallProvider>
			</MockedMediaCallAppActionsProvider>
		),
	],
} satisfies Meta<typeof ActionStrip>;

const NOOP = () => undefined;

export const ActionStripStory: StoryFn<typeof ActionStrip> = (args) => {
	const { t } = useTranslation();
	const [pressed, setPressed] = useState(false);
	const visibleActions = useVisibleAppActions();

	const rightSlot = (
		<>
			<AppActions actions={visibleActions} />
			<ButtonGroup>
				<ActionToggleChat pressed={pressed} onClick={() => setPressed(!pressed)} />
			</ButtonGroup>
		</>
	);
	return (
		<ActionStrip leftSlot={<Timer />} rightSlot={rightSlot} {...args}>
			<ToggleButton label={t('Mute')} icons={['mic', 'mic-off']} titles={[t('Mute'), t('Unmute')]} pressed={false} onToggle={NOOP} />
			<ToggleButton
				label={t('Hold')}
				icons={['pause-shape-unfilled', 'pause-shape-unfilled']}
				titles={[t('Hold'), t('Resume')]}
				pressed={false}
				onToggle={NOOP}
			/>
			<ToggleButton
				label={t('Screen_sharing')}
				icons={['computer', 'computer']}
				titles={[t('Screen_sharing'), t('Screen_sharing_off')]}
				pressed={false}
				onToggle={NOOP}
			/>
			<ActionButton disabled={false} label={t('Forward')} icon='arrow-forward' onClick={NOOP} />
			<ActionButton label={t('Voice_call__user__hangup', { user: 'John Doe' })} icon='phone-off' danger onClick={NOOP} />
			{/* <DevicePicker /> */}
		</ActionStrip>
	);
};
