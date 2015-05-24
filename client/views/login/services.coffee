Template.loginServices.helpers
	hasLoginServices: ->
		return Accounts.oauth.serviceNames()?.length > 0

	loginService: ->
		services = []

		authServices = Accounts.oauth.serviceNames()

		authServices.sort()

		authServices.forEach (service) ->
			switch service
				when 'meteor-developer'
					serviceName = 'Meteor'
					icon = 'dot-circle-o'
				when 'github'
					serviceName = 'GitHub'
					icon = service
				else
					serviceName = _.capitalize service
					icon = service

			services.push
				service: service
				displayName: serviceName
				icon: icon

		return services

Template.loginServices.events
	'click .external-login': ->
		return unless this.service?

		loginWithService = "loginWith" + (if this.service is 'meteor-developer' then 'MeteorDeveloperAccount' else _.capitalize(this.service))

		serviceConfig = {}

		if this.service is 'github'
			serviceConfig.requestPermissions = ['user']

		Meteor[loginWithService] serviceConfig, (error) ->
			console.log error
			if error
				toastr.error error.message
				return
			Router.go 'index'
