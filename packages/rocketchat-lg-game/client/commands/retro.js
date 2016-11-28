/* global commandFuncs, openFlexPanel, getServiceBaseURL, GAME */

commandFuncs.retro = args => {
  if (args.help || args._.length > 1) {
    return  // handled by game-cli in server/index.js
  }

  const projectPath = args._.length === 1 ? `/${args._[0].replace('#', '')}` : ''
  const flexPanelURL = `${getServiceBaseURL(GAME)}/retro${projectPath}#${Date.now()}`
  openFlexPanel(flexPanelURL)
}
