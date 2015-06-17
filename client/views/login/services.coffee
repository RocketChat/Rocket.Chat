Template.loginServices.helpers
	loginService: ->
		services = []

		authServices = _.pluck ServiceConfiguration.configurations.find({}, { service: 1 }).fetch(), 'service'
		
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

		Meteor[loginWithService] serviceConfig, (error) ->
			if error?.error is 'github-no-public-email'
				alert t("github_no_public_email")
				return

			console.log error
			if error
				toastr.error error.message
				return
			Router.go 'index'
