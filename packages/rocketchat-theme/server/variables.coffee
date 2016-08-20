
# TODO: Define registers/getters/setters for packages to work with established
# 			heirarchy of colors instead of making duplicate definitions
# TODO: Settings pages to show simple separation of major/minor/addon colors
# TODO: Get major colours as swatches for minor colors in minicolors plugin
# TODO: Minicolors settings to use rgb for alphas, hex otherwise
# TODO: Add setting toggle to use defaults for minor colours and hide settings

# New colors, used for shades on solid backgrounds
# Defined range of transparencies reduces random colour variances
alphaColors=
	'transparent-darkest': 'rgba(0,0,0,.17)'
	'transparent-darker': 'rgba(0,0,0,.1)'
	'transparent-dark': 'rgba(0,0,0,.03)'
	'transparent-light': 'rgba(255,255,255,0.6)'
	'transparent-lighter': 'rgba(255,255,255,0.26)'
	'transparent-lightest': 'rgba(255,255,255,0.08)'

# Major colors form the core of the scheme (unchanged from prev versions)
# Names changed to reflect usage, comments show pre-refactor names
majorColors=
	'content-background-color': '#FFFFFF'
	'primary-background-color': '#04436A'
	'primary-font-color': '#444444'
	'primary-action-color': '#13679A' # was action-buttons-color
	'secondary-background-color': '#F4F4F4'
	'secondary-font-color': '#7F7F7F'
	'secondary-action-color': '#AAAAAA'
	'component-color': '#EAEAEA'
	'success-color': '#1DCE73'
	'pending-color': '#FCB316'
	'error-color': '#BC2031'
	'selection-color': '#FF5678'

# Minor colours implement major colours by default, but can be overruled
minorColors=
	'tertiary-background-color': majorColors['component-color']
	'tertiary-font-color': alphaColors['transparent-light']
	'link-font-color': majorColors['primary-action-color']
	'info-font-color': majorColors['secondary-font-color']
	'custom-scrollbar-color': alphaColors['transparent-lightest']
	'status-online': majorColors['success-color']
	'status-away': majorColors['pending-color']
	'status-busy': majorColors['error-color']
	'status-offline': alphaColors['transparent-darkest']

# Depreciated colors (not loaded, can be restored if required)
depreciated=
	'active-channel-background-color': 'rgba(255, 255, 255, 0.075)'
	'active-channel-font-color': 'rgba(255, 255, 255, 0.75)'
	'blockquote-background': '#cccccc'
	'clean-buttons-color': 'rgba(0, 0, 0, 0.25)'
	'code-background': '#f8f8f8'
	'code-border': '#cccccc'
	'code-color': '#333333'
	'quaternary-font-color': '#ffffff'
	'info-active-font-color': '#ff0000'
	'input-font-color': 'rgba(255, 255, 255, 0.85)'
	'message-hover-background-color': 'rgba(0, 0, 0, 0.025)'
	'smallprint-font-color': '#c2e7ff'
	'smallprint-hover-color': '#ffffff'
	'unread-notification-color': '#1dce73'

# Bulk-add settings for color scheme
for key, value of _.extend {}, alphaColors, majorColors, minorColors
	RocketChat.theme.addPublicColor key, value

RocketChat.theme.addPublicFont 'body-font-family', "-apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Meiryo UI'"

RocketChat.settings.add 'theme-custom-css', '',
	group: 'Layout'
	type: 'code'
	code: 'text/x-less'
	multiline: true
	section: 'Custom CSS'
	public: false
