﻿(function(_, Backbone){function S4(){return((1+Math.random())*65536|0).toString(16).substring(1)}function guid(){return S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4()}Backbone.LocalStorage=window.Store=function(name){this.name=name;var store=this.localStorage().getItem(this.name);this.records=store&&store.split(",")||[]};_.extend(Backbone.LocalStorage.prototype,{save:function(){this.localStorage().setItem(this.name,this.records.join(","))},create:function(model){if(!model.id){model.id=guid();model.set(model.idAttribute,model.id)}this.localStorage().setItem(this.name+"-"+model.id,JSON.stringify(model));this.records.push(model.id.toString());this.save();return model.toJSON()},update:function(model){this.localStorage().setItem(this.name+"-"+model.id,JSON.stringify(model));if(!_.include(this.records,model.id.toString()))this.records.push(model.id.toString());this.save();return model.toJSON()},find:function(model){return JSON.parse(this.localStorage().getItem(this.name+"-"+model.id))},findAll:function(){return _(this.records).chain().map(function(id){return JSON.parse(this.localStorage().getItem(this.name+"-"+id))},this).compact().value()},destroy:function(model){this.localStorage().removeItem(this.name+"-"+model.id);this.records=_.reject(this.records,function(record_id){return record_id==model.id.toString()});this.save();return model},localStorage:function(){return localStorage}});Backbone.LocalStorage.sync=window.Store.sync=Backbone.localSync=function(method,model,options){var store=model.localStorage||model.collection.localStorage;var resp,syncDfd=$.Deferred&&$.Deferred();switch(method){case"read":resp=model.id!=undefined?store.find(model):store.findAll();break;case"create":resp=store.create(model);break;case"update":resp=store.update(model);break;case"delete":resp=store.destroy(model);break}if(resp){if(options&&options.success)options.success(resp);if(syncDfd)syncDfd.resolve()}else{if(options&&options.error)options.error("Record not found");if(syncDfd)syncDfd.reject()}return syncDfd&&syncDfd.promise()};Backbone.ajaxSync=Backbone.sync;Backbone.getSyncMethod=function(model){if(model.localStorage||model.collection&&model.collection.localStorage){return Backbone.localSync}return Backbone.ajaxSync};Backbone.sync=function(method,model,options){return Backbone.getSyncMethod(model).apply(this,[method,model,options])}})(_, Backbone);