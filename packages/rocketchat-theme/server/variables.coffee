RocketChat.theme.addPublicColor "primary-background-color", "#1F6CFB"
RocketChat.theme.addPublicColor "primary-font-color", "#FC6737"
RocketChat.theme.addPublicColor "secondary-background-color", "#F8C700"
RocketChat.theme.addPublicColor "secondary-font-color", "#9C35C2"
RocketChat.theme.addPublicColor "tertiary-background-color", "#eaeaea"
RocketChat.theme.addPublicColor "tertiary-font-color", "rgba(255, 255, 255, 0.6)"
RocketChat.theme.addPublicColor "quaternary-font-color", "#ffffff"

RocketChat.theme.addPublicColor "action-buttons-color", "#13679a"
RocketChat.theme.addPublicColor "active-channel-background-color", "rgba(255, 255, 255, 0.075)"
RocketChat.theme.addPublicColor "active-channel-font-color", "rgba(255, 255, 255, 0.75)"
RocketChat.theme.addPublicColor "blockquote-background", "#cccccc"
RocketChat.theme.addPublicColor "clean-buttons-color", "rgba(0, 0, 0, 0.25)"
RocketChat.theme.addPublicColor "code-background", "#f8f8f8"
RocketChat.theme.addPublicColor "code-border", "#cccccc"
RocketChat.theme.addPublicColor "code-color", "#333333"
RocketChat.theme.addPublicColor "content-background-color", "#ffffff"
RocketChat.theme.addPublicColor "custom-scrollbar-color", "rgba(255, 255, 255, 0.05)"
RocketChat.theme.addPublicColor "info-active-font-color", "#ff0000"
RocketChat.theme.addPublicColor "info-font-color", "#aaaaaa"
RocketChat.theme.addPublicColor "input-font-color", "rgba(255, 255, 255, 0.85)"
RocketChat.theme.addPublicColor "link-font-color", "#008ce3"
RocketChat.theme.addPublicColor "message-hover-background-color", "rgba(0, 0, 0, 0.025)"
RocketChat.theme.addPublicColor "smallprint-font-color", "#c2e7ff"
RocketChat.theme.addPublicColor "smallprint-hover-color", "#ffffff"
RocketChat.theme.addPublicColor "status-away", "#fcb316"
RocketChat.theme.addPublicColor "status-busy", "#d30230"
RocketChat.theme.addPublicColor "status-offline", "rgba(150, 150, 150, 0.50)"
RocketChat.theme.addPublicColor "status-online", "#35ac19"
RocketChat.theme.addPublicColor "unread-notification-color", "#1dce73"

RocketChat.theme.addPublicFont "body-font-family", '-apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI", "Segoe UI Emoji", "Segoe UI Symbol", "Meiryo UI"'


RocketChat.settings.add "theme-custom-css", '',
	group: 'Layout'
	type: 'code'
	code: 'text/x-less'
	multiline: true
	section: 'Custom CSS'
	public: false
