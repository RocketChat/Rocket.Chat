@mobileMessageMenu =
	hide: ->
		$('.mobile-message-menu').addClass('hidden')

	show: (message, template) ->
		mobileMessageMenu.message = message
		mobileMessageMenu.template = template
		$('.mobile-message-menu').removeClass('hidden')


Template.mobileMessageMenu.events
	'click #cancel': (event, template, doc) ->
		mobileMessageMenu.hide()

	'click #delete-message': (event, template, doc) ->
		mobileMessageMenu.hide()

		message = mobileMessageMenu.message
		instance = mobileMessageMenu.template
		swal {
			title: t('Are_you_sure')
			text: t('You_will_not_be_able_to_recover')
			type: 'warning'
			showCancelButton: true
			confirmButtonColor: '#DD6B55'
			confirmButtonText: t('Yes_delete_it')
			cancelButtonText: t('Cancel')
			closeOnConfirm: false
			html: false
		}, ->
			swal 
				title: t('Deleted')
				text: t('Your_entry_has_been_deleted')
				type: 'success'
				timer: 1000
				showConfirmButton: false 

			instance.chatMessages.deleteMsg(message)

	'click #report-abuse': (event, template, doc) ->
		swal {
			title: 'Do you want to report this message?'
			text: mobileMessageMenu.message.html
			inputPlaceholder: 'Why do you want to report?'
			type: 'input'
			showCancelButton: true
			confirmButtonColor: '#DD6B55'
			confirmButtonText: "Report!"
			cancelButtonText: t('Cancel')
			closeOnConfirm: false
			html: false
		}, (inputValue) ->
			if inputValue is false
				return false

			if inputValue is ""
				swal.showInputError("You need to write something!")
				return false

			Meteor.call 'reportMessage', mobileMessageMenu.message, inputValue

			swal 
				title: "Report sent"
				text: "Thank you!"
				type: 'success'
				timer: 1000
				showConfirmButton: false 

		mobileMessageMenu.hide()