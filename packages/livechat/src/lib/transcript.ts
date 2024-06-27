import i18next from 'i18next';

import { Livechat } from '../api';
import { ModalManager } from '../components/Modal';
import store from '../store';

const promptTranscript = async () => {
	const {
		config: {
			messages: { transcriptMessage },
		},
		user,
		room,
	} = store.state;

	if (!room || !user) {
		console.warn('Only call promptTranscript when there is a room and a user');
		return;
	}

	const { visitorEmails } = user;

	const { _id } = room;

	const email = visitorEmails && visitorEmails.length > 0 ? visitorEmails[0].address : '';
	if (!email) {
		return;
	}

	const message = transcriptMessage || i18next.t('would_you_like_a_copy_of_this_chat_emailed');

	return ModalManager.confirm({
		text: message,
	}).then((result) => {
		if (typeof result.success === 'boolean' && result.success) {
			return Livechat.requestTranscript(email, { rid: _id });
		}
	});
};

const transcriptSentAlert = (message: string) =>
	ModalManager.alert({
		text: message,
		timeout: 1000,
	});

export const handleTranscript = async () => {
	const {
		config: { settings: { transcript } = {} },
	} = store.state;

	if (!transcript) {
		return;
	}

	const result = await promptTranscript();

	// TODO: Check why the api results are not returning the correct type
	if ((result as { message: string; success: boolean })?.success) {
		transcriptSentAlert(i18next.t('transcript_success'));
	}
};
