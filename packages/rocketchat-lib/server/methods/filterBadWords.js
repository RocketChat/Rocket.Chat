
var Filter = Npm.require('bad-words');
    
    RocketChat.callbacks.add( 'beforeSaveMessage' , function(message){
        // console.log(message)
        
        if( RocketChat.settings.get('Message_AllowBadWordsFilter') )
            {
                
                var badWordsList = RocketChat.settings.get('Message_BadWordsFilterList');
                    // console.log(badWordsList)
                    //Add words to the blacklist
                    if(!!badWordsList && badWordsList.length)
                        {   
                            // console.log(badWordsList)
                            var filter = new Filter({ list: badWordsList.split(',') });
                        }
                    else
                        var filter = new Filter();
                message.msg = filter.clean(message.msg);
                
            }
    return message;
    
    },1);
