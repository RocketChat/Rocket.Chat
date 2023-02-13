import type { ISearchProvider } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import BlazeTemplate from '../../../components/BlazeTemplate';

type MessageSearchSuggestionProps = {
	provider: ISearchProvider;
	suggestion: { action(): string } | { text: string };
	active: boolean;
	onClick: (suggestion: { action(): string } | { text: string }) => void;
	onHover: (suggestion: { action(): string } | { text: string }) => void;
};

const MessageSearchSuggestion = ({ provider, suggestion, active, onClick, onHover }: MessageSearchSuggestionProps) => {
	const handleClick = useMutableCallback(() => {
		onClick(suggestion);
	});

	const handleMouseEnter = useMutableCallback(() => {
		onHover(suggestion);
	});

	return (
		<BlazeTemplate
			className={['rocket-search-suggestion-item', active && 'active'].filter(Boolean).join(' ')}
			name={provider.suggestionItemTemplate as 'DefaultSuggestionItemTemplate' | 'ChatpalSuggestionItemTemplate'}
			onClick={handleClick}
			onMouseEnter={handleMouseEnter}
			{...suggestion}
		/>
	);
};

export default MessageSearchSuggestion;
