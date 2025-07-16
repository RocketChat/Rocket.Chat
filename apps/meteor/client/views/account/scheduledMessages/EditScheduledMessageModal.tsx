import {
    Box,
    Field,
    FieldGroup,
    FieldLabel,
    FieldRow,
    FieldError,
    TextInput,
    TextAreaInput,
    Icon,
} from '@rocket.chat/fuselage';
import { useTranslation, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect, useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { GenericModal } from '@rocket.chat/ui-client';
import moment from 'moment';

const getDefaultDateTime = (currentDateTime) => {
    const date = moment(currentDateTime);
    return {
        date: date.format('YYYY-MM-DD'),
        time: date.format('HH:mm')
    };
};

const combineDateTimeForBackend = (date, time) => {
    return new Date(`${date}T${time}:00`).toISOString();
};

const EditScheduledMessageModal = ({ 
    message, 
    onSuccess,
    onClose,
    updateScheduledMessage,
}) => {
    const t = useTranslation();
    const dispatchToastMessage = useToastMessageDispatch();

    const messageFieldId = useId();
    const dateFieldId = useId();
    const timeFieldId = useId();
    const messageFieldErrorId = useId();
    const dateFieldErrorId = useId();
    const timeFieldErrorId = useId();

    const { date: defaultDate, time: defaultTime } = getDefaultDateTime(message.scheduledAt);

    const {
        handleSubmit,
        setFocus,
        control,
        formState: { errors, isSubmitting, isValid },
        watch,
    } = useForm({
        mode: 'onChange', // Changed from 'onBlur' to 'onChange' for real-time validation
        defaultValues: {
            msg: message.msg || '',
            date: defaultDate,
            time: defaultTime,
        },
    });

    // Watch the message field for changes
    const messageContent = watch('msg');

    useEffect(() => {
        setFocus('msg');
    }, [setFocus]);

    const onSubmit = async ({ msg, date, time }) => {
        try {
            await updateScheduledMessage({
                scheduledMessageId: message._id,
                rid: message.rid,
                msg: msg.trim(),
                scheduledAt: combineDateTimeForBackend(date, time),
                tmid: message.tmid
            });

            dispatchToastMessage({ 
                type: 'success', 
                message: t('Scheduled_message_updated_successfully') 
            });
            onSuccess();
            onClose();
        } catch (error) {
            dispatchToastMessage({
                type: 'error',
                message: error.message || t('Failed_to_update_scheduled_message'),
            });
        }
    };

    return (
        <GenericModal
            variant="warning"
            icon={<Icon name="pencil" size="x20" />}
            confirmText={t('Save')}
            onCancel={onClose}
            onConfirm={handleSubmit(onSubmit)}
            confirmDisabled={!isValid || isSubmitting} // Disable if not valid or submitting
            title={t('Edit_Scheduled_Message')}
        >
            <FieldGroup mbs={16}>
                <Field>
                    <FieldLabel htmlFor={messageFieldId}>{t('Message')}*</FieldLabel>
                    <FieldRow>
                        <Controller
                            control={control}
                            name="msg"
                            rules={{
                                required: t('Field_required'),
                                validate: {
                                    notEmpty: (value) => 
                                        value.trim().length > 0 || t('Message_cannot_be_empty'),
                                    notOnlyWhitespace: (value) => 
                                        value.trim().length > 0 || t('Message_cannot_be_only_whitespace')
                                }
                            }}
                            render={({ field }) => (
                                <TextAreaInput
                                    id={messageFieldId}
                                    aria-describedby={errors.msg ? messageFieldErrorId : undefined}
                                    placeholder={t('Enter_your_message')}
                                    rows={4}
                                    error={errors.msg?.message}
                                    {...field}
                                />
                            )}
                        />
                    </FieldRow>
                    {errors.msg && (
                        <FieldError id={messageFieldErrorId}>{errors.msg.message}</FieldError>
                    )}
                </Field>

                
                <Field>
                    <FieldLabel htmlFor={dateFieldId}>{t('Schedule_Date')}</FieldLabel>
                    <FieldRow>
                        <Controller
                            control={control}
                            name="date"
                            rules={{
                                required: t('Field_required'),
                            }}
                            render={({ field }) => (
                                <TextInput
                                    type="date"
                                    id={dateFieldId}
                                    aria-describedby={errors.date ? dateFieldErrorId : undefined}
                                    min={moment().format('YYYY-MM-DD')}
                                    {...field}
                                />
                            )}
                        />
                    </FieldRow>
                    {errors.date && (
                        <FieldError id={dateFieldErrorId}>{errors.date.message}</FieldError>
                    )}
                </Field>

                <Field>
                    <FieldLabel htmlFor={timeFieldId}>{t('Schedule_Time')}</FieldLabel>
                    <FieldRow>
                        <Controller
                            control={control}
                            name="time"
                            rules={{
                                required: t('Field_required'),
                            }}
                            render={({ field }) => (
                                <TextInput
                                    type="time"
                                    id={timeFieldId}
                                    aria-describedby={errors.time ? timeFieldErrorId : undefined}
                                    {...field}
                                />
                            )}
                        />
                    </FieldRow>
                    {errors.time && (
                        <FieldError id={timeFieldErrorId}>{errors.time.message}</FieldError>
                    )}
                </Field>
            </FieldGroup>
        </GenericModal>
    );
};

export default EditScheduledMessageModal;