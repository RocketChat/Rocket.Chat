/* global commandFuncs, openFlexPanel, getServiceBaseURL, GAME */

commandFuncs.vote = args => {
  if (!args.help && (args._.length === 0 || args._.length >= 2)) {
    const flexPanelURL = `${getServiceBaseURL(GAME)}/cycle-voting-results#${Date.now()}`
    openFlexPanel(flexPanelURL)
  }
}
