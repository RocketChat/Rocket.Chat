import { action } from '@storybook/addon-actions';
import { withKnobs, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { Composer, ComposerActions, ComposerAction } from '.';
import { centered } from '../../helpers.stories';
import PlusIcon from '../../icons/plus.svg';
import SendIcon from '../../icons/send.svg';
import SmileIcon from '../../icons/smile.svg';


const centeredWithWidth = (storyFn, ...args) => centered(() => (
	<div style={{ width: '365px' }}>
		{storyFn()}
	</div>
), ...args);

const defaultPlaceholder = 'Insert your text here';

storiesOf('Components/Composer', module)
	.addDecorator(centeredWithWidth)
	.addDecorator(withKnobs({ escapeHTML: false }))
	.add('default', () => (
		<Composer
			value={text('value', '')}
			placeholder={text('placeholder', defaultPlaceholder)}
			onChange={action('change')}
			onSubmit={action('submit')}
			onUpload={action('upload')}
		/>
	))
	.add('connecting', () => (
		<Composer connecting />
	))
	.add('with large placeholder', () => (
		<Composer
			value={text('value', '')}
			placeholder={text('placeholder', new Array(5).fill(defaultPlaceholder).join(' '))}
			onChange={action('change')}
			onSubmit={action('submit')}
			onUpload={action('upload')}
		/>
	))
	.add('with plain text', () => (
		<Composer
			value={text('value', 'Should I use &amp; or &?')}
			placeholder={text('placeholder', defaultPlaceholder)}
			onChange={action('change')}
			onSubmit={action('submit')}
			onUpload={action('upload')}
		/>
	))
	.add('with emojis', () => (
		<Composer
			value={text('value', ':heart: :smile: :\'(')}
			placeholder={text('placeholder', defaultPlaceholder)}
			onChange={action('change')}
			onSubmit={action('submit')}
			onUpload={action('upload')}
		/>
	))
	.add('with mentions', () => (
		<Composer
			value={text('value', '@all, I\'m @here with @user.')}
			placeholder={text('placeholder', defaultPlaceholder)}
			onChange={action('change')}
			onSubmit={action('submit')}
			onUpload={action('upload')}
		/>
	))
	.add('with actions', () => (
		<Composer
			value={text('value', '')}
			placeholder={text('placeholder', defaultPlaceholder)}
			pre={
				<ComposerActions>
					<ComposerAction text='Add emoji' onClick={action('click smile')}>
						<SmileIcon width='20' />
					</ComposerAction>
					<ComposerAction text='Send' onClick={action('click send')}>
						<SendIcon color='#1D74F5' width='20' />
					</ComposerAction>
				</ComposerActions>
			}
			post={
				<ComposerActions>
					<ComposerAction text='Add attachment' onClick={action('click plus')}>
						<PlusIcon width='20' />
					</ComposerAction>
				</ComposerActions>
			}
			onChange={action('change')}
			onSubmit={action('submit')}
			onUpload={action('upload')}
		/>
	));
