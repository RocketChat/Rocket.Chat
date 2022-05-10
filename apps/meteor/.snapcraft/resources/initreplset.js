var ism = db.isMaster();  
if (!ism.ismaster) {
    rs.initiate(
        { 
            _id: 'rs0', 
            members: [ 
                { 
                    _id: 0, 
                    host: 'localhost:27017' 
                } 
            ]
        }); 
}
