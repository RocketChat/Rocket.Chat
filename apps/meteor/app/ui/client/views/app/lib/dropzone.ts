import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import moment from 'moment';
import _ from 'underscore';

import { Users, Rooms } from '../../../../../models/client';
import { roomCoordinator } from '../../../../../../client/lib/rooms/roomCoordinator';
import { settings } from '../../../../../settings/client';
import { RoomManager } from '../../../../../ui-utils/client';
import { chatMessages } from '../../../lib/ChatMessages';

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
	const { mime } = await import('../../../../../utils/lib/mimeTypes');
	const file = new File(
		[data],
		`File - ${moment().format(settings.get('Message_TimeAndDateFormat'))}.${mime.extension(data.type)}`,
		metadata,
	);
	return file;
}

function addToInput(text: string): void {
	const input = RoomManager.openedRoom ? chatMessages[RoomManager.openedRoom].input : undefined;
	if (!input) {
		return;
	}

	const initText = input.value.slice(0, input.selectionStart ?? undefined);
	const finalText = input.value.slice(input.selectionEnd ?? undefined, input.value.length);

	input.value = initText + text + finalText;
	$(input).change().trigger('input');
}

export const dropzoneHelpers = {
	dragAndDrop(): string | undefined {
		return settings.get('FileUpload_Enabled') ? 'dropzone--disabled' : undefined;
	},

	isDropzoneDisabled(): string {
		return settings.get('FileUpload_Enabled') ? 'dropzone-overlay--enabled' : 'dropzone-overlay--disabled';
	},

	dragAndDropLabel(this: { _id: IRoom['_id']; rid: IRoom['_id'] }): string {
		const room = Rooms.findOne({ _id: this.rid });
		if (isRoomFederated(room)) {
			return 'FileUpload_Disabled_for_federation';
		}

		if (!userCanDrop(this._id)) {
			return 'error-not-allowed';
		}

		if (!settings.get('FileUpload_Enabled')) {
			return 'FileUpload_Disabled';
		}

		return 'Drop_to_upload_file';
	},
};

export const dropzoneEvents = {
	'dragenter .dropzone'(this: { _id: IRoom['_id'] }, e: JQuery.DragEnterEvent) {
		const types = e.originalEvent?.dataTransfer?.types;

		if (
			types &&
			types.length > 0 &&
			_.some(types, (type) => type.indexOf('text/') === -1 || type.indexOf('text/uri-list') !== -1 || type.indexOf('text/plain') !== -1) &&
			userCanDrop(this._id)
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

	async 'dropped .dropzone-overlay'(
		this: { _id: IRoom['_id']; rid: IRoom['_id'] },
		event: JQuery.DropEvent,
		instance: Blaze.TemplateInstance & {
			onFile?: (
				filesToUpload: {
					file: File;
					name: string;
				}[],
			) => void;
		},
	) {
		event.currentTarget.parentNode.classList.remove('over');

		const room = Rooms.findOne({ _id: this.rid });

		event.stopPropagation();
		event.preventDefault();

		if (isRoomFederated(room) || !userCanDrop(this._id) || !settings.get('FileUpload_Enabled')) {
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
					return addToInput(file);
				}
				files = [file];
			}
			if (dataTransfer.types.includes('text/plain') && !dataTransfer.types.includes('text/x-moz-url')) {
				return addToInput(transferData?.trim());
			}
		}
		const { mime } = await import('../../../../../utils/lib/mimeTypes');
		const filesToUpload = Array.from(files).map((file) => {
			Object.defineProperty(file, 'type', { value: mime.lookup(file.name) });
			return {
				file,
				name: file.name,
			};
		});

		return instance.onFile?.(filesToUpload);
	},
};
