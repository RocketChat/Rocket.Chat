
# TODO: Define registers/getters/setters for packages to work with established
# 			heirarchy of colors instead of making duplicate definitions
# TODO: Settings pages to show simple separation of major/minor/addon colors
# TODO: Get major colours as swatches for minor colors in minicolors plugin
# TODO: Minicolors settings to use rgb for alphas, hex otherwise
# TODO: Add setting toggle to use defaults for minor colours and hide settings

# New colors, used for shades on solid backgrounds
# Defined range of transparencies reduces random colour variances
alphaColors=
  'transparent-darker': 'rgba(0,0,0,0.15)'
  'transparent-dark': 'rgba(0,0,0,0.05)'
  'transparent-light': 'rgba(255,255,255,0.10)'
  'transparent-lighter': 'rgba(255,255,255,0.30)'
  'transparent-lightest': 'rgba(255,255,255,0.60)'

# Major colors form the core of the scheme
# Names changed to reflect usage, comments show pre-refactor names
majorColors=
  'content-background-color': '#FFFFFF'
  'primary-background-color': '#04436A'
  'primary-font-color': '#444444'
  'primary-action-color': '#13679A' # was action-buttons-color
  'secondary-background-color': '#F4F4F4'
  'secondary-font-color': '#A0A0A0'
  'secondary-action-color': '#E5E5E5'
  'component-color': '#EAEAEA'
  'success-color': '#1DCE73'
  'pending-color': '#FCB316'
  'error-color': '#BC2031'
  'selection-color': '#02ACEC'

# Minor colours implement major colours by default, but can be overruled
minorColors=
  'tertiary-background-color': '@component-color'
  'tertiary-font-color': '@transparent-lightest'
  'link-font-color': '@primary-action-color'
  'info-font-color': '@secondary-font-color'
  'custom-scrollbar-color': '@transparent-darker'
  'status-online': '@success-color'
  'status-away': '@pending-color'
  'status-busy': '@error-color'
  'status-offline': '@transparent-darker'

# Bulk-add settings for color scheme
for key, value of majorColors
  RocketChat.theme.addPublicColor key, value, 'Colors'
for key, value of alphaColors
  RocketChat.theme.addPublicColor key, value, 'Colors (alphas)'
for key, value of minorColors
  RocketChat.theme.addPublicColor key, value, 'Colors (minor)', 'expression'

RocketChat.theme.addPublicFont 'body-font-family', "-apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Meiryo UI'"

RocketChat.settings.add 'theme-custom-css', '',
  group: 'Layout'
  type: 'code'
  code: 'text/x-less'
  multiline: true
  section: 'Custom CSS'
  public: false
