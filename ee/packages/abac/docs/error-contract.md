# ABAC error contract

The errors below are returned when a room is created, joined or written to under ABAC, or when a
room's attributes are edited or previewed. Their keys are stable: integrations can branch on them.

## Response shape

Every key in this contract comes back from the REST API as a `400` with the same shape:

```json
{
	"success": false,
	"error": "error-abac-attribute-not-assignable",
	"errorType": "error-abac-attribute-not-assignable",
	"details": { "cause": "error-invalid-attribute-values", "attributes": [{ "key": "clearance", "values": ["topsecret"] }] }
}
```

- `error` and `errorType` both hold the key.
- `details` is present only when there is something to add. It never replaces the key.
- Over DDP the same key is in the `Meteor.Error`'s `error` and `reason`.

Every key has an i18n entry of the same name, so a client can show a translated message by
translating the key.

## Keys

### Creating a room with attributes

Returned by `groups.create`, `teams.create` and every other path that creates a room through
`createRoom`.

| Key | Returned when | `details` |
|---|---|---|
| `error-abac-not-enabled` | Attributes were sent while ABAC is disabled or unlicensed | |
| `error-abac-attributes-not-allowed` | The creator lacks the `create-abac-managed-room` permission | |
| `error-abac-attributes-private-rooms-only` | Attributes were sent for a public room or a discussion | |
| `error-abac-federated-room-attributes` | Attributes were sent for a federated room | |
| `error-abac-attributes-room-conversion` | `teams.create` was converting an existing room and was sent attributes | |
| `error-abac-attributes-owner-must-be-caller` | `teams.create` was sent attributes with an `owner` other than the caller | |
| `error-abac-invalid-attributes` | The attributes are malformed or empty, an app sent attributes that are not a list of attributes, or an attribute or value is not defined in the workspace. With the Local PDP, a creator without `bypass-abac-store-validation` gets `error-abac-attribute-not-assignable` for an undefined attribute instead, so they cannot learn which attributes exist | `cause`; `key` when one attribute is at fault |
| `error-abac-attribute-not-assignable` | The creator is not entitled to assign an attribute value | `cause`; `attributes`, the values that were refused |
| `error-abac-creator-not-admitted` | The creator would not be admitted to a room with these attributes | `cause` |
| `error-abac-decision-unavailable` | The policy decision point or attribute store cannot be reached | `cause` |
| `error-abac-decision-inconclusive` | The policy decision point could not decide | `cause` |

`abac/rooms.evaluateMembership` evaluates attributes before a room is created, and returns the last
five keys. It returns `error-abac-creator-not-admitted` only when the creator joins, that is without
`excludeSelf`.

### Previewing room members

| Key | Returned when |
|---|---|
| `error-abac-preview-too-many-members` | `abac/rooms.evaluateMembership` was sent more members than `API_User_Limit` allows. The creator counts once, whether named or not, and not at all with `excludeSelf` |

### Editing a room's attributes

Returned by `abac/rooms/:rid/attributes` and by `abac/rooms.evaluateMembership` with a `rid`, to a user
editing through the room-scoped `edit-room-abac-attributes` permission. A holder of the ABAC
administration permissions is never refused with these keys.

| Key | Returned when | `details` |
|---|---|---|
| `error-abac-attribute-not-assignable` | The edit adds a value the editor does not hold, while restricting to owned attributes is on | `attributes`, the values that were refused |
| `error-abac-required-attributes-removed` | The edit removes an attribute every ABAC room requires, while enforcement is on | `keys`, the required attributes removed |
| `error-abac-room-attributes-cleared` | The edit removes every attribute while enforcement is on | |

`abac/attributes.listAssignable` and `abac/rooms.evaluateMembership` return `error-abac-not-enabled`
in this shape too. The ABAC administration endpoints, `abac/rooms/:rid/attributes` included, return
it as `error` only, and are not part of this contract.

`cause` is the underlying code, for example `error-invalid-attribute-values` or
`error-pdp-unavailable`. It is there for diagnosis; branch on the key, not on `cause`.

### Removing a room's attributes with the room

Converting a room to a team, converting a team to a channel, adding a room to a team and making a
room public remove the room's attributes. A user who holds neither the ABAC administration
permissions nor `edit-room-abac-attributes` on that room is refused before anything changes.

| Key | Returned when |
|---|---|
| `error-abac-not-authorized-to-modify-room` | The room has attributes and the user may not remove them |

### Creating a room while enforcement is on

| Key | Returned when |
|---|---|
| `error-abac-attributes-required` | The room is a private room with no attributes, or without every required attribute |
| `error-abac-public-room-creation-blocked` | The room is a public channel |
| `error-abac-discussion-creation-blocked` | The room is a discussion |

Direct messages, federated rooms and Omnichannel rooms are not refused.

### Using a locked room

| Key | Returned when |
|---|---|
| `error-abac-room-locked` | A message is sent to, or a member added to, a room that enforcement has locked: any public channel or discussion, or a private room with no attributes or without every required attribute. Federated rooms are never locked |

`/invite-all-to` and `/invite-all-from` do not return an error. They tell the caller in a message,
translated from `error-abac-room-locked` or `error-abac-decision-unavailable`, and add nobody.
