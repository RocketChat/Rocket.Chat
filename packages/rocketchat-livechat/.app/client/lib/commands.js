/* globals LivechatVideoCall, Livechat */
import visitor from '../../imports/client/visitor';

// Functions to call on messages of type 'command'
this.Commands = {
	survey() {
		if (!($('body #survey').length)) {
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

			swal({
				title: t('Chat_ended'),
				text: Livechat.transcriptMessage,
				type: 'input',
				inputValue: email,
				showCancelButton: true,
				cancelButtonText: t('no'),
				confirmButtonText: t('yes'),
				closeOnCancel: true,
				closeOnConfirm: false
			}, (response) => {
				if ((typeof response === 'boolean') && !response) {
					return true;
				} else {
					if (!response) {
						swal.showInputError(t('please enter your email'));
						return false;
					}
					if (response.trim() === '') {
						swal.showInputError(t('please enter your email'));
						return false;
					} else {
						Meteor.call('livechat:sendTranscript', visitor.getToken(), visitor.getRoom(), response, (err) => {
							if (err) {
								console.error(err);
							}
							swal({
								title: t('transcript_sent'),
								type: 'success',
								timer: 1000,
								showConfirmButton: false
							});
						});
					}
				}
			});
		} else {
			swal({
				title: t('Chat_ended'),
				type: 'success',
				timer: 1000,
				showConfirmButton: false
			});
		}
	},

	connected() {
		Livechat.connecting = false;
	}
};
