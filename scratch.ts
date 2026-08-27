import { isFileAttachment } from '@rocket.chat/core-typings';
const attachment = {
	title: "file.mp4",
	type: 'file',
	description: "test",
	title_link: "/file-upload/test",
	title_link_download: true,
	video_url: "/file-upload/test",
	video_type: "video/mp4",
	video_size: 1234,
	fileId: "test",
};

const stripped = [attachment].map((att) => {
	if ('type' in att && att.type === 'file') {
		return {
			text: 'You can not view this attachment because you are not a member of the original room.',
		};
	}
	return att;
});

console.log(stripped);
