import type { Meta, StoryObj } from '@storybook/react';

import CallDiagnosticsPanel from './CallDiagnosticsPanel';
import { diagnosticsSample, withCall } from '../../fixtures/callFixtures';
import { conferenceAppRoot, withConferenceWindow } from '../../fixtures/storyFixtures';

/** How the connection of the call running in this window is doing, as its provider samples it. */
const meta = {
	component: CallDiagnosticsPanel,
	parameters: { layout: 'fullscreen' },
	args: { onClose: () => undefined },
	decorators: [
		(Story) => (
			<div style={{ display: 'flex', flexDirection: 'column', width: '22.5rem', height: '100dvh' }}>
				<Story />
			</div>
		),
		withConferenceWindow(conferenceAppRoot()),
	],
} satisfies Meta<typeof CallDiagnosticsPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Before the first sample: nothing to say yet. */
export const WaitingForData: Story = {
	decorators: [withCall()],
};

export const Connected: Story = {
	decorators: [withCall({ diagnostics: diagnosticsSample })],
};

/** With the background blurred here, the processor's own timings get a section. */
export const WithBackgroundBlur: Story = {
	decorators: [
		withCall({
			diagnostics: {
				...diagnosticsSample,
				connectionQuality: 'poor',
				qualityLimitationReason: 'cpu',
				backgroundBlur: { fps: 29.7, frameMs: 6.2, compositorMs: 1.4, segmentationMs: 4.1, segmentIntervalMs: 66, qualityReduction: 1 },
			},
		}),
	],
};
