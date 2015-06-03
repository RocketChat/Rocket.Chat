
### Setting up Rocket.Chat for hubot-rocketchat adapter development

Note the current implementation by no means complete, just the bare skeleton so all contributors can hacking. 

#### Manual configuration  (or lack of it for now)

On your Rocket.Chat server, create a new user named hubot@hubot.com, and set password to hubot - choose your own avatar.  (you can change the username or password in the src/meteorchat.coffee file)

Logon as another user, create a new channel and add hubot as a user.  While in that channel, look at your browser's URL - note the random alpha at the end, that is the room-id of the channel.  Cut the roomid and paste it into _roomid of src/meteorchat.coffee.

#### Install hubot and link adapter

In this hubot-rocketchat  directory:

```
npm install
```

Install a hubot instance by following [these instructions](https://hubot.github.com/docs/)


Configure the adapter development environment by following [these instructions](https://hubot.github.com/docs/adapters/development/).  Link it, but don't run the bot just yet.

Now check the relative path in the first line in src/meteorchat.coffee and make sure you are pointing to the source directory of hubot.

Make sure you have a REDIS instance running locally. See [these instructions](http://redis.io/topics/quickstart)

Finally, run your bot:
```
hubot -a rocketchat 

```

#### What is hubot-meteorchat ?
It is the hubot integration project for Meteor based chats and real-time messaging systems. The driver based architecture simplifies creation and cusotmization of adapter for new  systems.  For example, the hubot-rocketchat integration is just hubot-meteorchat + rocketchat driver.

Learn more about hubot-meteorchat and other available drivers [at this link](https://github.com/Sing-Li/hubot-meteorchat).


