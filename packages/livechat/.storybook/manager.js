import { addons } from '@storybook/addons';
import { create } from '@storybook/theming/create';

import manifest from '../package.json';
import logo from './logo.svg';

addons.setConfig({
	theme: create({
		base: 'light',
		brandTitle: manifest.name,
		brandImage: logo,
		brandUrl: manifest.homepage,
		colorPrimary: '#cbced1',
		colorSecondary: '#1d74f5',
	}),
});
