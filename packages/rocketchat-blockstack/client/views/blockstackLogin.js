import { Blockstack } from '../../client'

Template.blockstackLogin.replaces('loginForm')

Template.loginForm.helpers({

})

Template.loginForm.events({
  'click #signin-button' (e, t) {
    e.preventDefault()
    console.log('@TODO: Blockstack signin...')
  }
})
