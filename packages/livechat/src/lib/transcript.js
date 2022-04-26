import i18next from 'i18next';

import { Livechat } from '../api';
import { ModalManager } from '../components/Modal';
import store from '../store';


const promptTranscript = async () => {
	console.log(store.state);
	const { config: { messages: { transcriptMessage } }, user: { token, visitorEmails }, room: { _id } } = store.state;
	const email = visitorEmails && visitorEmails.length > 0 ? visitorEmails[0].address : '';
	if (!email) {
		return;
	}

	const message = transcriptMessage || i18next.t('would_you_like_a_copy_of_this_chat_emailed');

	return ModalManager.confirm({
		text: message,
	}).then((result) => {
		if ((typeof result.success === 'boolean') && result.success) {
			return Livechat.requestTranscript(email, { token, rid: _id });
		}
	});
};

const transcriptSentAlert = (message) => ModalManager.alert({
	text: message,
	timeout: 1000,
});


export const handleTranscript = async () => {
	const { config: { settings: { transcript } = {} } } = store.state;

	if (!transcript) {
		return;
	}

	const result = await promptTranscript();

	if (result && result.success) {
		transcriptSentAlert(i18next.t('transcript_success'));
	}
};
