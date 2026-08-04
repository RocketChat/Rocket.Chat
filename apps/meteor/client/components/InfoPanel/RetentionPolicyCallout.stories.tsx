import type { Meta, StoryFn } from '@storybook/react';

import RetentionPolicyCallout from './RetentionPolicyCallout';
import { createRenteionPolicySettingsMock as createMock } from '../../../tests/mocks/client/mockRetentionPolicySettings';
import { createFakeRoom } from '../../../tests/mocks/data';

export default {
	component: RetentionPolicyCallout,
} satisfies Meta<typeof RetentionPolicyCallout>;

const fakeRoom = createFakeRoom();

const DefaultWrapper = createMock({ appliesToChannels: true, TTLChannels: 60000 });

export const Default: StoryFn<typeof RetentionPolicyCallout> = () => (
	<DefaultWrapper>
		<RetentionPolicyCallout room={fakeRoom} />
	</DefaultWrapper>
);

const InvalidSettingsWrapper = createMock({
	appliesToChannels: true,
	TTLChannels: 60000,
	advancedPrecisionCron: '* * * 12 * *',
	advancedPrecision: true,
});

export const InvalidSettings: StoryFn<typeof RetentionPolicyCallout> = () => (
	<InvalidSettingsWrapper>
		<RetentionPolicyCallout room={fakeRoom} />
	</InvalidSettingsWrapper>
);
