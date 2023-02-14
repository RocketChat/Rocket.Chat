import { action } from '@storybook/addon-actions';
import { withKnobs, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { screenCentered, screenProps } from '../../helpers.stories';
import GDPRAgreement from './component';

storiesOf('Routes/GDPRAgreement', module)
	.addDecorator(screenCentered)
	.addDecorator(withKnobs)
	.add('normal', () => (
		<GDPRAgreement
			title={text('title', 'GDPR')}
			consentText={text('consentText', '')}
			instructions={text('instructions', '')}
			onAgree={action('agree')}
			{...screenProps()}
		/>
	));
