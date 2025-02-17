import { Room } from "./room.ts";
import { JsonRpcError } from "jsonrpc-lite";
const getMockAppManager = (senderFn)=>({
    getBridges: ()=>({
        getInternalBridge: ()=>({
            doGetUsernamesOfRoomById: (roomId)=>{
              return senderFn({
                method: 'bridges:getInternalBridge:doGetUsernamesOfRoomById',
                params: [
                  roomId
                ]
              }).then((result)=>result.result).catch((err)=>{
                throw new JsonRpcError(`Error getting usernames of room: ${err}`, -32000);
              });
            }
          })
      })
  });
export default function createRoom(room, senderFn) {
  const mockAppManager = getMockAppManager(senderFn);
  return new Room(room, mockAppManager);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvYWJoaW5hdi9yb2NrZXQuY2hhdC9Sb2NrZXQuQ2hhdC9wYWNrYWdlcy9hcHBzLWVuZ2luZS9kZW5vLXJ1bnRpbWUvbGliL3Jvb21GYWN0b3J5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgSVJvb20gfSBmcm9tIFwiQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vcm9vbXMvSVJvb20udHNcIjtcbmltcG9ydCB0eXBlIHsgQXBwTWFuYWdlciB9IGZyb20gXCJAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvc2VydmVyL0FwcE1hbmFnZXIudHNcIjtcblxuaW1wb3J0IHsgQXBwQWNjZXNzb3JzIH0gZnJvbSBcIi4vYWNjZXNzb3JzL21vZC50c1wiO1xuaW1wb3J0IHsgUm9vbSB9IGZyb20gXCIuL3Jvb20udHNcIjtcbmltcG9ydCB7IEpzb25ScGNFcnJvciB9IGZyb20gXCJqc29ucnBjLWxpdGVcIjtcblxuY29uc3QgZ2V0TW9ja0FwcE1hbmFnZXIgPSAoc2VuZGVyRm46IEFwcEFjY2Vzc29yc1snc2VuZGVyRm4nXSkgPT4gKHtcbiAgICBnZXRCcmlkZ2VzOiAoKSA9PiAoe1xuICAgICAgICBnZXRJbnRlcm5hbEJyaWRnZTogKCkgPT4gKHtcbiAgICAgICAgICAgIGRvR2V0VXNlcm5hbWVzT2ZSb29tQnlJZDogKHJvb21JZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbmRlckZuKHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnYnJpZGdlczpnZXRJbnRlcm5hbEJyaWRnZTpkb0dldFVzZXJuYW1lc09mUm9vbUJ5SWQnLFxuICAgICAgICAgICAgICAgICAgICBwYXJhbXM6IFtyb29tSWRdLFxuICAgICAgICAgICAgICAgIH0pLnRoZW4oKHJlc3VsdCkgPT4gcmVzdWx0LnJlc3VsdCkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgSnNvblJwY0Vycm9yKGBFcnJvciBnZXR0aW5nIHVzZXJuYW1lcyBvZiByb29tOiAke2Vycn1gLCAtMzIwMDApO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICB9KSxcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVSb29tKHJvb206IElSb29tLCBzZW5kZXJGbjogQXBwQWNjZXNzb3JzWydzZW5kZXJGbiddKSB7XG4gICAgY29uc3QgbW9ja0FwcE1hbmFnZXIgPSBnZXRNb2NrQXBwTWFuYWdlcihzZW5kZXJGbik7XG5cbiAgICByZXR1cm4gbmV3IFJvb20ocm9vbSwgbW9ja0FwcE1hbmFnZXIgYXMgdW5rbm93biBhcyBBcHBNYW5hZ2VyKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFJQSxTQUFTLElBQUksUUFBUSxZQUFZO0FBQ2pDLFNBQVMsWUFBWSxRQUFRLGVBQWU7QUFFNUMsTUFBTSxvQkFBb0IsQ0FBQyxXQUF1QyxDQUFDO0lBQy9ELFlBQVksSUFBTSxDQUFDO1FBQ2YsbUJBQW1CLElBQU0sQ0FBQztZQUN0QiwwQkFBMEIsQ0FBQztjQUN2QixPQUFPLFNBQVM7Z0JBQ1osUUFBUTtnQkFDUixRQUFRO2tCQUFDO2lCQUFPO2NBQ3BCLEdBQUcsSUFBSSxDQUFDLENBQUMsU0FBVyxPQUFPLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdEMsTUFBTSxJQUFJLGFBQWEsQ0FBQyxpQ0FBaUMsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO2NBQ3ZFO1lBQ0o7VUFDSixDQUFDO01BQ0wsQ0FBQztFQUNMLENBQUM7QUFFRCxlQUFlLFNBQVMsV0FBVyxJQUFXLEVBQUUsUUFBa0M7RUFDOUUsTUFBTSxpQkFBaUIsa0JBQWtCO0VBRXpDLE9BQU8sSUFBSSxLQUFLLE1BQU07QUFDMUIifQ==