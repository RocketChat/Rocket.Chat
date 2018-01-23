// Blockstack login handler, triggered by a blockstack authResponse in route
Accounts.registerLoginHandler('blockstack', (loginRequest) => {
  if (!loginRequest.blockstack || !loginRequest.authResponse) return
  // TODO: verify token
  console.log(Accounts.blockstack.getUserData())
})
