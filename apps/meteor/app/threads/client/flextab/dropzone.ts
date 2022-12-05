import type { IRoom } from '@rocket.chat/core-typings';
import moment from 'moment';
import _ from 'underscore';

import { Users } from '../../../models/client';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
import { settings } from '../../../settings/client';
import type { ThreadTemplateInstance } from './thread';

const userCanDrop = (rid: IRoom['_id']) =>
	!roomCoordinator.readOnly(rid, Users.findOne({ _id: Meteor.userId() }, { fields: { username: 1 } }));

async function createFileFromUrl(url: string): Promise<File> {
	let response;
	try {
		response = await fetch(url);
	} catch (error) {
		throw error;
	}

	const data = await response.blob();
	const metadata = {
		type: data.type,
	};
	const { mime } = await import('../../../utils/lib/mimeTypes');
	const file = new File(
		[data],
		`File - ${moment().format(settings.get('Message_TimeAndDateFormat'))}.${mime.extension(data.type)}`,
		metadata,
	);
	return file;
}

export const dropzoneHelpers = {
	dragAndDrop(): string | undefined {
		return settings.get('FileUpload_Enabled') ? 'dropzone--disabled' : undefined;
	},

	isDropzoneDisabled(): string {
		return settings.get('FileUpload_Enabled') ? 'dropzone-overlay--enabled' : 'dropzone-overlay--disabled';
	},

	dragAndDropLabel(this: ThreadTemplateInstance['data']): string {
		if (!userCanDrop(this.rid)) {
			return 'error-not-allowed';
		}

		if (!settings.get('FileUpload_Enabled')) {
			return 'FileUpload_Disabled';
		}

		return 'Drop_to_upload_file';
	},
};

export const dropzoneEvents = {
	'dragenter .dropzone'(this: ThreadTemplateInstance['data'], e: JQuery.DragEnterEvent) {
		const types = e.originalEvent?.dataTransfer?.types;

		if (
			types &&
			types.length > 0 &&
			_.some(types, (type) => type.indexOf('text/') === -1 || type.indexOf('text/uri-list') !== -1 || type.indexOf('text/plain') !== -1) &&
			userCanDrop(this.rid)
		) {
			e.currentTarget.classList.add('over');
		}
		e.stopPropagation();
	},

	'dragleave .dropzone-overlay'(e: JQuery.DragLeaveEvent) {
		e.currentTarget.parentNode.classList.remove('over');
		e.stopPropagation();
	},

	'dragover .dropzone-overlay'(event: JQuery.DragOverEvent) {
		document.querySelectorAll('.over.dropzone').forEach((dropzone) => {
			if (dropzone !== event.currentTarget.parentNode) {
				dropzone.classList.remove('over');
			}
		});

		if (event.originalEvent?.dataTransfer) {
			if (['move', 'linkMove'].includes(event.originalEvent.dataTransfer.effectAllowed)) {
				event.originalEvent.dataTransfer.dropEffect = 'move';
			} else {
				event.originalEvent.dataTransfer.dropEffect = 'copy';
			}
		}

		event.stopPropagation();
	},

	async 'dropped .dropzone-overlay'(this: ThreadTemplateInstance['data'], event: JQuery.DropEvent, instance: ThreadTemplateInstance) {
		event.currentTarget.parentNode.classList.remove('over');

		event.stopPropagation();
		event.preventDefault();

		if (!userCanDrop(this.rid) || !settings.get('FileUpload_Enabled')) {
			return false;
		}

		const dataTransfer = event.originalEvent?.dataTransfer;

		if (!dataTransfer) {
			return;
		}

		let files = Array.from(dataTransfer.files ?? []);

		if (files.length < 1) {
			const transferData = dataTransfer.getData('text') ?? dataTransfer.getData('url');

			if (dataTransfer.types.includes('text/uri-list')) {
				const url = dataTransfer.getData('text/html').match('<img.+src=(?:"|\')(.+?)(?:"|\')(?:.+?)>');
				const imgURL = url?.[1];

				if (!imgURL) {
					return;
				}

				const file = await createFileFromUrl(imgURL);
				if (typeof file === 'string') {
					instance.onTextDrop?.(file);
					return;
				}
				files = [file];
			}
			if (dataTransfer.types.includes('text/plain') && !dataTransfer.types.includes('text/x-moz-url')) {
				instance.onTextDrop?.(transferData.trim());
				return;
			}
		}
		const { mime } = await import('../../../utils/lib/mimeTypes');

		instance.onFileDrop?.(
			Array.from(files).map((file) => {
				Object.defineProperty(file, 'type', { value: mime.lookup(file.name) });
				return file;
			}),
		);
	},
};
