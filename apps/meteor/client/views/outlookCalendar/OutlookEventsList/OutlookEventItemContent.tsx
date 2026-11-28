import DOMPurify from 'dompurify';

import RichContent from '../../../components/RichContent';

type SanitizeProps = {
	html: string;
	options?: {
		[key: string]: string;
	};
};

const OutlookEventItemContent = ({ html, options }: SanitizeProps) => {
	const defaultOptions = {
		ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'],
		ALLOWED_ATTR: ['href'],
	};

	const sanitize = (dirtyHTML: SanitizeProps['html'], options: SanitizeProps['options']) => ({
		__html: DOMPurify.sanitize(dirtyHTML, { ...defaultOptions, ...options }).toString(),
	});

	return <RichContent dangerouslySetInnerHTML={sanitize(html, options)} />;
};

export default OutlookEventItemContent;
