// Blockstack login handler, triggered by a blockstack authResponse in route
Accounts.registerLoginHandler('blockstack', (loginRequest) => {
  if (!loginRequest.blockstack || !loginRequest.authResponse) return
  console.log(loginRequest.userData)
  // TODO: verify token
})
