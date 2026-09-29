import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import type { ComponentType } from 'react';

import * as audioDevicePicker from './AudioDevicePicker.stories';
import * as callControls from './CallControls.stories';
import * as callHeader from './CallHeader.stories';
import * as callStageArea from './CallStageArea.stories';
import * as cameraPicker from './CameraPicker.stories';
import * as voiceActivity from './VoiceActivity.stories';
import * as callDiagnosticsPanel from './diagnostics/CallDiagnosticsPanel.stories';
import * as participantTile from './tile/ParticipantTile.stories';
import * as callBar from '../components/CallBar.stories';

/**
 * The call's parts are drawn from what their contexts say, so each story is a state of the call and the snapshot
 * is what that state looks like — the stories are the cases, as they are for the rest of the package.
 */
const casesOf = (file: string, stories: Record<string, ComponentType & { storyName?: string }>) =>
	Object.values(stories).map((Story) => [`${file} ${Story.storyName || 'Story'}`, Story] as const);

const testCases = [
	...casesOf('AudioDevicePicker', composeStories(audioDevicePicker)),
	...casesOf('CallBar', composeStories(callBar)),
	...casesOf('CallControls', composeStories(callControls)),
	...casesOf('CallDiagnosticsPanel', composeStories(callDiagnosticsPanel)),
	...casesOf('CallHeader', composeStories(callHeader)),
	...casesOf('CallStageArea', composeStories(callStageArea)),
	...casesOf('CameraPicker', composeStories(cameraPicker)),
	...casesOf('ParticipantTile', composeStories(participantTile)),
	...casesOf('VoiceActivity', composeStories(voiceActivity)),
];

describe('call stories', () => {
	test.each(testCases)('renders %s without crashing', async (_storyname, Story) => {
		const { baseElement } = render(<Story />);

		expect(baseElement).toMatchSnapshot();
	});

	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
