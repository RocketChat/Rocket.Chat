import { TimestampPicker } from './index';

const onClose = () => {
	alert('Closed!');
};

export default {
	title: 'Timestamp/TimestampPicker',
	component: TimestampPicker,
};

export const Default = () => <TimestampPicker onClose={onClose} />;
