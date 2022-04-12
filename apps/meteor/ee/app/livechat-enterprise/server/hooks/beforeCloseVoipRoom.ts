import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'voip.beforeCloseRoom',
	(options: { comment?: string; tags?: string[] } = {}) => {
		return { filteredOptions: options };
	},
	callbacks.priority.HIGH,
	'voip-before-close-room',
);
