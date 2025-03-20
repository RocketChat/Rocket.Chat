import { Box } from '@rocket.chat/fuselage';
import DOMPurify from 'dompurify';

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

	return <Box wordBreak='break-word' color='default' dangerouslySetInnerHTML={sanitize(html, options)} />;
};

export default OutlookEventItemContent;
