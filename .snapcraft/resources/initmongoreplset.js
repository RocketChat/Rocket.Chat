var ism = db.isMaster();
printjson(ism);
if (ism.ismaster) {
   } else 
{
    var msg  = rs.initiate();
    printjson(msg);
}
