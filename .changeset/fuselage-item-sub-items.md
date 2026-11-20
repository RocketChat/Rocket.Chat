---
'@rocket.chat/fuselage': minor
---

Adds sub-items to `Item`:

- `ItemDisclosure` is the chevron button that leads a parent row and shows or hides its sub-list.
- An `ItemGroup` placed in a row's list item becomes that row's sub-list and indents one level per depth, up to 4. Rows without a disclosure in a group that has some keep its column, so their media stay aligned.
- `ItemGroup` accepts `density='compact' | 'extended'`, which sets the indent steps for rows led by a 20px or a 36px avatar, and `guide`, which draws a line from the parent's disclosure down its sub-items. Nested groups inherit the density.
