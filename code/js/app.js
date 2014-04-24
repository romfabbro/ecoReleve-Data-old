var ecoReleveData = (function(app) {
"use strict";
// Creating the application namespace
app = {
	config: {
	// Find pathname portion of the URL and clean it (remove trailing slash if any)
	root: window.location.pathname.replace(/\/(?:index.html)?$/, '')
	},
	dao: {},
	models: {},
	views: {},
	utils: {},
	collections :{},
	roles: {
		admin: 'admin',
		superuser: 'superuser',
		user: 'user'
		},
	instances: {}
};
// ----------------------------------------------- The Application initialisation ------------------------------------------ //
$().ready(function() {
  init();
}) ;

function init(){
	 // Spinner management (visual feedback for ongoing requests)
	$(document).ajaxStart(function () { $('body').addClass('loading'); });
	$(document).ajaxStop(function () { $('body').removeClass('loading'); });
   window.deferreds = [];
    // Customize Underscore templates behaviour: 'with' statement is prohibited in JS strict mode
     _.templateSettings.variable = 'data';


  	app.instances.mainNav = new app.views.Navigation({model: app.router});
   // Bread crumbs
	app.instances.breadCrumbs = new app.views.BreadCrumbs({model: app.router});
	// Current user
	app.instances.userView = new app.views.CurrentUser();
	app.instances.userView.$el.appendTo('.navbar .navbar-inner');
			
  $.when.apply(null, deferreds).done(function() {
	app.instances.mainNav.render();
	app.instances.mainNav.$el.appendTo('#main-nav');
	app.instances.breadCrumbs.$el.insertBefore('#static-menu');
	app.instances.breadCrumbs.render();
	app.instances.userView.render();
    Backbone.history.start();
    window.mapAjaxCall = false;
  	window.mapAjaxCall.xhr = false;
	// Main navigation
	//localStorage.setItem("serverUrl", "http://ns24422.ovh.net/ecoReleve-core");
	//localStorage.setItem("serverUrl", "http://192.168.1.199/ecoReleve-core");
	localStorage.setItem("serverUrl", "http://192.168.1.199/ECWP_ecoReleve-core");
	// load mapping scripts
	   /* app.utils.importScript('js/libs/OpenLayers.debug.js');
	       setTimeout(function() {
            app.utils.importScript('js/libs/openlayersBbox.js');
            app.utils.importScript('js/libs/AnimatedCluster.js');
            app.utils.importScript('js/libs/NS-UI-map.js');
        }, 2000);*/

  	// get users list if not exists
  	app.collections.users = new app.collections.Users();
  	// get fieldActivity
	app.collections.users.fetch().then(function () {
		if (app.collections.users.length === 0){
			app.utils.getUsersListForStrorage("/user/fieldworkers");
		}
	});
	// get field activity list
	app.collections.fieldActivityList = new app.collections.FieldActivities();
	app.collections.fieldActivityList.fetch().then(function () {
		if (app.collections.fieldActivityList.length === 0){
			app.utils.getFieldActivityListForStrorage("/view/theme/list?import=yes");
		}
	});
	// get station list
	app.collections.stations = new app.collections.Stations();
	app.collections.stations.fetch().then(function() {
		console.log("stations loaded ! ");
	});
	// load stored protocols
	app.collections.protocolsList = new app.collections.Protocols();
	app.collections.protocolsList.fetch().then(function(){
		if (app.collections.protocolsList.length === 0){
			app.utils.loadProtocols("ressources/XML_ProtocolDef_eReleve.xml");
		}
	});
	// load observations
	app.collections.observations = new app.collections.Observations();
			app.collections.observations.fetch().then(function() {
				console.log("observations loaded ! ");
			});

  });
}

return app;
})(ecoReleveData);