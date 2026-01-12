import { Room } from './room.ts';
import { formatErrorResponse } from './accessors/formatResponseErrorHandler.ts';
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
                throw formatErrorResponse(err);
              });
            }
          })
      })
  });
export default function createRoom(room, senderFn) {
  const mockAppManager = getMockAppManager(senderFn);
  return new Room(room, mockAppManager);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9idWlsZGVyL21lZHNlbnNlLndlYmNoYXQvcGFja2FnZXMvYXBwcy1lbmdpbmUvZGVuby1ydW50aW1lL2xpYi9yb29tRmFjdG9yeS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IElSb29tIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vcm9vbXMvSVJvb20udHMnO1xyXG5pbXBvcnQgdHlwZSB7IEFwcE1hbmFnZXIgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvc2VydmVyL0FwcE1hbmFnZXIudHMnO1xyXG5cclxuaW1wb3J0IHsgQXBwQWNjZXNzb3JzIH0gZnJvbSAnLi9hY2Nlc3NvcnMvbW9kLnRzJztcclxuaW1wb3J0IHsgUm9vbSB9IGZyb20gJy4vcm9vbS50cyc7XHJcbmltcG9ydCB7IGZvcm1hdEVycm9yUmVzcG9uc2UgfSBmcm9tICcuL2FjY2Vzc29ycy9mb3JtYXRSZXNwb25zZUVycm9ySGFuZGxlci50cyc7XHJcblxyXG5jb25zdCBnZXRNb2NrQXBwTWFuYWdlciA9IChzZW5kZXJGbjogQXBwQWNjZXNzb3JzWydzZW5kZXJGbiddKSA9PiAoe1xyXG5cdGdldEJyaWRnZXM6ICgpID0+ICh7XHJcblx0XHRnZXRJbnRlcm5hbEJyaWRnZTogKCkgPT4gKHtcclxuXHRcdFx0ZG9HZXRVc2VybmFtZXNPZlJvb21CeUlkOiAocm9vbUlkOiBzdHJpbmcpID0+IHtcclxuXHRcdFx0XHRyZXR1cm4gc2VuZGVyRm4oe1xyXG5cdFx0XHRcdFx0bWV0aG9kOiAnYnJpZGdlczpnZXRJbnRlcm5hbEJyaWRnZTpkb0dldFVzZXJuYW1lc09mUm9vbUJ5SWQnLFxyXG5cdFx0XHRcdFx0cGFyYW1zOiBbcm9vbUlkXSxcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0LnRoZW4oKHJlc3VsdCkgPT4gcmVzdWx0LnJlc3VsdClcclxuXHRcdFx0XHRcdC5jYXRjaCgoZXJyKSA9PiB7XHJcblx0XHRcdFx0XHRcdHRocm93IGZvcm1hdEVycm9yUmVzcG9uc2UoZXJyKTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHR9LFxyXG5cdFx0fSksXHJcblx0fSksXHJcbn0pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlUm9vbShyb29tOiBJUm9vbSwgc2VuZGVyRm46IEFwcEFjY2Vzc29yc1snc2VuZGVyRm4nXSkge1xyXG5cdGNvbnN0IG1vY2tBcHBNYW5hZ2VyID0gZ2V0TW9ja0FwcE1hbmFnZXIoc2VuZGVyRm4pO1xyXG5cclxuXHRyZXR1cm4gbmV3IFJvb20ocm9vbSwgbW9ja0FwcE1hbmFnZXIgYXMgdW5rbm93biBhcyBBcHBNYW5hZ2VyKTtcclxufVxyXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBSUEsU0FBUyxJQUFJLFFBQVEsWUFBWTtBQUNqQyxTQUFTLG1CQUFtQixRQUFRLDRDQUE0QztBQUVoRixNQUFNLG9CQUFvQixDQUFDLFdBQXVDLENBQUM7SUFDbEUsWUFBWSxJQUFNLENBQUM7UUFDbEIsbUJBQW1CLElBQU0sQ0FBQztZQUN6QiwwQkFBMEIsQ0FBQztjQUMxQixPQUFPLFNBQVM7Z0JBQ2YsUUFBUTtnQkFDUixRQUFRO2tCQUFDO2lCQUFPO2NBQ2pCLEdBQ0UsSUFBSSxDQUFDLENBQUMsU0FBVyxPQUFPLE1BQU0sRUFDOUIsS0FBSyxDQUFDLENBQUM7Z0JBQ1AsTUFBTSxvQkFBb0I7Y0FDM0I7WUFDRjtVQUNELENBQUM7TUFDRixDQUFDO0VBQ0YsQ0FBQztBQUVELGVBQWUsU0FBUyxXQUFXLElBQVcsRUFBRSxRQUFrQztFQUNqRixNQUFNLGlCQUFpQixrQkFBa0I7RUFFekMsT0FBTyxJQUFJLEtBQUssTUFBTTtBQUN2QiJ9
// denoCacheMetadata=16974025013887162501,3974155118768057046