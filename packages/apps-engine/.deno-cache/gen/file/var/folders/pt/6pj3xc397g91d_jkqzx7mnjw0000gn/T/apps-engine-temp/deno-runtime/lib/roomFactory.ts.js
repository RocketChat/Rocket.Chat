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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vdmFyL2ZvbGRlcnMvcHQvNnBqM3hjMzk3ZzkxZF9qa3F6eDdtbmp3MDAwMGduL1QvYXBwcy1lbmdpbmUtdGVtcC9kZW5vLXJ1bnRpbWUvbGliL3Jvb21GYWN0b3J5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgSVJvb20gfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9yb29tcy9JUm9vbS50cyc7XG5pbXBvcnQgdHlwZSB7IEFwcE1hbmFnZXIgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvc2VydmVyL0FwcE1hbmFnZXIudHMnO1xuXG5pbXBvcnQgeyBBcHBBY2Nlc3NvcnMgfSBmcm9tICcuL2FjY2Vzc29ycy9tb2QudHMnO1xuaW1wb3J0IHsgUm9vbSB9IGZyb20gJy4vcm9vbS50cyc7XG5pbXBvcnQgeyBmb3JtYXRFcnJvclJlc3BvbnNlIH0gZnJvbSAnLi9hY2Nlc3NvcnMvZm9ybWF0UmVzcG9uc2VFcnJvckhhbmRsZXIudHMnO1xuXG5jb25zdCBnZXRNb2NrQXBwTWFuYWdlciA9IChzZW5kZXJGbjogQXBwQWNjZXNzb3JzWydzZW5kZXJGbiddKSA9PiAoe1xuXHRnZXRCcmlkZ2VzOiAoKSA9PiAoe1xuXHRcdGdldEludGVybmFsQnJpZGdlOiAoKSA9PiAoe1xuXHRcdFx0ZG9HZXRVc2VybmFtZXNPZlJvb21CeUlkOiAocm9vbUlkOiBzdHJpbmcpID0+IHtcblx0XHRcdFx0cmV0dXJuIHNlbmRlckZuKHtcblx0XHRcdFx0XHRtZXRob2Q6ICdicmlkZ2VzOmdldEludGVybmFsQnJpZGdlOmRvR2V0VXNlcm5hbWVzT2ZSb29tQnlJZCcsXG5cdFx0XHRcdFx0cGFyYW1zOiBbcm9vbUlkXSxcblx0XHRcdFx0fSlcblx0XHRcdFx0XHQudGhlbigocmVzdWx0KSA9PiByZXN1bHQucmVzdWx0KVxuXHRcdFx0XHRcdC5jYXRjaCgoZXJyKSA9PiB7XG5cdFx0XHRcdFx0XHR0aHJvdyBmb3JtYXRFcnJvclJlc3BvbnNlKGVycik7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHR9LFxuXHRcdH0pLFxuXHR9KSxcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVSb29tKHJvb206IElSb29tLCBzZW5kZXJGbjogQXBwQWNjZXNzb3JzWydzZW5kZXJGbiddKSB7XG5cdGNvbnN0IG1vY2tBcHBNYW5hZ2VyID0gZ2V0TW9ja0FwcE1hbmFnZXIoc2VuZGVyRm4pO1xuXG5cdHJldHVybiBuZXcgUm9vbShyb29tLCBtb2NrQXBwTWFuYWdlciBhcyB1bmtub3duIGFzIEFwcE1hbmFnZXIpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUlBLFNBQVMsSUFBSSxRQUFRLFlBQVk7QUFDakMsU0FBUyxtQkFBbUIsUUFBUSw0Q0FBNEM7QUFFaEYsTUFBTSxvQkFBb0IsQ0FBQyxXQUF1QyxDQUFDO0lBQ2xFLFlBQVksSUFBTSxDQUFDO1FBQ2xCLG1CQUFtQixJQUFNLENBQUM7WUFDekIsMEJBQTBCLENBQUM7Y0FDMUIsT0FBTyxTQUFTO2dCQUNmLFFBQVE7Z0JBQ1IsUUFBUTtrQkFBQztpQkFBTztjQUNqQixHQUNFLElBQUksQ0FBQyxDQUFDLFNBQVcsT0FBTyxNQUFNLEVBQzlCLEtBQUssQ0FBQyxDQUFDO2dCQUNQLE1BQU0sb0JBQW9CO2NBQzNCO1lBQ0Y7VUFDRCxDQUFDO01BQ0YsQ0FBQztFQUNGLENBQUM7QUFFRCxlQUFlLFNBQVMsV0FBVyxJQUFXLEVBQUUsUUFBa0M7RUFDakYsTUFBTSxpQkFBaUIsa0JBQWtCO0VBRXpDLE9BQU8sSUFBSSxLQUFLLE1BQU07QUFDdkIifQ==
// denoCacheMetadata=6526716306930521246,12349931851991985025