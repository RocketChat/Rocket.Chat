// useLiveLocationStopListener.ts
import { useCallback, useEffect } from 'react';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { LiveLocationService } from './liveLocationService';

export const useLiveLocationStopListener = () => {
  const updateMessage = useEndpoint('POST', '/v1/chat.update');

  const stopLiveLocationSharing = useCallback(async (
    rid?: string,
    messageId?: string,
    currentPosition?: GeolocationPosition
  ) => {
    // Get stored data if not provided
    const { messageId: storedMessageId, roomId: storedRoomId } = LiveLocationService.getLiveLocationData();
    
    const finalMessageId = messageId || storedMessageId;
    const finalRoomId = rid || storedRoomId;
    
    if (!finalMessageId || !finalRoomId) {
      console.warn('No active live location sharing found');
      return false;
    }

    try {
      // Stop the sharing service if available globally
      if ((window as any).liveLocationService) {
        (window as any).liveLocationService.stopSharing();
      }

      // Update the message to remove live status if we have current position
      if (currentPosition) {
        const service = new LiveLocationService({
          locationIQKey: 'pk.898e468814facdcffda869b42260a2f0', // TODO: move to config
          updateInterval: 10000,
          minMoveMeters: 5
        });
        
        const finalAttachment = service.createLocationAttachment(currentPosition, false);
        finalAttachment.title = '📍 Location (Sharing Stopped)';
        
        const updatePayload = {
          roomId: finalRoomId,
          msgId: finalMessageId,
          text: '',
          attachments: [finalAttachment],
          customFields: {},
        };

        await updateMessage(updatePayload);
      }

      // Clean up stored data
      LiveLocationService.clearLiveLocationData();
      
      return true;
    } catch (error) {
      console.error('Error stopping live location:', error);
      return false;
    }
  }, [updateMessage]);

  const handleStopCommand = useCallback(async (rid: string) => {
    const { messageId, roomId } = LiveLocationService.getLiveLocationData();
    
    if (!messageId || roomId !== rid) {
      console.warn('No active live location sharing found for this room');
      return false;
    }

    return await stopLiveLocationSharing(rid, messageId);
  }, [stopLiveLocationSharing]);

  // Set up global stop function
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).stopLiveLocationSharing = stopLiveLocationSharing;
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).stopLiveLocationSharing;
      }
    };
  }, [stopLiveLocationSharing]);

  return {
    stopLiveLocationSharing,
    handleStopCommand
  };
};

// Slash command processor
export const processLiveLocationSlashCommand = (
  message: string, 
  rid: string, 
  handleStopCommand: (rid: string) => Promise<boolean>
): boolean => {
  if (message === '/stop-live-location') {
    handleStopCommand(rid);
    return true; // Prevent the message from being sent to chat
  }
  
  return false; // Let other processors handle it
};

// Button action handler
export const handleLiveLocationAction = (
  action: any, 
  message: any, 
  handleStopCommand: (rid: string) => Promise<boolean>
): boolean => {
  if (action.msg === '/stop-live-location') {
    handleStopCommand(message.rid);
    return true;
  }
  
  return false; // Let other handlers process it
};