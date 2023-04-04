import { withKnobs, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { ButtonGroup } from '.';
import { centered } from '../../helpers.stories';
import { Button } from '../Button';

storiesOf('Components/ButtonGroup', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('with buttons of same size', () => (
		<ButtonGroup>
			<Button>{text('button text 1', 'Yes')}</Button>
			<Button outline>{text('button text 2', 'Cancel')}</Button>
			<Button danger>{text('button text 3', 'No')}</Button>
		</ButtonGroup>
	))
	.add('with buttons of different sizes', () => (
		<ButtonGroup>
			<Button small>{text('button text 1', 'Yes')}</Button>
			<Button outline>{text('button text 2', 'Cancel')}</Button>
			<Button small danger>
				{text('button text 3', 'No')}
			</Button>
		</ButtonGroup>
	))
	.add('with only small buttons', () => (
		<ButtonGroup>
			<Button small>{text('button text 1', 'Yes')}</Button>
			<Button small outline>
				{text('button text 2', 'Cancel')}
			</Button>
			<Button small danger>
				{text('button text 3', 'No')}
			</Button>
		</ButtonGroup>
	))
	.add('with stacked buttons', () => (
		<ButtonGroup>
			<Button small outline>
				Rename
			</Button>
			<Button small outline>
				Share
			</Button>
			<Button stack danger>
				Delete
			</Button>
		</ButtonGroup>
	));
