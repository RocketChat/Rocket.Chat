/* global commandFuncs, toggleFlexPanel, getServiceBaseURL, IDM */

commandFuncs.profile = args => {
  if (!args.help && args._.length === 0) {
    const flexPanelURL = `${getServiceBaseURL(IDM)}/profile#${Date.now()}`
    toggleFlexPanel(flexPanelURL)
  }
}
