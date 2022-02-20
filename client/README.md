# How does the folder structure work in the frontend?


## The folder structure should follow rocketchat's html 'semantics' like:
```
    main   -> room
                -> header
                    ...
                -> contextualbar
                    roominfo
                        ...
            -> sidebar
                -> Header
                    -> search
                    -> actions
                        ...
                -> list
                    ...
                -> footer
                    ...
```
Each folder is composed by:
| File ||
| -- | -- |
| index.jsx               |   |
| ContainerComponent.jsx  |
| contexts                |  (optional)  |
| providers               |  (optional)  |
| components              |  (optional)  |
| hooks                   |  (optional)  |
| libs                    |  (optional)  |

We strongly suggest that you start developing your components/hooks/libs inside the folder where they will be directly used. If you ever find that you will use them in more than one place, then you should "promote" the code to an upper level, where it can be commonly accessed by all others


we have being moving code from blaze to react, but sometimes we will need render under blaze enviroment, to do that use `createTemplateForComponent`