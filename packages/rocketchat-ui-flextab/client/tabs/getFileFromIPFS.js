import cp from 'crypto-js';
import download from 'downloadjs';

Template.getFileFromIPFS.helpers({
    files()
    {
        return  [{"name":"1ipfs-p2p-file-system.pdf","Hash":"QmTHW2zP1yE1wum4Vnouk26Qx6BKsS4LxagD4Q4fAsfToX"},{"name":"IPFS-what-is-it-1024x512-09-29-2016.jpg","Hash":"QmeiZ3KpzLabNZxuAiG1195qkoBDpZNpnkbqoADsiXCM9p"},{"name":"ROUTE_MAP_Trivandrum_.pdf","Hash":"QmRKxHfYE2zd5UnguMQfErHhVNZFHmG6tgu6Uzzsgy5a5q"},{"name":"a.txt","Hash":"QmVSRJRY79Jou62cjZmAqkhuQGL43vLpvZbzMUCQyCYoSJ"},{"name":"b1","Hash":"QmbtGcTjhAVkUovFdRPHhu6rH5G1WREJWVvNzqBSnewt3K"},{"name":"cropped-brave_icon_512x.jpeg","Hash":"QmYJv92RSxpWvJejYYy71Eecz897dBWGxBsnnuacPLU6Zk"},{"name":"ctest","Hash":"QmRnk6PHijDVJYREd3Ksz7HXHX2mVAJfwAJmufPFR6Kmzv"},{"name":"ctest1","Hash":"QmV6t5QXqcHkkYZTJAAcF7c2GH1xSGNhmEqMvqNrhxL2ft"},{"name":"ctest2","Hash":"QmXdY3Uq4DrUScfnvMAeZ6VVuVS5Zg4vX32hibpFK9tecu"},{"name":"file (1).jpeg","Hash":"Qme7JbBuxnC1up1qW13u2zQmG1qimaNrYgg3ao8MJEtHee"},{"name":"file (6).pdf","Hash":"QmeDH8GkhUwQFPkM4y9tFJ5Vnyo3ejcvdKxLvcELMnXt6s"},{"name":"file.txt","Hash":"QmaWTT21LMBn3HuZzFfj4GGDqhUwvTjgisQijTTU19pDyB"},{"name":"hello (1).jpeg","Hash":"Qme7JbBuxnC1up1qW13u2zQmG1qimaNrYgg3ao8MJEtHee"},{"name":"hello.txt","Hash":"QmaWTT21LMBn3HuZzFfj4GGDqhUwvTjgisQijTTU19pDyB"},{"name":"images.jpeg","Hash":"Qmc81pjARktwFvcL4sU42SvMbUreNjYj6fVX2fKMJ9yXsZ"},{"name":"img","Hash":"Qme7JbBuxnC1up1qW13u2zQmG1qimaNrYgg3ao8MJEtHee"},{"name":"ipfs-p2p-file-system.pdf","Hash":"QmTHW2zP1yE1wum4Vnouk26Qx6BKsS4LxagD4Q4fAsfToX"},{"name":"m1","Hash":"QmaTShbdcJw8Aw7teuTsjGFoMPACQ7EpfJ4mDwxRTCiDnr"},{"name":"mm","Hash":"QmVSRJRY79Jou62cjZmAqkhuQGL43vLpvZbzMUCQyCYoSJ"},{"name":"nitesh.txt","Hash":"QmVSRJRY79Jou62cjZmAqkhuQGL43vLpvZbzMUCQyCYoSJ"},{"name":"nitesh1.txt","Hash":"QmVSRJRY79Jou62cjZmAqkhuQGL43vLpvZbzMUCQyCYoSJ"},{"name":"s","Hash":"QmbYKTRNqqWD97eCzpwJtinwuBAaDABZ3n2zojgTBpnSxk"},{"name":"sam.jpeg","Hash":"QmRS8Nks1xNnNw6ZHtx1szNTPCQoG468CpkhkYeSXBgbwL"},{"name":"testPDf.pdf","Hash":"Qmcpnj1mnCARPkV2nx8jWYbqaSugumFTMbsNXcwWAfMa71"},{"name":"undefined","Hash":"QmaeyTyYZ1ve891JBg85uA4faeQx3bwUrjWhLDZXfCCCNe"},{"name":"w","Hash":"QmVSRJRY79Jou62cjZmAqkhuQGL43vLpvZbzMUCQyCYoSJ"}]
        let data = [];
        let nit;
        Meteor.call('ipfsdirStat', (error, result) => {
            let details = JSON.parse(result);
            Meteor.call('getlistfromIPFS', details.Hash,(err, rst) => {
                let test = JSON.parse(rst);
                console.log(test);
                for(var i=1;i<test.Objects["0"].Links.length;i++)
                {
                    data.push({name:test.Objects["0"].Links[i].Name, Hash:test.Objects["0"].Links[i].Hash});
                }
                console.log(JSON.stringify(data)); 
                nit = JSON.stringify(data)
                return nit;
            });
        });        
    }
});

Template.getFileFromIPFS.events({
	'click .js-add'() {
        const fileHash = document.getElementById("js-ipfsHash").value;
        const key = document.getElementById("IPFSSeed").value;
        console.log(fileHash);
        console.log('http://localhost:5001/api/v0/cat?arg='+fileHash)
        Meteor.call('getFile', fileHash, (error, result) => {
            if(result)
            {

                console.log(key);
                var end = (result.toString(cp.enc.Utf8)).indexOf(';')
                var fileType =  (result.toString(cp.enc.Utf8)).substring(5,end);
                console.log(fileType);
                if(fileType == "image/jpeg")
                {
                    console.log("Loading")  
                    var image = new Image();
                    image.src = result.toString(cp.enc.Utf8);
                    var w = window.open("");
                    w.document.write(image.outerHTML);
                }
                else if((fileType == "application/pdf") || (fileType == "text/plain"))
                {
                    if(fileType == "application/pdf")
                    {
                        ft = "file.pdf";
                    }
                    else
                    {
                        ft = "file.txt";
                    }
                    var ext;
                    download(result.toString(cp.enc.Utf8), ft, fileType)
                    .then(function(file){
                        console.log(file);
                    })
                }
                else{
                    console.log("fail");
                }
            }
            else if((fileType == "application/pdf") || (fileType == "text/plain"))
            {
                var ext;
                download(getRst.toString(cp.enc.Utf8), "file.pdf", fileType)
                .then(function(file){
                    console.log(file);
                })
            }
            else{
                console.log("fail");
            }
        });
    },
});

