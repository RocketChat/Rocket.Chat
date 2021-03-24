import React from 'react';
import RawText from '../../../../../../../components/RawText';

const styles = {
    cursor: "pointer",
    margin: "10px",
}
export default React.memo(function UserSummaryMessage({
    _updatedAt, 
    msg, 
    repliesCount, 
    tcount, 
    threadMsg, 
    ts, 
    dateReactions, 
    reactions, 
    goToMess, 
    message, 
    fname, 
    roles, 
    editedAt, 
    description, 
    sysMes, 
    ...props 
    }) {
    //should be optimized
        if(description) {
            return <li className="msgSummary_sideBar" onClick={() => goToMess(message)} key={String(ts)} style={styles}>̣<RawText>{`${String(ts).substring(0,25)}: You changed the room description: \'${description}\'`}</RawText></li>
        }
        else if(fname && !sysMes) {
            return !roles ? <li className="msgSummary_sideBar" onClick={() => goToMess(message)} key={String(ts)} style={styles}>̣<RawText>{`${String(ts).substring(0,25)}: You has been added to the room`}</RawText></li> :
            <li className="msgSummary_sideBar" onClick={() => goToMess(message)} key={String(ts)} style={styles}>̣<RawText>{`${String(ts).substring(0,25)}: You created the channel`}</RawText></li>
        }
        else if(repliesCount && !sysMes) {
            return <li className="msgSummary_sideBar" onClick={() => goToMess(message)} key={String(ts)} style={styles}>̣<RawText>{`${String(ts).substring(0,25)}: You answered: \'${msg}\' in the thread \'${threadMsg}\'` + `${editedAt ? ' (edited)' : ''}`}</RawText></li>
        }
        else if(threadMsg && !sysMes) {
            return <li className="msgSummary_sideBar" onClick={() => goToMess(message)} key={String(ts)} style={styles}>̣<RawText>{`${String(ts).substring(0,25)}: You sent the message: \'${msg}\' to the thread: \'${threadMsg}\' ` + `${editedAt ? ' (edited)' : ''}`}</RawText></li>
        }
         else if (tcount && !sysMes) {
            return <li className="msgSummary_sideBar" onClick={() => goToMess(message)} key={String(ts)} style={styles}>̣<RawText>{`${String(ts).substring(0,25)}: You created the thread: \'${msg}\' ` + `${editedAt ? ' (edited)' : ''}`}</RawText></li>
        
        } else if(msg && !sysMes) {
            return <li className="msgSummary_sideBar" onClick={() => goToMess(message)} key={String(ts)} style={styles}>̣<RawText>{`${String(ts).substring(0,25)}: You sent the message: \'${msg}\' ` + `${editedAt ? ' (edited)' : ''}`}</RawText></li>
        
        } else if(dateReactions && reactions) {

            //
        } else {

            return 
        }
})