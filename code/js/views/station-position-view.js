﻿var ecoReleveData = (function(app) {
    "use strict";
app.Views.StationPositionView = Backbone.View.extend({
	templateLoader: app.utils.templateLoader,
	//el : $('#content'),
        initialize : function() {
           this.template = _.template($('#sation-position-template').html());
			//this.template = _.template(this.templateLoader.get('sation-position'));
        },

        render : function() {
            var renderedContent = this.template();
            $(this.el).html(renderedContent);
          //  return this;
		     $(this.el).hide();
        },
		close: function(){
			this.remove();
			this.unbind();
		},
		 
		onShow: function(){
			$(this.el).show(500);
		},

});

 return app;
})(ecoReleveData);