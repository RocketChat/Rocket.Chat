var ipfsAPI = require('ipfs-api')
var ipfs = ipfsAPI({host: 'localhost', port: '5001', protocol: 'http'})



Meteor.methods({
    getIPFS() 
    {
        console.log(HTTP.call('GET','http://localhost:5001/api/v0/files/stat?arg=/rc2'));
    },
    ipfsmkdir()
    {
        console.log("creating Dir");
        ipfs.files.mkdir('/rc2', (err) => {
            if (err) {
                console.error(err)
                return err;
            }
            else
            {
                console.log("done");
            }
        })
    },
    ipfsdirStat()
    {
        var rst = HTTP.call('GET','http://localhost:5001/api/v0/files/stat?arg=/rc2');
        console.log(rst);
        return rst.content;
    },
    getFile(hash)
    {
        var rst = HTTP.call('GET','http://localhost:5001/api/v0/cat?arg='+hash);
        return rst.content;
    },
    async addtoIPFS(file, filename)
    {
        console.log("adding");
        console.log(new Buffer("stringToUse"));
        console.log(ipfs.files.write('/rc2/'+filename,[new Buffer(file)],{ create : true }, (err) => { // Upload buffer to IPFS
            console.log(err);
        }));
    },
    getlistfromIPFS(dirHash)
    {
        console.log('http://localhost:5001/api/v0/ls?arg='+dirHash+'&headers=false&resolve-type=true');
        var rst = HTTP.call('GET','http://localhost:5001/api/v0/ls?arg='+dirHash+'&headers=false&resolve-type=true')
        console.log(rst.content);
        return rst.content;
    }
});  



