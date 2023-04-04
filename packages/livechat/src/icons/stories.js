import path from 'path';

import { withKnobs, color } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { centered } from '../helpers.stories';

const req = require.context('./', true, /\.svg$/);
const iconset = req.keys().map((filename) => ({
	component: req(filename),
	name: path.basename(filename, '.svg'),
}));

const IconDisplay = ({ component: Icon, name, color }) => (
	<div
		style={{
			width: '130px',
			height: '130px',
			margin: '10px',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'stretch',
		}}
	>
		<div style={{ flex: '1', display: 'flex', alignItems: 'center', color }}>
			<Icon width={48} height={48} />
		</div>
		<div style={{ flex: '0' }}>{name}</div>
	</div>
);

storiesOf('Components/Icons', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('all', () => (
		<div style={{ width: '100%', display: 'flex', flexWrap: 'wrap' }}>
			{iconset.map((props) => (
				<IconDisplay color={color('color', '#E0364D')} {...props} />
			))}
		</div>
	));
iconset.forEach(({ component: Icon, name }) =>
	storiesOf('Components/Icons', module)
		.addDecorator(centered)
		.addDecorator(withKnobs)
		.add(name, () => (
			<div style={{ color: color('color', '#E0364D') }}>
				<Icon width={256} height={256} />
			</div>
		)),
);
