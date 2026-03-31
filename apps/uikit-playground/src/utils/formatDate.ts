import moment from "moment";

export const formatDate = (date: string, type='ll') => {
    return moment(date).format(type);
}