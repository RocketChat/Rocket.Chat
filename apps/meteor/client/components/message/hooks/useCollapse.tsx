import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useAttachmentIsCollapsedByDefault } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import  {useState,useEffect}  from 'react'

import CollapsibleContent from '../content/collapsible/CollapsibleContent';

const usePersistedCollapse= (attachmentId : string | undefined , initialCollapsed: boolean)=>{
      const  [collapsed,setCollapsed] = useState(()=>{
		 if(attachmentId){
               const stored=    sessionStorage.getItem(`persistant-attachment-${attachmentId}`)
			   if(stored != null){
				   return stored == 'true'

			   }
			}

             return initialCollapsed 

	  })

	  const  toogleCollapsed=  ()=>{
		setCollapsed((prev)=>{
		    const  value = !prev
			if(attachmentId){
				sessionStorage.setItem(`persistant-attachment-${attachmentId}`,value ? 'true' : 'false')
			}
			 return value 
	       })

		}
		
		// Sync with state 
		
		useEffect(() => {
			if (attachmentId) {
				const stored = sessionStorage.getItem(`persistant-attachment-${attachmentId}`);
				if (stored !== null) {
					setCollapsed(stored === 'true');
				}
			}
		}, [attachmentId]);
		
		return [collapsed,toogleCollapsed] as const

}



export const useCollapse = (attachmentId : string | undefined,attachmentCollapsed?: boolean): [collapsed: boolean, node: ReactNode] => {
	
	 console.log('reset state')
	const collapseByDefault = useAttachmentIsCollapsedByDefault() 
	const initialCollapsed = collapseByDefault || attachmentCollapsed 
	const [collapsed, toogleCollapsed] = usePersistedCollapse(attachmentId,initialCollapsed) ||useToggle(initialCollapsed);
	return [collapsed, <CollapsibleContent collapsed={collapsed} onClick={toogleCollapsed as any} key='collapsible-content-action' />];
};
