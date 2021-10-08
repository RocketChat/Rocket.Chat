import React, { FC, useEffect } from 'react';

import { PDFAttachmentProps } from '../../../../../definition/IMessage/MessageAttachment/Files/PDFAttachmentProps';
import { useTranslation } from '../../../../contexts/TranslationContext';
import MarkdownText from '../../../MarkdownText';
import Attachment from '../Attachment';
import { useCollapse } from '../hooks/useCollapse';

async function renderPdfToCanvas(canvasId: any, pdfLink: any) {
	if (!pdfLink || !pdfLink.toLowerCase().endsWith('.pdf')) {
		return;
	}
	const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
	if (!canvas) {
		return;
	}
	const pdfjs = await import('pdfjs-dist/build/pdf');
	const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
	pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
	const loader = document.getElementById('js-loading-${canvasId}');
	if (loader) {
		loader.style.display = 'block';
	}
	const pdf = await pdfjs.getDocument(pdfLink).promise;
	const page = await pdf.getPage(1);
	const scale = 0.5;
	const viewport = page.getViewport({ scale });
	const context = canvas.getContext('2d');
	canvas.height = viewport.height;
	canvas.width = viewport.width;
	page.render({
		canvasContext: context,
		viewport,
	});
	if (loader) {
		loader.style.display = 'none';
	}
	canvas.style.maxWidth = '-webkit-fill-available';
	canvas.style.maxWidth = '-moz-available';
	canvas.style.display = 'block';
}

export const PDFAttachment: FC<PDFAttachmentProps> = ({
	collapsed: collapsedDefault = false,
	description,
	title_link: link,
	title_link_download: hasDownload,
	file,
}) => {
	const t = useTranslation();
	const [collapsed, collapse] = useCollapse(collapsedDefault);

	useEffect(() => {
		if (file && file.type === 'application/pdf') {
			renderPdfToCanvas(file._id, link);
		}
	}, []);

	return (
		<Attachment>
			{description && <MarkdownText variant='inline' content={description} />}
			<Attachment.Row>
				<Attachment.Title>{t('PDF')}</Attachment.Title>
				{collapse}
				{hasDownload && link && <Attachment.Download href={link} />}
			</Attachment.Row>
			{!collapsed && (
				<Attachment.Content>
					<canvas id={file._id} className='attachment-canvas'></canvas>
					<div id={`js-loading-${file._id}`} className='attachment-pdf-loading'>
						{file.name && <Attachment.Title>{file.name}</Attachment.Title>}
						{file.size && <Attachment.Size size={file.size} />}
					</div>
				</Attachment.Content>
			)}
		</Attachment>
	);
};
