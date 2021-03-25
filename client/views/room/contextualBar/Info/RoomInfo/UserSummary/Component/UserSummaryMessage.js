import React from 'react';
import RawText from '../../../../../../../components/RawText';

const styles = {
    cursor: 'pointer',
    margin: '10px',
}

const stylesHeader = {
    margin: '15px',
    textAlign: 'center'
}

const styleSpan = {
    fontSize: '0.7rem',
    cursor: 'pointer',
    textDecoration: 'underline',
    display: 'block'
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
    nbrUnread,
    month,
    ...props 
    }) {
    //should be optimized
        if(month) {
            return <><h2 className="msgSummary_sideBar" key={String(ts)} style={stylesHeader}>̣<RawText>{`${month}`}</RawText></h2><p className="msgSummary_sideBar" style={stylesHeader}>̣<RawText>{`${nbrUnread} unread`}</RawText>{nbrUnread > 0 && <span onClick={() => goToMess(message)} style={styleSpan}> go to message</span>}</p></>
        } else if(description) {
            return <p className="msgSummary_sideBar" onClick={() => goToMess(message)} key={String(ts)} style={styles}>̣<RawText>{`${String(ts).substring(0,25)}: You changed the room description: \'${description}\'`}</RawText></p>
        }
        else if(fname && !sysMes) {
            return !roles ? <p className="msgSummary_sideBar" onClick={() => goToMess(message)} key={String(ts)} style={styles}>̣<RawText>{`${String(ts).substring(0,25)}: You has been added to the room`}</RawText></p> :
            <p className="msgSummary_sideBar" onClick={() => goToMess(message)} key={String(ts)} style={styles}>̣<RawText>{`${String(ts).substring(0,25)}: You created the channel`}</RawText></p>
        }
        else if(repliesCount && !sysMes) {
            return <p className="msgSummary_sideBar" onClick={() => goToMess(message)} key={String(ts)} style={styles}>̣<RawText>{`${String(ts).substring(0,25)}: You answered: \'${msg}\' in the thread \'${threadMsg}\'` + `${editedAt ? ' (edited)' : ''}`}</RawText></p>
        }
        else if(threadMsg && !sysMes) {
            return <p className="msgSummary_sideBar" onClick={() => goToMess(message)} key={String(ts)} style={styles}>̣<RawText>{`${String(ts).substring(0,25)}: You sent the message: \'${msg}\' to the thread: \'${threadMsg}\' ` + `${editedAt ? ' (edited)' : ''}`}</RawText></p>
        }
         else if (tcount && !sysMes) {
            return <p className="msgSummary_sideBar" onClick={() => goToMess(message)} key={String(ts)} style={styles}>̣<RawText>{`${String(ts).substring(0,25)}: You created the thread: \'${msg}\' ` + `${editedAt ? ' (edited)' : ''}`}</RawText></p>
        
        } else if(msg && !sysMes) {
            return <p className="msgSummary_sideBar" onClick={() => goToMess(message)} key={String(ts)} style={styles}>̣<RawText>{`${String(ts).substring(0,25)}: You sent the message: \'${msg}\' ` + `${editedAt ? ' (edited)' : ''}`}</RawText></p>
        
        } else if(dateReactions && reactions) {

            //
        } else {

            return 
        }
})