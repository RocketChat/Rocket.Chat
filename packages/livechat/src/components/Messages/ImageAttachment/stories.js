import { withKnobs, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { ImageAttachment } from '.';
import sampleImage from '../../../../.storybook/assets/sample-image.jpg';
import { centered } from '../../../helpers.stories';

storiesOf('Messages/ImageAttachment', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('default', () => <ImageAttachment url={text('url', sampleImage)} />);
