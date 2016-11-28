/* global window, IDM:true, GAME:true, getServiceBaseURL:true  */
/* exported IDM, GAME, getServiceBaseURL */

IDM = 'idm'
GAME = 'game'

const SERVICES = [IDM, GAME]

getServiceBaseURL = serviceName => {
  if (SERVICES.indexOf(serviceName) < 0) {
    throw new Error(`Invalid service name: ${serviceName}`)
  }

  const context = typeof window !== 'undefined' ?
    window.location.href :
    process.env.ROOT_URL

  switch (true) {
    case /\.dev/.test(context):
      return `http://${serviceName}.learnersguild.dev`
    default:
      return `https://${serviceName}.learnersguild.org`
  }
}
