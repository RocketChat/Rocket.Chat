"use strict";(self.webpackChunk_rocket_chat_meteor=self.webpackChunk_rocket_chat_meteor||[]).push([[463],{"./.storybook/mocks/empty.ts":function(){},"../../packages/ui-voip/dist/index.js":function(__unused_webpack_module,__webpack_exports__,__webpack_require__){__webpack_require__.d(__webpack_exports__,{qR:function(){return useVoipAPI_useVoipAPI},DQ:function(){return useVoipDialer_useVoipDialer},Xg:function(){return useVoipState_useVoipState}});var jsx_runtime=__webpack_require__("./node_modules/react/jsx-runtime.js"),react=(__webpack_require__("../../node_modules/@rocket.chat/fuselage-hooks/dist/index.module.js"),__webpack_require__("../../packages/ui-contexts/dist/index.js"),__webpack_require__("./node_modules/react/index.js"));__webpack_require__("./node_modules/react-dom/index.js"),__webpack_require__("../../node_modules/react-i18next/dist/es/index.js");const VoipContext_VoipContext=(0,react.createContext)({isEnabled:!1,voipClient:null}),NOOP=(..._args)=>{},useVoipAPI_useVoipAPI=()=>{const context=(0,react.useContext)(VoipContext_VoipContext);return(0,react.useMemo)((()=>{if(!(context=>context.isEnabled&&null!==context.voipClient)(context))return{makeCall:NOOP,endCall:NOOP,register:NOOP,unregister:NOOP,openDialer:NOOP,closeDialer:NOOP,transferCall:NOOP,changeAudioInputDevice:NOOP,changeAudioOutputDevice:NOOP};const{voipClient:voipClient,changeAudioInputDevice:changeAudioInputDevice,changeAudioOutputDevice:changeAudioOutputDevice}=context;return{makeCall:voipClient.call,endCall:voipClient.endCall,register:voipClient.register,unregister:voipClient.unregister,transferCall:voipClient.transfer,openDialer:()=>voipClient.notifyDialer({open:!0}),closeDialer:()=>voipClient.notifyDialer({open:!1}),changeAudioInputDevice:changeAudioInputDevice,changeAudioOutputDevice:changeAudioOutputDevice}}),[context])};var shim=__webpack_require__("../../node_modules/use-sync-external-store/shim/index.js");const useVoipDialer_useVoipDialer=()=>{const{openDialer:openDialer,closeDialer:closeDialer}=useVoipAPI_useVoipAPI(),{open:open}=((eventName,initialValue)=>{const{voipClient:voipClient}=(0,react.useContext)(VoipContext_VoipContext),initValue=(0,react.useRef)(initialValue),[subscribe,getSnapshot]=(0,react.useMemo)((()=>{let state=initValue.current;return[cb=>voipClient?voipClient.on(eventName,(event=>{state=event,cb()})):()=>{},()=>state]}),[eventName,voipClient]);return(0,shim.useSyncExternalStore)(subscribe,getSnapshot)})("dialer",{open:!1});return{open:open,openDialer:openDialer||(()=>{}),closeDialer:closeDialer||(()=>{})}};var fuselage=__webpack_require__("../../node_modules/@rocket.chat/fuselage/index.js"),dist_index_module=__webpack_require__("../../node_modules/@rocket.chat/css-in-js/dist/index.module.js");dist_index_module.css`
	width: 52px;
	height: 40px;
	min-width: 52px;
	padding: 4px;

	> .rcx-button--content {
		display: flex;
		flex-direction: column;
	}
`;dist_index_module.css`
	padding-block: 6px;
	min-height: 28px;
	height: 28px;
`;dist_index_module.css`
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	padding: 8px 8px 12px;

	> button {
		margin: 4px;
	}
`;__webpack_require__("../../packages/ui-avatar/dist/index.js");var ui_client_dist=__webpack_require__("../../packages/ui-client/dist/index.js");var VoipSettingsButton_rest=function(s,e){var t={};for(var p in s)Object.prototype.hasOwnProperty.call(s,p)&&e.indexOf(p)<0&&(t[p]=s[p]);if(null!=s&&"function"==typeof Object.getOwnPropertySymbols){var i=0;for(p=Object.getOwnPropertySymbols(s);i<p.length;i++)e.indexOf(p[i])<0&&Object.prototype.propertyIsEnumerable.call(s,p[i])&&(t[p[i]]=s[p[i]])}return t};(0,react.forwardRef)((function CustomizeButton(_a,ref){var{mini:mini}=_a,props=VoipSettingsButton_rest(_a,["mini"]);const size=mini?24:32;return(0,jsx_runtime.jsx)(fuselage.IconButton,Object.assign({},props,{ref:ref,icon:"customize",mini:!0,width:size,height:size}))}));var esm=__webpack_require__("../../node_modules/@rocket.chat/styled/dist/esm/index.js"),VoipPopupContainer_rest=function(s,e){var t={};for(var p in s)Object.prototype.hasOwnProperty.call(s,p)&&e.indexOf(p)<0&&(t[p]=s[p]);if(null!=s&&"function"==typeof Object.getOwnPropertySymbols){var i=0;for(p=Object.getOwnPropertySymbols(s);i<p.length;i++)e.indexOf(p[i])<0&&Object.prototype.propertyIsEnumerable.call(s,p[i])&&(t[p[i]]=s[p[i]])}return t};(0,esm.A)("article",(_a=>{var{secondary:_secondary,position:_position}=_a;return VoipPopupContainer_rest(_a,["secondary","position"])}))`
	position: fixed;
	top: ${p=>{var _a;return void 0!==(null===(_a=p.position)||void 0===_a?void 0:_a.top)?`${p.position.top}px`:"initial"}};
	right: ${p=>{var _a;return void 0!==(null===(_a=p.position)||void 0===_a?void 0:_a.right)?`${p.position.right}px`:"initial"}};
	bottom: ${p=>{var _a;return void 0!==(null===(_a=p.position)||void 0===_a?void 0:_a.bottom)?`${p.position.bottom}px`:"initial"}};
	left: ${p=>{var _a;return void 0!==(null===(_a=p.position)||void 0===_a?void 0:_a.left)?`${p.position.left}px`:"initial"}};
	display: flex;
	flex-direction: column;
	width: 250px;
	min-height: 128px;
	border-radius: 4px;
	border: 1px solid ${fuselage.Palette.stroke["stroke-dark"].toString()};
	box-shadow: 0px 0px 1px 0px ${fuselage.Palette.shadow["shadow-elevation-2x"].toString()},
		0px 0px 12px 0px ${fuselage.Palette.shadow["shadow-elevation-2y"].toString()};
	background-color: ${p=>p.secondary?fuselage.Palette.surface["surface-neutral"].toString():fuselage.Palette.surface["surface-light"].toString()};
	z-index: 100;
`;(0,react.memo)((({children:children})=>(0,jsx_runtime.jsx)(ui_client_dist.mV,{id:"voip-root",children:children})));var emitter_dist_index_module=__webpack_require__("../../node_modules/@rocket.chat/emitter/dist/index.module.js");__webpack_require__("./.storybook/mocks/empty.ts");emitter_dist_index_module.v;const DEFAULT_STATE={isRegistered:!1,isReady:!1,isInCall:!1,isOnline:!1,isIncoming:!1,isOngoing:!1,isOutgoing:!1,isError:!1},useVoipState_useVoipState=()=>{const{isEnabled:isEnabled,error:clientError}=(0,react.useContext)(VoipContext_VoipContext),callState=((transform,initialValue)=>{const{voipClient:voipClient}=(0,react.useContext)(VoipContext_VoipContext),initValue=(0,react.useRef)(initialValue),transformFn=(0,react.useRef)(transform),[subscribe,getSnapshot]=(0,react.useMemo)((()=>{let state=initValue.current;return[cb=>voipClient?(state=transformFn.current(voipClient),voipClient.on("stateChanged",(()=>{state=transformFn.current(voipClient),cb()}))):()=>{},()=>state]}),[voipClient]);return(0,shim.useSyncExternalStore)(subscribe,getSnapshot)})((client=>client.getState()),DEFAULT_STATE);return(0,react.useMemo)((()=>Object.assign(Object.assign({},callState),{clientError:clientError,isEnabled:isEnabled,isError:!!clientError||callState.isError})),[clientError,isEnabled,callState])}}}]);
//# sourceMappingURL=463.c3d7849b.iframe.bundle.js.map