# learnersguild:rocketchat-lg-api-extensions

Custom API extensions for Rocket.Chat within Learners Guild.

**NOTE:** This package will likely not be useful for anyone outside of [Learners Guild][learnersguild].

## Testing the API from the command line

For testing the API from the command line we recommend using [HTTPie][HTTPie]. It's like curl but better.

### Logging in to get auth tokens

Each API command requires an auth token header. To get this token hit the login API like this:

```
$ http -pb --form POST echo.learnersguild.dev/api/login user=echo password=chat
{
    "data": {
        "authToken": "qqHLQR-pM9XQlLxAyUeKN01kjdZaYX6cOUrytwaBf-t",
        "userId": "HQ2frnK9Trrc8yM92"
    },
    "status": "success"
}
```

The correct password for the `echo` user will be in the `CHAT_API_USER_SECRET` environemnt variable in game.

### Hitting the API

Once you know your `authToken` and `userId` you can plug them into the headers for other command. For instance, so send a message to a channel, do this:

```
$ http -pb POST echo.learnersguild.dev/api/lg/rooms/foobar/send X-User-Id:${userId} X-Auth-Token:${authToken} msg="this is the message"
{
    "result": {
        "_id": "YPfcNoqobrkvYHjMf",
        "msg": "this is the message",
        "rid": "QEbJtWEZjPWp3BkAS",
        "ts": "2016-06-22T12:41:32.206Z",
        "u": {
            "_id": "HQ2frnK9Trrc8yM92",
            "username": "echo"
        }
    },
    "status": "success"
}
```

Note that the `authToken` expires after a few minutes, and you'll have to hit the login api again to get another one.

## License

See the [LICENSE](./LICENSE) file.


[IDM]: https://github.com/LearnersGuild/idm
[Rocket.Chat]: https://github.com/LearnersGuild/Rocket.Chat
[learnersguild]: https://www.learnersguild.org/
[HTTPie]: https://github.com/jkbrzt/httpie
