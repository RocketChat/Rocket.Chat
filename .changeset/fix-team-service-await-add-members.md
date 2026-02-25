---
'@rocket.chat/meteor': patch
---

Fixes fire-and-forget async `.map()` in `TeamService.addMembersToDefaultRooms` where promises were never awaited, causing silent failures when adding users to default team rooms. Also replaces unnecessary `for await` over a plain array with `for...of`.
