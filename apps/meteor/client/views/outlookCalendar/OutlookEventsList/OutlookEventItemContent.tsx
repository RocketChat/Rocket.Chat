import { Box } from '@rocket.chat/fuselage';
import DOMPurify from 'dompurify';

export type OutlookEventItemContentProps = {
	html: string;
	options?: {
		[key: string]: string;
	};
};

const OutlookEventItemContent = ({ html, options }: OutlookEventItemContentProps) => {
	const defaultOptions = {
		ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'],
		ALLOWED_ATTR: ['href'],
	};

	const sanitize = (dirtyHTML: OutlookEventItemContentProps['html'], options: OutlookEventItemContentProps['options']) => ({
		__html: DOMPurify.sanitize(dirtyHTML, { ...defaultOptions, ...options }).toString(),
	});

	return <Box wordBreak='break-word' color='default' dangerouslySetInnerHTML={sanitize(html, options)} />;
};

export default OutlookEventItemContent;
