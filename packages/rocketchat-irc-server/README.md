**IRC Server Federation**

Provides an IRC Network environmet with Docker for tests.

```
docker run --name ircd -p 6667:6667 -p 7000:7000 inspircd/inspircd-docker
```

Add settings for your IRC Network on central admin at Rocket.Chat instance.
