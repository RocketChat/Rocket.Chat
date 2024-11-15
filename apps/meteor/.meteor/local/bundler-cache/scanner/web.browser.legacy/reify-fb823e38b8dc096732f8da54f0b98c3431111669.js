module.export({useVoipTransferModal:function(){return useVoipTransferModal}},true);var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var useSetModal,useToastMessageDispatch;module.link('@rocket.chat/ui-contexts',{useSetModal:function(v){useSetModal=v},useToastMessageDispatch:function(v){useToastMessageDispatch=v}},1);var useMutation;module.link('@tanstack/react-query',{useMutation:function(v){useMutation=v}},2);var useCallback,useEffect;module.link('react',{useCallback:function(v){useCallback=v},useEffect:function(v){useEffect=v}},3);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},4);var VoipTransferModal;module.link('../components/VoipTransferModal',{default:function(v){VoipTransferModal=v}},5);var useVoipAPI;module.link('./useVoipAPI',{useVoipAPI:function(v){useVoipAPI=v}},6);var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};







const useVoipTransferModal = ({ session }) => {
    const { t } = useTranslation();
    const setModal = useSetModal();
    const dispatchToastMessage = useToastMessageDispatch();
    const { transferCall } = useVoipAPI();
    const close = useCallback(() => setModal(null), [setModal]);
    useEffect(() => () => close(), [close]);
    const handleTransfer = useMutation({
        mutationFn: (_a) => __awaiter(void 0, [_a], void 0, function* ({ extension, name }) {
            yield transferCall(extension);
            return name || extension;
        }),
        onSuccess: (name) => {
            dispatchToastMessage({ type: 'success', message: t('Call_transfered_to__name__', { name }) });
            close();
        },
        onError: () => {
            dispatchToastMessage({ type: 'error', message: t('Failed_to_transfer_call') });
            close();
        },
    });
    const startTransfer = useCallback(() => {
        setModal(_jsx(VoipTransferModal, { extension: session.contact.id, isLoading: handleTransfer.isLoading, onCancel: () => setModal(null), onConfirm: handleTransfer.mutate }));
    }, [handleTransfer.isLoading, handleTransfer.mutate, session, setModal]);
    return { startTransfer, cancelTransfer: close };
};
//# sourceMappingURL=useVoipTransferModal.js.map