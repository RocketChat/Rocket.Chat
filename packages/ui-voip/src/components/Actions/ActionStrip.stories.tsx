import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';
import { useTranslation } from 'react-i18next';

import ActionStrip from './ActionStrip';
import ActionButton from '../ActionButton';
import Timer from '../Timer';
import ToggleButton from '../ToggleButton';

export default {
	title: 'V2/Components/Actions/ActionStrip',
	component: ActionStrip,
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				Mute: 'Mute',
				Unmute: 'Unmute',
				Screen_sharing: 'Screen sharing',
				Screen_sharing_off: 'Screen sharing off',
				Hold: 'Hold',
				Resume: 'Resume',
			})
			.buildStoryDecorator(),
	],
} satisfies Meta<typeof ActionStrip>;

const NOOP = () => undefined;

export const ActionStripStory: StoryFn<typeof ActionStrip> = (args) => {
	const { t } = useTranslation();
	return (
		<ActionStrip leftSlot={<Timer />} rightSlot='test' {...args}>
			<ToggleButton label={t('Mute')} icons={['mic', 'mic-off']} titles={[t('Mute'), t('Unmute')]} pressed={false} onToggle={NOOP} />
			<ToggleButton
				label={t('Screen_sharing')}
				icons={['computer', 'computer']}
				titles={[t('Screen_sharing'), t('Screen_sharing_off')]}
				pressed={false}
				onToggle={NOOP}
			/>
			<ToggleButton
				label={t('Hold')}
				icons={['pause-shape-unfilled', 'pause-shape-unfilled']}
				titles={[t('Hold'), t('Resume')]}
				pressed={false}
				onToggle={NOOP}
			/>
			<ToggleButton
				label={t('Chat')}
				icons={['balloon', 'balloon-off']}
				titles={[t('Open_chat'), t('Close_chat')]}
				pressed={false}
				onToggle={NOOP}
			/>
			<ActionButton disabled={false} label={t('Forward')} icon='arrow-forward' onClick={NOOP} />
			<ActionButton label={t('Voice_call__user__hangup', { user: 'John Doe' })} icon='phone-off' danger onClick={NOOP} />
			{/* <DevicePicker /> */}
		</ActionStrip>
	);
};
