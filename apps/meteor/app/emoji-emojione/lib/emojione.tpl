/* stylelint-disable */

.emojione-<%= options.category %> {
  background-image: url('<%= options.spritePath %>');
<%
layout.images.forEach(function (image) {
  if(options.diversityList[image.className]){
    return;
  }
%>
  &._<%= image.className %> {
    background-repeat: no-repeat;
    background-size: <%= (layout.width / image.width * 100) %>% <%= (layout.height / image.height * 100) %>%;
    background-position: <%= (image.x * 100 / (layout.width - image.width )) %>% <%= (image.y * 100 / (layout.height - image.height)) %>%;
  }
<% }); %>
}
<%
layout.images.forEach(function (image) {
  if(!options.diversityList[image.className]){
    return;
  }
%>

.emojione-diversity._<%= image.className %> {
  background-image: url('<%= options.spritePath %>');
  background-repeat: no-repeat;
  background-size: <%= (layout.width / image.width * 100) %>% <%= (layout.height / image.height * 100) %>%;
  background-position: <%= (image.x * 100 / (layout.width - image.width )) %>% <%= (image.y * 100 / (layout.height - image.height)) %>%;
}<% }); %>
