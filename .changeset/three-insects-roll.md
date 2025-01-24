---
"@rocket.chat/meteor": patch
---

Fixes a missconception about `/v1/livechat/tags/:tagId` 

the type definition doesnt consider null/empty results
```
'/v1/livechat/tags/:tagId': {
		GET: () => ILivechatTag;
	};
```

the code returns `ILivechatTag | { body: null }` which is weird/wrong.

now if we cannot find the tag returns a 404 result
