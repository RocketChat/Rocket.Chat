import { Modal, Button, Box, ButtonGroup } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

interface AIContentSuggestionsModalProps {
	onClose: () => void;
	onSelectSuggestion: (suggestion: string) => void;
	suggestions: string[];
	originalMessage: string;
	reason?: string;
}

const AIContentSuggestionsModal: FC<AIContentSuggestionsModalProps> = ({
	onClose,
	onSelectSuggestion,
	suggestions,
	originalMessage,
	reason,
}) => {
	const t = useTranslation();

	const handleSuggestionClick = (suggestion: string) => {
		onSelectSuggestion(suggestion);
		onClose();
	};

	return (
		<Modal>
			<Modal.Header>
				<Modal.Icon name="warning" color="warning" />
				<Modal.HeaderText>
					<Modal.Title>{t('AI_Content_Verification_Message_Blocked')}</Modal.Title>
					<Modal.Tagline>{t('AI_Content_Verification_Suggestions_Available')}</Modal.Tagline>
				</Modal.HeaderText>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box mb={16}>
					<Box fontScale="p2" color="default">
						<strong>{t('AI_Content_Verification_Original_Message')}:</strong>
					</Box>
					<Box
						p={12}
						bg="neutral-200"
						border="1px solid"
						borderColor="neutral-400"
						borderRadius={4}
						fontFamily="mono"
						fontSize="x14"
						color="neutral-800"
						mbs={8}
					>
						{originalMessage}
					</Box>
				</Box>

				{reason && (
					<Box mb={16}>
						<Box fontScale="p2" color="danger">
							<strong>{t('AI_Content_Verification_Reason')}:</strong> {reason}
						</Box>
					</Box>
				)}

				<Box mb={16}>
					<Box fontScale="p2" color="default" mb={8}>
						{t('AI_Content_Verification_Select_Suggestion')}:
					</Box>
					<Box display="flex" flexDirection="column" gap={12}>
						{suggestions.map((suggestion, index) => (
							<Button
								key={index}
								secondary
								onClick={() => handleSuggestionClick(suggestion)}
								alignItems="start"
								textAlign="start"
								height="auto"
								p={16}
								mb={4}
							>
								{suggestion}
							</Button>
						))}
					</Box>
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup>
					<Button secondary onClick={onClose}>
						{t('Cancel')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default AIContentSuggestionsModal;