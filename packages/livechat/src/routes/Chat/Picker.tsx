import { lazy } from 'preact/compat';

const Picker = lazy(async () => {
	await import('emoji-mart/css/emoji-mart.css');
	const { Picker } = await import('emoji-mart');
	return Picker;
});

export default Picker;
