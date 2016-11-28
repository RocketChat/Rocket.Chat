/* eslint-disable prefer-arrow-callback */
/* global commandFuncs, logger */

function invoke(command, commandParamStr /* , commandInfo */) {
  // This is gross. We can't use Meteor.call() inside of this invoke() function
  // because we're already inside of what Meteor terms a "stub" or "simulation".
  // This is because we're essentially already inside of another Meteor.call()
  // block (in this case, the one for Rocket.Chat's slashCommand function). To
  // work around it, we just push an event onto the event loop by calling
  // setTimeout(func, 0).
  //
  // If RocketChat ever migrates to Meteor > 1.3, we can probably avoid this
  // Meteor.call() all together because we can use the @learnersguild/game-cli
  // module client-side. One can dream ...
  setTimeout(function () {
    logger.log(`'/${command}' invoked with '${commandParamStr}'`)
    Meteor.call('parseLGCommandStr', command, commandParamStr, (err, args) => {
      if (err) {
        logger.warn('unable to parse command string -- probably an invalid option; not running client-side command function')
        return
      }
      const commandFunc = commandFuncs[command]
      if (commandFunc) {
        commandFunc(args)
      }
    })
  }, 0)
}

Meteor.startup(function () {
  // HOWTO add tab bar buttons on RHS
  //
  // RocketChat.TabBar.addButton({
  //   groups: ['channel', 'privategroup', 'directmessage'],
  //   id: 'fly-in',
  //   title: 'Fly-in',
  //   icon: 'icon-rocket',
  //   template: 'flexPanelIframe',
  //   order: 11
  // })
  Meteor.call('getLGCommandsConfig', (err, commandsConfig) => {
    if (err) {
      throw new Error(err)
    }
    Object.keys(commandsConfig).forEach(command => {
      const commandConfig = commandsConfig[command]
      const {description, params} = commandConfig
      RocketChat.slashCommands.add(command, invoke, {description, params})
    })
  })

  Tracker.autorun(() => {
    if (Meteor.userId()) {
      Meteor.call('subscribeToLGUserNotifications')

      // render responses from /slash commands
      RocketChat.Notifications.onUser('lg-slash-command-response', msg => {
        ChatMessage.upsert({_id: msg._id}, msg)
      })
    } else {
      Meteor.call('unsubscribeFromLGUserNotifications')
    }
  })
})
