define([
    'marionette',
    'radio',
    'modules2/home/views/graph',
    'modules2/home/views/info',
    'text!modules2/home/templates/home.html'
], function(Marionette, Radio, GraphView, InfoView, template) {
    'use strict';
    return Marionette.LayoutView.extend( {
        className:'container',
        template: template,
        regions: {
            graph: '#graph',
            info: '#info',
            tiles: '#tiles'
        },
        events: {
            'click #argosTile': 'argos',
            'click #gsmTile': 'gsm',
            'click #indivTile': 'individual',
            'click #stationsTile': 'stations',
            'click #transmitterTile': 'transmitter',
            'click #monitoredSiteTile' : 'monitoredSite',
            'click #manualTile' : 'dataEntry',
            'click #importTile' : 'import',
            'click #myDataTile' : 'export'
        },
        initialize: function(){

        },

        onShow: function() {

            this.info.show(new InfoView());
            this.graph.show(new GraphView());
             $('.credits').show();
            

        },

        onRender: function(){
            $('body').addClass('home-page');
/*            $.vegas ({
                src: 'images/home_fond.jpg'
            });*/
        },

        onDestroy: function() {
            $('body').removeClass('home-page');
            $('.credits').hide();
        },

        argos: function() {
            Radio.channel('route').trigger('argos');
        },

        
        stations: function(){
            Radio.channel('route').command('stations');
        },

        gsm: function() {
            Radio.channel('route').command('gsm');
        },

        individual: function() {
            Radio.channel('route').command('individual');
        },

        monitoredSite: function() {
            Radio.channel('route').trigger('monitoredSite');
        },

        transmitter: function() {
            Radio.channel('route').trigger('transmitter');
        },
        import: function() {
            Radio.channel('route').trigger('import');
        },
        dataEntry : function() {
            Radio.channel('route').trigger('input');
        },

        export: function(){
            Radio.channel('route').command('export');
        }
    });
});
