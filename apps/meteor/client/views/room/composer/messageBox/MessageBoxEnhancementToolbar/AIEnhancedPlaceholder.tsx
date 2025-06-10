import { ReactNode } from 'react';
import { css } from '@rocket.chat/css-in-js';

const aiEnhancedStyle = css`
	position: relative;
	background: linear-gradient(90deg, #f0f0f0 0%, #c0ffe0 50%, #f0f0f0 100%);
	background-size: 200% 100%;
	animation: shimmer 2s infinite;
	padding: 0.2em 0.4em;
	border-radius: 4px;
	font-weight: bold;
	color: #1a1a1a;


	@keyframes shimmer {
		0% { background-position: -100% 0; }
		100% { background-position: 200% 0; }
	}
`;

interface AIEnhancedPlaceholderProps {
	children: ReactNode;
	id?: string | number;
}

/**
 * <AIEnhancedPlaceholder> wraps its children with a shimmer animation,
 * prevents user edits, and can be reused across the app.
 */
const AIEnhancedPlaceholder = ({ children, id }: AIEnhancedPlaceholderProps) => (
	<span
		className={aiEnhancedStyle.toString()}
		contentEditable={false}
		data-ai-placeholder-id={id}
	>
		{children}
	</span>
);

export default AIEnhancedPlaceholder;
