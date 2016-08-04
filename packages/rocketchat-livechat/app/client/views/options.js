Template.options.events({
	'click .end-chat'() {
		swal({
			text: t('Are_you_sure_do_you_want_end_this_chat'),
			title: '',
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('No'),
			closeOnConfirm: false,
			html: false
		}, () => {
			Meteor.call('livechat:closeByVisitor', (error) => {
				if (error) {
					return console.log('Error ->', error);
				}

				swal({
					title: '',
					text: t('Chat_ended'),
					type: 'success',
					timer: 1500,
					showConfirmButton: false
				});
			});
		});
	}
});
