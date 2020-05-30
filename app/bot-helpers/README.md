# Rocket.chat bot helpers

This package provides some extra shortcut Meteor methods intended to help Hubot scripts.

## Approach

This was an experiment in how to extend Hubot and Rocket.chat integration.

Keeping controller logic out of Hubot scripts made sense to me, but its not necessarily the best approach.

For bots to use these methods they obviously need this package added to Rocket.chat as well as the [rocketchat adapter](https://github.com/RocketChat/hubot-rocketchat).

## Usage

In Hubot scripts, call bot helper methods using Meteor.call with the first argument as the helper type, then the method name as second argument.

At present, there's only one type of helper (`botRequest`) for simple getters, more utility methods may be added in future.

e.g. Below uses `onlineNames` method, which returns array of names of online users (not including bots).

Listens for *"who is online"* and replies with something like *"Robert, Desmond and Billie are currently online"*.

```
# Use Bot Helpers class to check who's online
robot.hear /who is online/i, (res) ->
  promise = robot.adapter.callMethod('botRequest', 'onlineNames')
  promise.then (result) ->
    if result.length > 0
      names = result.join(', ').replace(/,(?=[^,]*$)/, ' and ') # convert last comma to 'and'
      res.send "#{ names } #{ if result.length == 1 then 'is' else 'are' } currently online"
    else
      res.send "Nobody is currently online... \*cricket sound\*"
    return
  , (error) ->
    res.send "Uh, sorry I don't know, something's not working"
    return
```

Method names that include fields like `allUsernames` return an 1D array of just that property.

First two methods return 2D array with properties defined in a defaults object (currently id, name, username, status, emails).

- `allUsers`
- `onlineUsers`
- `allUsernames`
- `onlineUsernames`
- `allNames`
- `onlineNames`
- `allIDs`
- `onlineIDs`

## Tests

None yet, PR adding tests would be much apreciated.
