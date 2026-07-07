// Derives a valid Rocket.Chat room name (slug) from a Matrix room id.
// Matrix room ids look like `!opaqueId:server.domain`; we strip the leading `!`
// sigil and replace every char RC rejects in a slug (including the `:` separator,
// which may also appear in a server port) with `_`, producing a deterministic,
// slug-valid name. Matrix rooms may have no name (or a name with characters RC
// rejects), so the room id is the only always-present, addressable identifier.
export const getFederatedRoomName = (matrixRoomId: string): string => matrixRoomId.replace(/^!/, '').replace(/[^0-9a-zA-Z-_.]/g, '_');
