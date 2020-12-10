import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { DateFormat } from '../../lib';
import { getURL } from '../../utils/client';
import { createCollapseable } from '../../ui-utils';
import { renderMessageBody } from '../../../client/lib/renderMessageBody';

const colors = {
	good: '#35AC19',
	warning: '#FCB316',
	danger: '#D30230',
};

async function renderPdfToCanvas(canvasId, pdfLink) {
	const isSafari = /constructor/i.test(window.HTMLElement)
		|| ((p) => p.toString() === '[object SafariRemoteNotification]')(!window.safari
			|| (typeof window.safari !== 'undefined' && window.safari.pushNotification));

	if (isSafari) {
		const [, version] = /Version\/([0-9]+)/.exec(navigator.userAgent) || [null, 0];
		if (version <= 12) {
			return;
		}
	}

	if (!pdfLink || !/\.pdf$/i.test(pdfLink)) {
		return;
	}
	pdfLink = getURL(pdfLink);

	const canvas = document.getElementById(canvasId);
	if (!canvas) {
		return;
	}

	const pdfjsLib = await import('pdfjs-dist');
	pdfjsLib.GlobalWorkerOptions.workerSrc = `${ Meteor.absoluteUrl() }pdf.worker.min.js`;

	const loader = document.getElementById(`js-loading-${ canvasId }`);

	if (loader) {
		loader.style.display = 'block';
	}

	const pdf = await pdfjsLib.getDocument(pdfLink).promise;
	const page = await pdf.getPage(1);
	const scale = 0.5;
	const viewport = page.getViewport({ scale });
	const context = canvas.getContext('2d');
	canvas.height = viewport.height;
	canvas.width = viewport.width;
	await page.render({
		canvasContext: context,
		viewport,
	}).promise;

	if (loader) {
		loader.style.display = 'none';
	}

	canvas.style.maxWidth = '-webkit-fill-available';
	canvas.style.maxWidth = '-moz-available';
	canvas.style.display = 'block';
}

createCollapseable(Template.messageAttachment, (instance) => (instance.data && (instance.data.collapsed || (instance.data.settings && instance.data.settings.collapseMediaByDefault))) || false);

Template.messageAttachment.helpers({
	parsedText() {
		return renderMessageBody({
			msg: this.text,
		});
	},
	markdownInPretext() {
		return this.mrkdwn_in && this.mrkdwn_in.includes('pretext');
	},
	parsedPretext() {
		return renderMessageBody({
			msg: this.pretext,
		});
	},
	loadImage() {
		if (this.downloadImages) {
			return true;
		}

		if (this.settings.autoImageLoad === false) {
			return false;
		}

		if (this.settings.saveMobileBandwidth === true) {
			return false;
		}

		return true;
	},
	getImageHeight(height = 200) {
		return height;
	},
	color() {
		return colors[this.color] || this.color;
	},
	time() {
		const messageDate = new Date(this.ts);
		const today = new Date();
		if (messageDate.toDateString() === today.toDateString()) {
			return DateFormat.formatTime(this.ts);
		}
		return DateFormat.formatDateAndTime(this.ts);
	},
	injectIndex(data, previousIndex, index) {
		data.index = `${ previousIndex }.attachments.${ index }`;
	},
	injectSettings(data, settings) {
		data.settings = settings;
	},
	injectMessage(data, { rid, _id }) {
		data.msg = { _id, rid };
	},
	injectCollapsedMedia(data) {
		const { collapsedMedia } = data;
		Object.assign(this, { collapsedMedia });
		return this;
	},
	isFile() {
		return this.type === 'file';
	},
	isPDF() {
		if (
			this.type === 'file'
			&& this.title_link.endsWith('.pdf')
			&& Template.parentData(1).msg.file
		) {
			this.fileId = Template.parentData(1).msg.file._id;
			return true;
		}
		return false;
	},
	getURL,
});

Template.messageAttachment.onRendered(function() {
	const { msg } = Template.parentData(1);
	this.autorun(() => {
		if (msg && msg.file && msg.file.type === 'application/pdf' && !this.collapsedMedia.get()) {
			Meteor.defer(() => { renderPdfToCanvas(msg.file._id, msg.attachments[0].title_link); });
		}
	});
});
