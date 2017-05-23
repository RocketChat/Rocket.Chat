/*
 $.fn.formToJSON = function() {
 var form = this;
 var json = {};

 this.find('[name]').each(function () {
 if($(this).attr('type') === 'radio') {
 json[this.name] = form.find('input[name=' + this.name + ']:checked').val();
 } else if($(this).attr('type') === 'checkbox') {
 json[this.name] = $(this).prop('checked');
 } else {
 json[this.name] = $(this).val();
 }
 });
 return json;
 };

 $.fn.fillWithJSON = function(json) {
 this.find('[name]').each(function () {
 $(this).val(json[this.name]);
 });
 }

 */
