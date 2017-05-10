Template.accountFlex.events
	'mouseenter header': ->
		SideNav.overArrow()

	'mouseleave header': ->
		SideNav.leaveArrow()

	'click header': ->
		SideNav.closeFlex()

	'click .cancel-settings': ->
		SideNav.closeFlex()

	'click .account-link': ->
		menu.close()

Template.accountFlex.helpers
	allowUserProfileChange: ->
		return RocketChat.settings.get("Accounts_AllowUserProfileChange")
	allowUserAvatarChange: ->
		return RocketChat.settings.get("Accounts_AllowUserAvatarChange")
	slackBridgeEnabled: ->
		return RocketChat.settings.get("SlackBridge_Enabled") and
			RocketChat.settings.get("SlackBridge_Event_API_Enabled") and
			RocketChat.settings.get("SlackBridge_Client_ID")? and
			RocketChat.settings.get("SlackBridge_Client_Secret")? and
			RocketChat.settings.get("SlackBridge_OAuth_Scopes")? and
			RocketChat.settings.get("SlackBridge_OAuth_Redirect_Url")? and
			RocketChat.settings.get("SlackBridge_Verification_Token")?
