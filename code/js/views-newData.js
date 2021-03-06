var ecoReleveData = (function(app) {
	"use strict";

	/*****************************************************
//$input    input (new data)
******************************************************/

	app.views.StationTypeView = app.views.BaseView.extend({
		template: 'input',
		initialize: function() {},
		afterRender: function() {
			// remove backgrouyd image
			$.supersized({
				slides: [{
					image: ''
				}]
			});
		},
		events: {
			'click #station': 'getStation'
		},
		getStation: function() {
			var stationType = $('input[name=stationtype]:checked').val();
			switch (stationType) {
				case "newStation":
					app.utils.stationType = "newStation";
					
					app.router.navigate('#newStation', {
						trigger: true
					});
					
					break;
				case "importedStation":
					app.utils.stationType = "importedStation";
					app.collections.importedStations = new app.collections.Waypoints();
					app.collections.importedStations.fetch().then(function() {
						if (app.collections.importedStations.length > 0) {
							app.router.navigate('#importedStation', {
								trigger: true
							});
						} else {
							alert('there is not imported stations');
						}
					});
					break;
			}
		}
	});
	app.views.NewStation = app.views.BaseView.extend({
		template: 'inputStationDetails',
		initialize: function(options) {
			var station = new app.models.Station();
			this.formView = new app.views.StationFormView({
				initialData: station
			});
			this.formView.render();
			this.stationType = "new"; // default value
			// check if it is imported station or new station
			if (options){
				var type = options.type || null;
				if (type && type ==="imported"){
					this.stationType = "imported";
					this.importedStation = options.station ;
				}
			}
			
		},
		afterRender: function() {
			var dateImportedStation, timeImportedStation;
			$('#stationForm').append(this.formView.el);
			$(".form-actions").addClass("masqued");
			var frmView = this.formView;
			$("#inputStationAdd").on("click", $.proxy(frmView.onSubmit, frmView));
			// add datalist control for fieldActivity & users
			// get control id
			var controlId = $("[name='FieldActivity_Name']").attr("id");
			$("[name='FieldActivity_Name']").attr("list", controlId + "List");
			app.utils.addDatalistControl(controlId, app.collections.fieldActivityList);
			//users inputs needs only 1 datalist control
			var user1ControlId = $("[name='FieldWorker1']").attr("id");
			$("[name='FieldWorker1']").attr("list", user1ControlId + "List");
			app.utils.addDatalistControl(user1ControlId, app.collections.users,"idUser");
			var user2ControlId = $("[name='FieldWorker2']").attr("id");
			$("[name='FieldWorker2']").attr("list", user1ControlId + "List");
			var user3ControlId = $("[name='FieldWorker3']").attr("id");
			$("[name='FieldWorker3']").attr("list", user1ControlId + "List");
			var user4ControlId = $("[name='FieldWorker4']").attr("id");
			$("[name='FieldWorker4']").attr("list", user1ControlId + "List");
			var user5ControlId = $("[name='FieldWorker5']").attr("id");
			$("[name='FieldWorker5']").attr("list", user1ControlId + "List");
			//field date default value
			var inputDate = $('input[name="Date_"]');
			$(inputDate).datepicker();
			$(inputDate).css('clip', 'auto');
			var currentDate;
			// new station
			if (this.stationType === "new"){
				// display button 'get current coordinates' if hidden
				$("#stationGetCoordinates").removeClass("masqued");
				currentDate = new Date();
				// get time now
				app.utils.getTime('time_');
			} else {
				// imported station
				// hide button to get current coordinates
				$("#stationGetCoordinates").addClass("masqued");
				// get the stored date of imported station
				dateImportedStation = this.importedStation.get('waypointTime');
				dateImportedStation = moment( dateImportedStation);
				currentDate = dateImportedStation.format("MM/DD/YYYY");
				var time = dateImportedStation.format("HH:mm");
				// get format MM/DD/YYYY

				/*
				dateImportedStation = dateImportedStation.toString(); 
				var splitDate = dateImportedStation.split('T'); 
				var strDate = splitDate[0]; // example of value : 2013-04-28
				timeImportedStation = splitDate[1]; // example of value : 10:05:00.000Z
				// to use jquery Ui datepicker, we convet date to default format mm/dd/yyyy 
				var strDateTab = strDate.split("-"); // to get dd mm and yyyy
				currentDate = strDateTab[1]+ "/" + strDateTab[2] + "/"  + strDateTab[0]; // example :  "05/14/2014"
				// edit time valur to get the right format HH:MM
				var timeTab = timeImportedStation.split(":");
				// set value to time field 
				var timeOfImportedStation = timeTab[0] + ":" + timeTab[1];
				$("[name='time_']").val(timeOfImportedStation);
				// set stored values in imported station
				*/

				$("[name='time_']").val(time);
				$("[name='LAT']").val(this.importedStation.get("latitude"));
				$("[name='LON']").val(this.importedStation.get("longitude"));
				$("[name='Name']").val(this.importedStation.get("name"));
				$("[name='FieldActivity_Name']").val(this.importedStation.get("fieldActivity"));
				$("[name='FieldWorker1']").val(this.importedStation.get("fieldWorker1"));
				$("[name='FieldWorker2']").val(this.importedStation.get("fieldWorker2"));
				$("[name='FieldWorker3']").val(this.importedStation.get("fieldWorker3"));
				$("[name='FieldWorker4']").val(this.importedStation.get("fieldWorker4"));
				$("[name='FieldWorker5']").val(this.importedStation.get("fieldWorker5"));
			}
			// jquery UI datepicker , field date
			$(inputDate).datepicker("setDate", currentDate);
		},
		events : {
			"click #stationGetCoordinates" : "getActualPosition"
		},
		getActualPosition : function(){
			if(navigator.geolocation) {
			    var loc = navigator.geolocation.getCurrentPosition(this.myPosition,this.erreurPosition);
			} else {
			    alert("Ce navigateur ne supporte pas la géolocalisation");
			}
		},
		myPosition : function(position){
			var latitude = parseFloat(position.coords.latitude).toFixed(5);
			var longitude = parseFloat(position.coords.longitude).toFixed(5);
			$("[name='LAT']").val(latitude);
			$("[name='LON']").val(longitude);
			    //position.coords.altitude +"\n";
		},
		erreurPosition : function(error){
			var info = "Erreur lors de la géolocalisation : ";
		    switch(error.code) {
		    case error.TIMEOUT:
		    	info += "Timeout !";
		    break;
		    case error.PERMISSION_DENIED:
		    info += "Vous n’avez pas donné la permission";
		    break;
		    case error.POSITION_UNAVAILABLE:
		    	info += "La position n’a pu être déterminée";
		    break;
		    case error.UNKNOWN_ERROR:
		    info += "Erreur inconnue";
		    break;
		    }
		    alert(info);
		}
	});
	app.views.StationFormView = NS.UI.Form.extend({
		initialize: function(options) {
			//this.usersList = options.usersTab ; 
			NS.UI.Form.prototype.initialize.apply(this, arguments);
			this.on('submit:valid', function(instance) {
				//var tm = instance;
				// add date time
				var dateSt = new Date(instance.attributes.Date_);
				var dd = dateSt.getDate();
				var mm = dateSt.getMonth()+1;
				var yyyy = dateSt.getFullYear();
				var hrs = dateSt.getHours();
				var mins =dateSt.getMinutes();
				var time = instance.attributes.time_;
				// convert month and day to format mm and dd if value < 10
				if (mm < 10) {mm = "0" + mm;}
				if (dd < 10) {dd = "0" + dd;}
				var myDateTimeString = yyyy +"-"+mm+"-"+ dd +" "+ time + ":00.00";
				instance.attributes.Date_ = myDateTimeString;
				instance.attributes.date = mm + "/" + dd + "/" + yyyy	;
				// add station id
				var idLastStation = app.utils.idLastStation;
				instance.attributes.stationId = idLastStation + 1;
				// autoincrement last station id
				app.utils.idLastStation += 1;
				// store value
				localStorage.setItem("idLastStation", app.utils.idLastStation);
				// replace field workers name by id
				var fieldWorker1 = instance.attributes.FieldWorker1;
				// get users dalist id
				var user1ControlId = $("[name='FieldWorker1']").attr("id");
				var idList = "#" + user1ControlId + "List";
				// replace fieldWorker1 name by fieldworker id
				var userId;
				if (instance.attributes.FieldWorker1){
					userId = this.getUserId(idList,"FieldWorker1");
					instance.attributes.FieldWorker1 = userId;
				}
				if (instance.attributes.FieldWorker2){
					userId = this.getUserId(idList,"FieldWorker2");
					instance.attributes.FieldWorker2 = userId;
				}
				if (instance.attributes.FieldWorker3){
					userId = this.getUserId(idList,"FieldWorker3");
					instance.attributes.FieldWorker3 = userId;
				}
				if (instance.attributes.FieldWorker4){
					userId = this.getUserId(idList,"FieldWorker4");
					instance.attributes.FieldWorker4 = userId;
				}
				if (instance.attributes.FieldWorker5){
					userId = this.getUserId(idList,"FieldWorker5");
					instance.attributes.FieldWorker5 = userId;
				}
				app.collections.stations.add(instance);
				app.collections.stations.save();
				// store last station to be used later 
				app.utils.LastStation = instance;
				app.router.navigate('#proto-choice', {
					trigger: true
				});
			});
		},
		getUserId : function(idList, inputName){
            var x = $("[name='" + inputName + "']").val();
            var z = $(idList);
            var val = $(z).find('option[value="' + x + '"]').text();
            return val;
        }
	});
	//imported station
	app.views.ImportedStation = app.views.BaseView.extend({
		template: 'inputStationDetails',
		initialize: function() {
			this.selectedStation = null;
		},
		afterRender: function() {
			// load imported stations
			//app.collections.importedStations = new app.collections.Waypoints();
			//app.collections.importedStations.fetch().then(function() {
			app.utils.initGrid(app.collections.importedStations, app.collections.Waypoints);
			// hide button get coordinates in template
			$("#stationGetCoordinates").addClass("masqued");
			//});
		},
		events: {
			'click #inputStationAdd': 'nextStep',
			'click tr': 'selectTableElement'
		},
		nextStep: function() {
			if (this.selectedStation !== null) {
				
				app.router.navigate("#newStation", {
					trigger: false
				});
				
				app.router.setView(new app.views.NewStation({type:"imported", station:this.selectedStation }));

			} else {
				alert("please select a station");
			}

		},
		selectTableElement: function(e) {
			var ele = e.target.parentNode;
			var eleName = e.target.parentNode.nodeName;
			if (eleName == "TR") {
				this.selectedStation = app.models.selectedModel;
				$(eleName).css("background-color","rgba(255, 255, 255,0)");
				$(ele).css("background-color","rgb(180, 180, 180)");
			}
		}
	});
	// protcol choice
	app.views.InputProtocolChoice = app.views.BaseView.extend({
		template: 'inputProtocolChoice',
		afterRender: function() {
			var listView = document.createElement('ul');
			$(listView).addClass('unstyled');
			// tab to storage keywors (id of protocol / name)
			var keywordsTab = [];
			var protocols = app.collections.protocolsList;
			protocols.each(function(mymodel) {
				var li = '<li class="protocolViewsList" idProt=' + mymodel.get('id') + '>' + mymodel.get('name') + '</li>';
				$(listView).append(li);
				var option = {};
				option.val = mymodel.get('id');
				option.label = mymodel.get('name');
				keywordsTab.push(option);
			});
			/*
	        var listview = new app.views.ProtocolListView({collection:app.collections.protocolsList});
	        listview.render();*/
			$('.listview').append(listView);
		},
		events: {
			'click li.protocolViewsList': 'navigation',
			'click #backStation': 'backToStation'
		},
		navigation: function(e) {
			e.preventDefault();
			var idSelectedProto = $(e.target).attr("idProt");
			var route = "#data-entry/" + idSelectedProto;
			app.router.navigate(route, {
				trigger: true
			});
			/*app.global.selectedProtocolId = idSelectedProto;
	        app.global.selectedProtocolName = $(e.target).html();*/
		},
		backToStation: function() {
			if (app.utils.stationType === "newStation") {
				app.router.navigate('#newStation', {
					trigger: true
				});
			} else {
				app.router.navigate('#importedStation', {
					trigger: true
				});
			}
		}
	});
	app.views.ProtocolListView = Backbone.View.extend({
		tagName: "ul",
		className: "nav nav-pills nav-stacked",
		// Insert all subViews prior to rendering the View.
		beforeRender: function() {
			// Iterate over the passed collection and create a view for each item.
			var listView = $(this.el);
			// tab to storage keywors (id of protocol / name)
			var keywordsTab = [];
			this.collection.each(function(mymodel) {

				var li = '<li> <a id="btn" class="btnChoice" idProt=' + mymodel.get('id') + '><span  idProt=' + mymodel.get('id') + '>' + mymodel.get('name') + '</span></a></li>';
				listView.append(li);
				var option = {};
				option.val = mymodel.get('id');
				option.label = mymodel.get('name');
				keywordsTab.push(option);
			});
		},
		events: {
			'click #btn': 'navigation'
		},
		navigation: function(e) {
			e.preventDefault();
			var idSelectedProto = $(e.target).attr("idProt");
			app.global.selectedProtocolId = idSelectedProto;
			app.global.selectedProtocolName = $(e.target).html();
			var route = "#data-entry/" + idSelectedProto;
			app.router.navigate(route, {
				trigger: true
			});
			
		}
	});
	app.views.ProtocolEntry = app.views.BaseView.extend({
		template: 'inputProtocolEntry',
		initialize: function(options) {

			this.selectedProtocolId = options.id;
			var currentModel = new app.models.Observation();
			var currentProtocol = app.collections.protocolsList.get(this.selectedProtocolId);
			/* for (var prop in currentProtocol) {
				if (prop!="id" &&(prop!="cid")){
					currentModel.attributes[prop] = currentProtocol[prop];
				}	
			}*/
			currentModel.constructor.schema = {};
			for (var propr in currentProtocol.attributes.schema) {
				if (propr != "id" && (propr != "cid")) {
					currentModel.constructor.schema[propr] = currentProtocol.attributes.schema[propr];
				}
			}
			//currentModel.constructor.schema = currentProtocol.attributes.schema;
			currentModel.constructor.verboseName = currentProtocol.attributes.name;
			this.formView = new app.views.ProtocolFormView({
				initialData: currentModel
			});
			this.formView.render();
			this.currentModelName = currentProtocol.attributes.name;
		},
		afterRender: function() {

			$(".protocol").append(this.formView.el);
			// add hidden input to the form to store protocol name and id
			var inputProtocolName = "<input type='hidden'  name='protocolName'  value='" + this.currentModelName + "''>";
			var inputProtocolId = "<input type='hidden'  name='protocolId'  value=" + this.selectedProtocolId + ">";
			$("form").append(inputProtocolName);
			$("form").append(inputProtocolId);
			$(".form-actions").addClass("masqued");
			var frmView = this.formView;
			$("#inputProtocolAdd").on("click", $.proxy(frmView.onSubmit, frmView));
			// store protocol name to be used later
			app.utils.selectedProtocolName = this.currentModelName;
			// display current protocol name
			//$("#selectedProtocolName").text(this.currentModelName);
		}
	});
	app.views.ProtocolFormView = NS.UI.Form.extend({
		initialize: function(options) {
			
			this.serverUrl = app.config.serverUrl;
			//this.usersList = options.usersTab ; 
			NS.UI.Form.prototype.initialize.apply(this, arguments);
			this.on('submit:valid', function(instance) {
				var idLastObs = app.utils.idLastObs;
				instance.attributes.obsId = idLastObs + 1;
				// autoincrement last obs id
				app.utils.idLastObs += 1;
				// store value
				localStorage.setItem("idLastObs", app.utils.idLastObs);
				instance.attributes.idStation = app.utils.LastStation.attributes.stationId;
				instance.attributes.protocolName = $("input[name='protocolName']").val();
				instance.attributes.protocolId = $("input[name='protocolId']").val();
				app.collections.observations.add(instance);
				app.collections.observations.save();
				// create model StationProtocol that we need to display stored data and add it to the collection
				var obsModel = new app.models.StationProtocol();
				obsModel.attributes.idStation = app.utils.LastStation.attributes.stationId;
				obsModel.attributes.station = app.utils.LastStation.attributes.Name;
				obsModel.attributes.date = app.utils.LastStation.attributes.date;
				obsModel.attributes.LAT = app.utils.LastStation.attributes.LAT;
				obsModel.attributes.LON = app.utils.LastStation.attributes.LON;
				obsModel.attributes.protocol = instance.attributes.protocolName;
				obsModel.attributes.obsId = instance.attributes.obsId;
				app.collections.obsListForMyData.add(obsModel);
				app.collections.obsListForMyData.save();

				var url = this.serverUrl + "/station/add";
				var data = {protocoles: JSON.stringify(instance), stations: JSON.stringify(app.utils.LastStation)};
				// push data to server
				$.ajax({
					url: url,
					type: "POST",
					data: data,
					beforeSend: function(){
					    $("#waitCtr").css('display', 'block');
					},
					success: function(dt) {
						alert('success pushing data to server !');
						app.router.navigate("#data-entryEnd", {
							trigger: true
						});
					},
					complete: function(){
					    $("#waitCtr").css('display', 'none');
					},
					error : function(){
						alert('error in pushing data to server !');
					}
				}).fail(function() {
				    alert( "error" );
				});
			});
		}
	});
	app.views.InputEnd = app.views.BaseView.extend({
		template: 'inputEnd',
		afterRender: function() {
			// display selected protocol name
			$("#selectedProtocolName").text(app.utils.selectedProtocolName);
			var nbStoredObservations = app.collections.observations.length;
			$("#inputNbStoredObs").text(nbStoredObservations);
		},
		events: {
			'click li.inputEnd': 'navigation',
			'click #backStation': 'backToStation'
		},
		navigation: function(e) {
			e.preventDefault();
			var route = $(e.target).attr("href");
			if (route) {
				app.router.navigate(route, {
					trigger: true
				});
			}

		},
		backToStation: function() {
			if (app.utils.stationType === "newStation") {
				app.router.navigate('#newStation', {
					trigger: true
				});
			} else {
				app.router.navigate('#importedStation', {
					trigger: true
				});
			}
		}
	});
	app.views.CurrentUser = app.views.BaseView.extend({
		template: 'current-user',
		serialize: function() {
			return {
				//name: app.instances.currentUser.fullName()
				name: "Olivier Rovellotti"
			};
		}
	});
	
	return app;
})(ecoReleveData);