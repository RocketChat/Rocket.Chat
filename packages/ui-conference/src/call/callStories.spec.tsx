import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import type { ComponentType } from 'react';

import * as audioDevicePicker from './AudioDevicePicker.stories';
import * as callControls from './CallControls.stories';
import * as callHeader from './CallHeader.stories';
import * as callReactions from './CallReactions.stories';
import * as callStageArea from './CallStageArea.stories';
import * as cameraPicker from './CameraPicker.stories';
import * as voiceActivity from './VoiceActivity.stories';
import * as callDiagnosticsPanel from './diagnostics/CallDiagnosticsPanel.stories';
import * as participantTile from './tile/ParticipantTile.stories';
import * as callBar from '../components/CallBar.stories';
import * as callPresenting from '../components/CallPresenting.stories';
import * as callRaisedHands from '../components/CallRaisedHands.stories';

type ComposedStory = ComponentType & { storyName?: string; play?: (context: { canvasElement: HTMLElement }) => Promise<void> };

const casesOf = (file: string, stories: Record<string, ComposedStory>) =>
	Object.values(stories).map((Story) => [`${file} ${Story.storyName || 'Story'}`, Story] as const);

const testCases = [
	...casesOf('AudioDevicePicker', composeStories(audioDevicePicker)),
	...casesOf('CallBar', composeStories(callBar)),
	...casesOf('CallControls', composeStories(callControls)),
	...casesOf('CallDiagnosticsPanel', composeStories(callDiagnosticsPanel)),
	...casesOf('CallHeader', composeStories(callHeader)),
	...casesOf('CallPresenting', composeStories(callPresenting)),
	...casesOf('CallRaisedHands', composeStories(callRaisedHands)),
	...casesOf('CallReactions', composeStories(callReactions)),
	...casesOf('CallStageArea', composeStories(callStageArea)),
	...casesOf('CameraPicker', composeStories(cameraPicker)),
	...casesOf('ParticipantTile', composeStories(participantTile)),
	...casesOf('VoiceActivity', composeStories(voiceActivity)),
];

describe('call stories', () => {
	// Played first: a story with a `play` is the state it leaves behind, such as an open menu.
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);
		await Story.play?.({ canvasElement: container });

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
