Meteor.startup(() => {
  WebApp.rawConnectHandlers.use(Accounts.blockstack.manifestPath, (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    return next()
  })
})
