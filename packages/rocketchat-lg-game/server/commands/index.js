/* global lastSlashCommandRoomIds:true, commandFuncs, tokenizeCommandString, notifyUser, formatUsage, formatError, logger  */
/* exported lastSlashCommandRoomIds */

const commands = Npm.require('@learnersguild/game-cli')

lastSlashCommandRoomIds = {}
function invoke(command, commandParamStr, commandInfo) {
  logger.log(`'/${command}' invoked with '${commandParamStr}'`)
  notifyUser(commandInfo.rid, `> /${command} ${commandParamStr}`)
  const commandFunc = commandFuncs[command].invoke
  if (commandFunc) {
    const {lgJWT, lgUser} = Meteor.user().services.lgSSO
    const notify = Meteor.bindEnvironment(msg => {
      notifyUser(commandInfo.rid, msg)
    })
    try {
      const argv = tokenizeCommandString(commandParamStr)
      commandFunc(argv, notify, {lgJWT, lgUser, formatUsage, formatError, maxWidth: 80, commandPrefix: '/'})
    } catch (err) {
      notifyUser(commandInfo.rid, formatError(err.message || err))
    }
  }
  lastSlashCommandRoomIds[Meteor.userId()] = commandInfo.rid
}

Meteor.methods({
  getLGCommandsConfig() {
    const commandsConfig = {}
    Object.keys(commands).forEach(cmdName => {
      let {
        commandDescriptor: {name, description, usage: usageMessage},
        parse,
        usage,
        invoke,
      } = commands[cmdName]
      description = description || name
      usageMessage = usageMessage || name
      const params = usageMessage.replace(`${name} `, '')
      commandsConfig[name] = {description, params}
      commandFuncs[name] = {parse, usage, invoke}
    })
    return commandsConfig
  },

  parseLGCommandStr(command, commandParamStr) {
    try {
      const argv = tokenizeCommandString(commandParamStr)
      const args = commandFuncs[command].parse(argv)
      return args
    } catch (err) {
      throw new Meteor.Error(err.message)
    }
  },
})

/* eslint-disable prefer-arrow-callback */
Meteor.startup(function () {
  const commandsConfig = Meteor.call('getLGCommandsConfig')
  Object.keys(commandsConfig).forEach(command => {
    const commandConfig = commandsConfig[command]
    const {description, params} = commandConfig
    RocketChat.slashCommands.add(command, invoke, {description, params})
  })
})
