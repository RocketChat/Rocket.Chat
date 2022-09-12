import DocIcon from '../../../icons/doc.svg';
import FileIcon from '../../../icons/file.svg';
import PDFIcon from '../../../icons/pdf.svg';
import PPTIcon from '../../../icons/ppt.svg';
import SheetIcon from '../../../icons/sheet.svg';
import ZipIcon from '../../../icons/zip.svg';
import { memo } from '../../helpers';

export const FileAttachmentIcon = memo(({ url }) => {
	const extension = url ? url.split('.').pop() : null;

	const Icon =
		(/pdf/i.test(extension) && PDFIcon) ||
		(/doc|docx|rtf|txt|odt|pages|log/i.test(extension) && DocIcon) ||
		(/ppt|pptx|pps/i.test(extension) && PPTIcon) ||
		(/xls|xlsx|csv/i.test(extension) && SheetIcon) ||
		(/zip|rar|7z|gz/i.test(extension) && ZipIcon) ||
		FileIcon;
	return <Icon width={32} />;
});
