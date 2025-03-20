import { memo } from 'preact/compat';

import DocIcon from '../../../icons/doc.svg';
import FileIcon from '../../../icons/file.svg';
import PDFIcon from '../../../icons/pdf.svg';
import PPTIcon from '../../../icons/ppt.svg';
import SheetIcon from '../../../icons/sheet.svg';
import ZipIcon from '../../../icons/zip.svg';

export const FileAttachmentIcon = memo(({ url }: { url?: string }) => {
	const extension = url ? url.split('.').pop() : null;

	const Icon =
		extension &&
		((/pdf/i.test(extension) && PDFIcon) ||
			(/doc|docx|rtf|txt|odt|pages|log/i.test(extension) && DocIcon) ||
			(/ppt|pptx|pps/i.test(extension) && PPTIcon) ||
			(/xls|xlsx|csv/i.test(extension) && SheetIcon) ||
			(/zip|rar|7z|gz/i.test(extension) && ZipIcon) ||
			FileIcon);
	return <Icon width={32} />;
});
