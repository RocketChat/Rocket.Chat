import { action } from '@storybook/addon-actions';

import AnnouncementButton from './AnnouncementButton';

export default {
	title: 'Components/AnnouncementButton',
	component: AnnouncementButton,
};

export const Default = () => <AnnouncementButton onClick={action('clicked')}>Text</AnnouncementButton>;
