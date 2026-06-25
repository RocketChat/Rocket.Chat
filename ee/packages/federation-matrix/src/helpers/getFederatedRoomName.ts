// Derives a valid Rocket.Chat room name (slug) from a Matrix room id.
// Matrix room ids look like `!opaqueId:server.domain`; we strip the leading `!`
// sigil and turn the `:` separator into `_`, producing a deterministic, unique,
// slug-valid name. Matrix rooms may have no name (or a name with characters RC
// rejects), so the room id is the only always-present, addressable identifier.
export const getFederatedRoomName = (matrixRoomId: string): string => matrixRoomId.replace('!', '').replace(':', '_');
