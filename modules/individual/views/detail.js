define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'moment',
    'radio',
    'utils/datalist',
    'config',
    'text!modules2/individual/templates/detail.html'
], function($, _, Backbone, Marionette, moment, Radio, datalist, config, template) {

    'use strict';

    return Marionette.ItemView.extend({
        template: template,
        className:'detailsIndivPanel',

        events: {
            'click #hideIndivDetails': 'hideDetail',
            'click #backToSearch': 'backToSearch',
        },

        modelEvents: {
            'change': 'render'
        },

        initialize: function(options) {
            this.model.fetch();
            this.radio = Radio.channel('individual');
            this.radio.comply('loaded', this.completeCard, this);
            this.filter = options.filter || null;
        },

        backToSearch: function() {
            if(this.filter){
                sessionStorage.setItem('individual:currentFilter', JSON.stringify(this.filter));
            }
            Radio.channel('route').command('individual');
        },

        completeCard: function(options) {
            this.$el.find('#indivLastObs').text(
                moment.unix(options.lastObs).format("YYYY-MM-DD")
            );
            this.$el.find('#indivNbObs').html(options.nbObs);
        },

        hideDetail: function() {
            this.radio.trigger('hide-detail');
        },

        onRender: function() {
            var history = new Backbone.Collection(this.model.get('history'));

            var columns = [{
                name: "name",
                label: "Name",
                editable: false,
                cell: 'string'
            }, {
                editable: false,
                name: "value",
                label: "Value",
                cell: "string"
            }, {
                editable: false,
                name: "from",
                label: "From",
                cell: "string"
            }, {
                editable: false,
                name: "to",
                label: "To",
                cell: "string"
            }];

            // Initialize a new Grid instance
            this.grid = new Backgrid.Grid({
                columns: columns,
                collection: history
            });


            this.setSpecieImage(this.model.get('species'));
            this.setFontIcons();



            $("#history").append(this.grid.render().el);

            /*
            
            var height = $(window).height() - $('header').height();
            height -= $('#details').height();
            this.$el.find('#history').height(height);
            */

            //this.$el.find('#history').css('margin-bottom', '20px');
        },

        onShow: function(){

            //this.$el.find('#history').css('margin-bottom', '20px');
        },

        onDestroy: function() {
            $('body').css('background-color', 'white');
            this.radio.stopComplying('loaded');
            this.grid.remove();
            this.grid.stopListening();
            this.grid.collection.reset();
            this.grid.columns.reset();
            delete this.grid.collection;
            delete this.grid.columns;
            delete this.grid;
        },

        setFontIcons: function(){

            if (this.model.get('sex') === 'female'){
                $("#icon-sex").addClass('female');
            }else{
                $("#icon-sex").addClass('male');
            }

            if (this.model.get('origin') === 'release'){
                $("#icon-origin").addClass('elevage');
            }else{
                $("#icon-origin").addClass('free');
            }

            if (this.model.get('age') === 'adult'){
                $("#icon-age").addClass('adult');
            }else{
                $("#icon-age").addClass('child');
            }

        },

        setSpecieImage: function(species) {
            var file = null;
            switch (species) {
                case 'Saker Falcon' :
                case 'Peregrine Falcon' :
                case 'Falcon' :
                case 'Gyr Falcon':
                case 'Barbary Falcon':
                case 'Hybrid Gyr_Peregrine Falcon':
                case 'Eurasian Griffon Vulture':
                case 'Desert Eagle Owl':
                    // set image
                    file = 'faucon.png';
                    break;
                case 'Asian Houbara Bustard' :
                case 'North African Houbara Bustard' :
                    file = 'houtarde.png';
                    break;
                case 'Black-bellied Sandgrouse':
                    file = 'Black-bellied Sandgrouse.png';
                    break;
                case 'Crocodile':
                    file = 'crocodile.png';
                    break;
                case 'Horseshoe Snake':
                case 'Mograbin Diadem Snake':
                    file = 'Snake.png';
                    break;
                case 'Pelican':
                    file = 'Pelican.png';
                    break;
                case 'Rat (Atlantoxerus)':
                    file = 'rat.png';
                    break;
                case 'Spur Thighed Tortoise (graeca)':
                    file = 'tortoise.png';
                    break;
               default:
                    file = 'specie.png';
            }
            $('#birdSpecieImg').attr('src','assets/img/spacies/'+ file);
        },
    });
});
