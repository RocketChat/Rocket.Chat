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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L2l1c2VyL3BhY2thZ2VzL2FwcHMtZW5naW5lL2Rlbm8tcnVudGltZS9saWIvcm9vbUZhY3RvcnkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBJUm9vbSB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL3Jvb21zL0lSb29tLnRzJztcbmltcG9ydCB0eXBlIHsgQXBwTWFuYWdlciB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9zZXJ2ZXIvQXBwTWFuYWdlci50cyc7XG5cbmltcG9ydCB7IEFwcEFjY2Vzc29ycyB9IGZyb20gJy4vYWNjZXNzb3JzL21vZC50cyc7XG5pbXBvcnQgeyBSb29tIH0gZnJvbSAnLi9yb29tLnRzJztcbmltcG9ydCB7IGZvcm1hdEVycm9yUmVzcG9uc2UgfSBmcm9tICcuL2FjY2Vzc29ycy9mb3JtYXRSZXNwb25zZUVycm9ySGFuZGxlci50cyc7XG5cbmNvbnN0IGdldE1vY2tBcHBNYW5hZ2VyID0gKHNlbmRlckZuOiBBcHBBY2Nlc3NvcnNbJ3NlbmRlckZuJ10pID0+ICh7XG5cdGdldEJyaWRnZXM6ICgpID0+ICh7XG5cdFx0Z2V0SW50ZXJuYWxCcmlkZ2U6ICgpID0+ICh7XG5cdFx0XHRkb0dldFVzZXJuYW1lc09mUm9vbUJ5SWQ6IChyb29tSWQ6IHN0cmluZykgPT4ge1xuXHRcdFx0XHRyZXR1cm4gc2VuZGVyRm4oe1xuXHRcdFx0XHRcdG1ldGhvZDogJ2JyaWRnZXM6Z2V0SW50ZXJuYWxCcmlkZ2U6ZG9HZXRVc2VybmFtZXNPZlJvb21CeUlkJyxcblx0XHRcdFx0XHRwYXJhbXM6IFtyb29tSWRdLFxuXHRcdFx0XHR9KVxuXHRcdFx0XHRcdC50aGVuKChyZXN1bHQpID0+IHJlc3VsdC5yZXN1bHQpXG5cdFx0XHRcdFx0LmNhdGNoKChlcnIpID0+IHtcblx0XHRcdFx0XHRcdHRocm93IGZvcm1hdEVycm9yUmVzcG9uc2UoZXJyKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdH0sXG5cdFx0fSksXG5cdH0pLFxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZVJvb20ocm9vbTogSVJvb20sIHNlbmRlckZuOiBBcHBBY2Nlc3NvcnNbJ3NlbmRlckZuJ10pIHtcblx0Y29uc3QgbW9ja0FwcE1hbmFnZXIgPSBnZXRNb2NrQXBwTWFuYWdlcihzZW5kZXJGbik7XG5cblx0cmV0dXJuIG5ldyBSb29tKHJvb20sIG1vY2tBcHBNYW5hZ2VyIGFzIHVua25vd24gYXMgQXBwTWFuYWdlcik7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBSUEsU0FBUyxJQUFJLFFBQVEsWUFBWTtBQUNqQyxTQUFTLG1CQUFtQixRQUFRLDRDQUE0QztBQUVoRixNQUFNLG9CQUFvQixDQUFDLFdBQXVDLENBQUM7SUFDbEUsWUFBWSxJQUFNLENBQUM7UUFDbEIsbUJBQW1CLElBQU0sQ0FBQztZQUN6QiwwQkFBMEIsQ0FBQztjQUMxQixPQUFPLFNBQVM7Z0JBQ2YsUUFBUTtnQkFDUixRQUFRO2tCQUFDO2lCQUFPO2NBQ2pCLEdBQ0UsSUFBSSxDQUFDLENBQUMsU0FBVyxPQUFPLE1BQU0sRUFDOUIsS0FBSyxDQUFDLENBQUM7Z0JBQ1AsTUFBTSxvQkFBb0I7Y0FDM0I7WUFDRjtVQUNELENBQUM7TUFDRixDQUFDO0VBQ0YsQ0FBQztBQUVELGVBQWUsU0FBUyxXQUFXLElBQVcsRUFBRSxRQUFrQztFQUNqRixNQUFNLGlCQUFpQixrQkFBa0I7RUFFekMsT0FBTyxJQUFJLEtBQUssTUFBTTtBQUN2QiJ9