/* globals LivechatVideoCall, Livechat */
import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import swal from 'sweetalert2';
import visitor from '../../imports/client/visitor';

// Functions to call on messages of type 'command'
this.Commands = {
	survey() {
		if (!$('body #survey').length) {
			Blaze.render(Template.survey, $('body').get(0));
		}
	},

	endCall() {
		LivechatVideoCall.finish();
	},

	promptTranscript() {
		if (Livechat.transcript) {
			const visitorData = visitor.getData();
			const email = visitorData && visitorData.visitorEmails && visitorData.visitorEmails.length > 0 ? visitorData.visitorEmails[0].address : '';
			const transcriptMessage = Livechat.transcriptMessage ? Livechat.transcriptMessage : TAPi18n.__('Would_you_like_a_copy_if_this_chat_emailed');

			swal({
				title: t('Chat_ended'),
				text: transcriptMessage,
				input: 'email',
				inputValue: email,
				inputPlaceholder: t('Type_your_email'),
				showCancelButton: true,
				cancelButtonText: t('no'),
				confirmButtonText: t('yes'),
			}).then((result) => {
				if ((typeof result.value === 'boolean') && !result.value) {
					return true;
				}

				if (!result.value || result.value.trim() === '') {
					swal.showValidationError(t('please enter your email'));
					return false;
				}

				Meteor.call('livechat:sendTranscript', visitor.getToken(), visitor.getRoom(), result.value, (err) => {
					if (err) {
						console.error(err);
					}
					swal({
						title: t('transcript_sent'),
						type: 'success',
						timer: 1000,
						showConfirmButton: false,
					});
				});
			});
		}
	},

	connected() {
		Livechat.connecting = false;
	},
};
