import type { IMessageSearchProvider, IMessageSearchSuggestion } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

type MessageSearchSuggestionProps = {
	provider: IMessageSearchProvider;
	suggestion: IMessageSearchSuggestion;
	active: boolean;
	onClick: (suggestion: IMessageSearchSuggestion) => void;
	onHover: (suggestion: IMessageSearchSuggestion) => void;
};

const MessageSearchSuggestion = ({ provider, suggestion, active, onClick, onHover }: MessageSearchSuggestionProps) => {
	const handleClick = useMutableCallback(() => {
		onClick(suggestion);
	});

	const handleMouseEnter = useMutableCallback(() => {
		onHover(suggestion);
	});

	return (
		<div
			className={['rocket-search-suggestion-item', active && 'active'].filter(Boolean).join(' ')}
			onClick={handleClick}
			onMouseEnter={handleMouseEnter}
		>
			{provider.suggestionItemTemplate === 'DefaultSuggestionItemTemplate' && <div className='default-suggestion'>{suggestion.text}</div>}
		</div>
	);
};

export default MessageSearchSuggestion;
