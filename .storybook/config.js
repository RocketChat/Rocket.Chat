import { configure } from '@storybook/react';

configure(require.context('../client', true, /\.stories\.js$/), module);
