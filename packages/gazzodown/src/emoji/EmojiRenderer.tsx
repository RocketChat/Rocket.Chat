import { MessageEmoji, ThreadMessageEmoji } from '@rocket.chat/fuselage';
import type * as MessageParser from '@rocket.chat/message-parser';
import DOMPurify from 'dompurify';
import type { ReactElement } from 'react';
import { useMemo, useContext, memo } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type EmojiProps = MessageParser.Emoji & {
	big?: boolean;
	preview?: boolean;
};

const EmojiRenderer = ({ big = false, preview = false, ...emoji }: EmojiProps): ReactElement => {
	const { detectEmoji } = useContext(MarkupInteractionContext);

	const fallback = useMemo(() => {
		try {
			// Safely construct fallback from unicode or shortCode/value with null checks
			if ('unicode' in emoji && typeof emoji.unicode === 'string') {
				return emoji.unicode;
			}

			// For shortCode emoji, safely extract values with defensive checks
			if ('shortCode' in emoji && typeof emoji.shortCode === 'string') {
				return `:${emoji.shortCode}:`;
			}

			// Try to access nested value property
			if ('value' in emoji && emoji.value && typeof emoji.value === 'object' && 'value' in emoji.value) {
				const { value: nestedValue } = emoji.value;
				if (typeof nestedValue === 'string') {
					return nestedValue;
				}
			}

			// Final fallback
			return ':emoji:';
		} catch (error) {
			console.error('Error computing emoji fallback:', error);
			return ':emoji:';
		}
	}, [emoji]);

	const sanitizedFallback = DOMPurify.sanitize(fallback);

	const descriptors = useMemo(() => {
		try {
			if (!detectEmoji || typeof detectEmoji !== 'function') {
				return undefined;
			}

			const detected = detectEmoji(sanitizedFallback);

			// Validate detected is an array with content
			if (!Array.isArray(detected) || detected.length === 0) {
				return undefined;
			}

			return detected;
		} catch (error) {
			console.error('Error detecting emoji:', error);
			return undefined;
		}
	}, [detectEmoji, sanitizedFallback]);

	return (
		<>
			{descriptors?.map(({ name, className, image, content }, i) => {
				try {
					// Validate required properties exist and are safe
					const safeName = typeof name === 'string' ? name : `emoji-${i}`;
					const safeClassName = typeof className === 'string' ? className : '';
					const safeImage = typeof image === 'string' ? image : undefined;
					const safeContent = typeof content === 'string' ? content : '';

					return (
						<span key={i} title={safeName}>
							{preview ? (
								<ThreadMessageEmoji className={safeClassName} name={safeName} image={safeImage}>
									{safeContent}
								</ThreadMessageEmoji>
							) : (
								<MessageEmoji big={big} className={safeClassName} name={safeName} image={safeImage}>
									{safeContent}
								</MessageEmoji>
							)}
						</span>
					);
				} catch (error) {
					console.error('Error rendering emoji descriptor:', error, { name, className, image, content });
					return null;
				}
			}) ?? (
				<span title={sanitizedFallback} role='img' aria-label={sanitizedFallback.charAt(0) === ':' ? sanitizedFallback : undefined}>
					{sanitizedFallback}
				</span>
			)}
		</>
	);
};

export default memo(EmojiRenderer);
