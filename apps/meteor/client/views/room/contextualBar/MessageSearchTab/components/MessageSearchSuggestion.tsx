import type { ISearchProvider } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import BlazeTemplate from '../../../components/BlazeTemplate';
import type { MessageSearchSuggestion as MessageSearchSuggestionType } from '../lib/MessageSearchSuggestion';
import { getSuggestionText } from '../lib/getSuggestionText';

type MessageSearchSuggestionProps = {
	provider: ISearchProvider;
	suggestion: MessageSearchSuggestionType;
	active: boolean;
	onClick: (suggestion: MessageSearchSuggestionType) => void;
	onHover: (suggestion: MessageSearchSuggestionType) => void;
};

const MessageSearchSuggestion = ({ provider, suggestion, active, onClick, onHover }: MessageSearchSuggestionProps) => {
	const handleClick = useMutableCallback(() => {
		onClick(suggestion);
	});

	const handleMouseEnter = useMutableCallback(() => {
		onHover(suggestion);
	});

	const t = useTranslation();

	return (
		<div
			className={['rocket-search-suggestion-item', active && 'active'].filter(Boolean).join(' ')}
			onClick={handleClick}
			onMouseEnter={handleMouseEnter}
		>
			{provider.suggestionItemTemplate === 'ChatpalSuggestionItemTemplate' && (
				<div className='chatpal-suggestion'>
					<span className='chatpal-suggestion-text'>{getSuggestionText(suggestion)}</span>
					<span className='chatpal-suggestion-hint'>
						{t('Chatpal_run_search')}
						<BlazeTemplate name='icon' icon='chatpal-enter' />
					</span>
				</div>
			)}
			{provider.suggestionItemTemplate === 'DefaultSuggestionItemTemplate' && (
				<div className='default-suggestion'>{getSuggestionText(suggestion)}</div>
			)}
		</div>
	);
};

export default MessageSearchSuggestion;
