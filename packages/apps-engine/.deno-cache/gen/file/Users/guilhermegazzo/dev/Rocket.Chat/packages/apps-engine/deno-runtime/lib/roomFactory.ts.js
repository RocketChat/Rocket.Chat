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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L1JvY2tldC5DaGF0L3BhY2thZ2VzL2FwcHMtZW5naW5lL2Rlbm8tcnVudGltZS9saWIvcm9vbUZhY3RvcnkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBJUm9vbSB9IGZyb20gXCJAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9yb29tcy9JUm9vbS50c1wiO1xuaW1wb3J0IHR5cGUgeyBBcHBNYW5hZ2VyIH0gZnJvbSBcIkByb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9zZXJ2ZXIvQXBwTWFuYWdlci50c1wiO1xuXG5pbXBvcnQgeyBBcHBBY2Nlc3NvcnMgfSBmcm9tIFwiLi9hY2Nlc3NvcnMvbW9kLnRzXCI7XG5pbXBvcnQgeyBSb29tIH0gZnJvbSBcIi4vcm9vbS50c1wiO1xuaW1wb3J0IHsgSnNvblJwY0Vycm9yIH0gZnJvbSBcImpzb25ycGMtbGl0ZVwiO1xuXG5jb25zdCBnZXRNb2NrQXBwTWFuYWdlciA9IChzZW5kZXJGbjogQXBwQWNjZXNzb3JzWydzZW5kZXJGbiddKSA9PiAoe1xuICAgIGdldEJyaWRnZXM6ICgpID0+ICh7XG4gICAgICAgIGdldEludGVybmFsQnJpZGdlOiAoKSA9PiAoe1xuICAgICAgICAgICAgZG9HZXRVc2VybmFtZXNPZlJvb21CeUlkOiAocm9vbUlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VuZGVyRm4oe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdicmlkZ2VzOmdldEludGVybmFsQnJpZGdlOmRvR2V0VXNlcm5hbWVzT2ZSb29tQnlJZCcsXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtczogW3Jvb21JZF0sXG4gICAgICAgICAgICAgICAgfSkudGhlbigocmVzdWx0KSA9PiByZXN1bHQucmVzdWx0KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBKc29uUnBjRXJyb3IoYEVycm9yIGdldHRpbmcgdXNlcm5hbWVzIG9mIHJvb206ICR7ZXJyfWAsIC0zMjAwMCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgIH0pLFxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZVJvb20ocm9vbTogSVJvb20sIHNlbmRlckZuOiBBcHBBY2Nlc3NvcnNbJ3NlbmRlckZuJ10pIHtcbiAgICBjb25zdCBtb2NrQXBwTWFuYWdlciA9IGdldE1vY2tBcHBNYW5hZ2VyKHNlbmRlckZuKTtcblxuICAgIHJldHVybiBuZXcgUm9vbShyb29tLCBtb2NrQXBwTWFuYWdlciBhcyB1bmtub3duIGFzIEFwcE1hbmFnZXIpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUlBLFNBQVMsSUFBSSxRQUFRLFlBQVk7QUFDakMsU0FBUyxZQUFZLFFBQVEsZUFBZTtBQUU1QyxNQUFNLG9CQUFvQixDQUFDLFdBQXVDLENBQUM7SUFDL0QsWUFBWSxJQUFNLENBQUM7UUFDZixtQkFBbUIsSUFBTSxDQUFDO1lBQ3RCLDBCQUEwQixDQUFDO2NBQ3ZCLE9BQU8sU0FBUztnQkFDWixRQUFRO2dCQUNSLFFBQVE7a0JBQUM7aUJBQU87Y0FDcEIsR0FBRyxJQUFJLENBQUMsQ0FBQyxTQUFXLE9BQU8sTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN0QyxNQUFNLElBQUksYUFBYSxDQUFDLGlDQUFpQyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUM7Y0FDdkU7WUFDSjtVQUNKLENBQUM7TUFDTCxDQUFDO0VBQ0wsQ0FBQztBQUVELGVBQWUsU0FBUyxXQUFXLElBQVcsRUFBRSxRQUFrQztFQUM5RSxNQUFNLGlCQUFpQixrQkFBa0I7RUFFekMsT0FBTyxJQUFJLEtBQUssTUFBTTtBQUMxQiJ9