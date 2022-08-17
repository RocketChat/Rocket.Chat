import { withKnobs, boolean, text, select } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { Avatar } from '.';
import { avatarResolver, centered } from '../../helpers.stories';


const defaultSrc = avatarResolver('guilherme.gazzo');
const defaultDescription = 'user description';
const statuses = [null, 'offline', 'away', 'busy', 'online'];

storiesOf('Components/Avatar', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('default', () => (
		<Avatar
			src={text('src', defaultSrc)}
			small={boolean('small', false)}
			large={boolean('large', false)}
			description={text('description', defaultDescription)}
			status={select('status', statuses, null)}
		/>
	))
	.add('large', () => (
		<Avatar
			src={text('src', defaultSrc)}
			small={boolean('small', false)}
			large={boolean('large', true)}
			description={text('description', defaultDescription)}
			status={select('status', statuses, null)}
		/>
	))
	.add('small', () => (
		<Avatar
			src={text('src', defaultSrc)}
			small={boolean('small', true)}
			large={boolean('large', false)}
			description={text('description', defaultDescription)}
			status={select('status', statuses, null)}
		/>
	))
	.add('as placeholder', () => (
		<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
			<Avatar
				src={text('src', '')}
				large
				description={text('description', defaultDescription)}
				status={select('status', statuses, null)}
				style={{ margin: '0.5rem' }}
			/>
			<Avatar
				src={text('src', '')}
				description={text('description', defaultDescription)}
				status={select('status', statuses, null)}
				style={{ margin: '0.5rem' }}
			/>
			<Avatar
				src={text('src', '')}
				small
				description={text('description', defaultDescription)}
				status={select('status', statuses, null)}
				style={{ margin: '0.5rem' }}
			/>
		</div>
	))
	.add('with status indicator', () => (
		<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
			<Avatar
				src={text('src', defaultSrc)}
				description={text('description', defaultDescription)}
				status={'offline'}
				style={{ margin: '0.5rem' }}
			/>
			<Avatar
				src={text('src', defaultSrc)}
				description={text('description', defaultDescription)}
				status={'away'}
				style={{ margin: '0.5rem' }}
			/>
			<Avatar
				src={text('src', defaultSrc)}
				description={text('description', defaultDescription)}
				status={'busy'}
				style={{ margin: '0.5rem' }}
			/>
			<Avatar
				src={text('src', defaultSrc)}
				description={text('description', defaultDescription)}
				status={'online'}
				style={{ margin: '0.5rem' }}
			/>
		</div>
	));
