import { withKnobs, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import AudioAttachment from '.';
import sampleAudio from '../../../../.storybook/assets/sample-audio.mp3';
import { centered } from '../../../helpers.stories';

storiesOf('Messages/AudioAttachment', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('default', () => <AudioAttachment url={text('url', sampleAudio)} />);
