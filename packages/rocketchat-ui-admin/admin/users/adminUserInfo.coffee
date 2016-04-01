Template.adminUserInfo.helpers
	name: ->
		return if @name then @name else TAPi18n.__ 'Unnamed'
	email: ->
		return @emails?[0]?.address
	phoneNumber: ->
		return '' unless @phoneNumber
		if @phoneNumber.length > 10
			return "(#{@phoneNumber.substr(0,2)}) #{@phoneNumber.substr(2,5)}-#{@phoneNumber.substr(7)}"
		else
			return "(#{@phoneNumber.substr(0,2)}) #{@phoneNumber.substr(2,4)}-#{@phoneNumber.substr(6)}"
	lastLogin: ->
		if @lastLogin
			return moment(@lastLogin).format('LLL')
	utcOffset: ->
		if @utcOffset?
			if @utcOffset > 0
				@utcOffset = "+#{@utcOffset}"

			return "UTC #{@utcOffset}"
	hasAdminRole: ->
		return RocketChat.authz.hasRole(@_id, 'admin')
	active: ->
		if @_id
			user = Meteor.users.findOne(@_id)
			return user && user.active

Template.adminUserInfo.events
	'click .deactivate': (e) ->
		e.stopPropagation()
		e.preventDefault()
		Meteor.call 'setUserActiveStatus', Template.currentData()._id, false, (error, result) ->
			if result
				toastr.success t('User_has_been_deactivated')
			if error
				toastr.error error.reason

	'click .activate': (e) ->
		e.stopPropagation()
		e.preventDefault()
		Meteor.call 'setUserActiveStatus', Template.currentData()._id, true, (error, result) ->
			if result
				toastr.success t('User_has_been_activated')
			if error
				toastr.error error.reason

	'click .make-admin': (e) ->
		e.stopPropagation()
		e.preventDefault()
		Meteor.call 'setAdminStatus', Template.currentData()._id, true, (error, result) ->
			if result
				toastr.success t('User_is_now_an_admin')
			if error
				toastr.error error.reason

	'click .remove-admin': (e) ->
		e.stopPropagation()
		e.preventDefault()
		Meteor.call 'setAdminStatus', Template.currentData()._id, false, (error, result) ->
			if result
				toastr.success t('User_is_no_longer_an_admin')
			if error
				toastr.error error.reason

	'click .delete': (e) ->
		e.stopPropagation()
		e.preventDefault()
		_id = Template.currentData()._id
		swal {
			title: t('Are_you_sure')
			text: t('Delete_User_Warning')
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
				text: t('User_has_been_deleted')
				type: 'success'
				timer: 2000
				showConfirmButton: false

			Meteor.call 'deleteUser', _id, (error, result) ->
				if error
					toastr.error error.reason

				RocketChat.TabBar.setData()
				RocketChat.TabBar.closeFlex()
				RocketChat.TabBar.showGroup 'adminusers'

				Session.set 'showUserInfo'

	'click .edit-user': (e) ->
		e.stopPropagation()
		e.preventDefault()
		RocketChat.TabBar.setTemplate 'adminUserEdit'
		RocketChat.TabBar.setData Template.currentData()._id
