/*
 * Grid view
 */

var NS = window.NS || {};

NS.UI = (function(ns) {
    "use strict";

    var tplCache = {}, BaseView;

    /*
     * Utility class holding rendering process and sub-view management.
     * It may looks like LayoutManager because this grid component used to depend on it.
     */
    BaseView = Backbone.View.extend({

        initialize: function() {
            this._views = {};
        },

        /*
         * Template management
         */

        // Child classes must declare a template and store the template string in NS.UI.GridTemplates[template]
        template: '',

        fetchTemplate: function(name) {
            if (!(this.template in tplCache))
                tplCache[this.template] = _.template(ns.GridTemplates[this.template], null, {variable: 'data'});
            return tplCache[this.template];
        },

        /*
         * Sub-view management
         */

        getViews: function(selector) {
            if (selector in this._views)
                return this._views[selector];
            return [];
        },

        insertView: function(selector, view) {
            // Keep a reference to this selector/view pair
            if (! (selector in this._views))
                this._views[selector] = [];
            this._views[selector].push(view);
            // Forget this subview when it gets removed
            view.once('remove', function(view) {
                var i, found = false;
                for (i=0; i<this.length; i++) {
                    if (this[i].cid == view.cid) {
                        found = true;
                        break;
                    }
                }
                if (found) this.splice(i, 1);
            }, this._views[selector]);
        },

        removeViews: function(selector) {
            if (selector in this._views)
                while (this._views[selector].length) {
                    this._views[selector][0].remove();
                }
        },

        // Take care of sub-views before removing
        remove: function() {
            _.each(this._views, function(viewList, selector) {
                _.each(viewList, function(view) {
                    view.remove();
                });
            });
            this.trigger('remove', this);
            Backbone.View.prototype.remove.apply(this, arguments);
        },

        /*
         * Rendering process
         */

        // To be implemented by child classes
        serialize: function() {
            return {};
        },

        // Can be overridden by child classes
        beforeRender: function() {},
        afterRender: function() {},

        render: function() {
            // Give a chance to child classes to do something before render
            this.beforeRender();

            var tpl = this.fetchTemplate(),
                data = this.serialize(),
                rawHtml = tpl(data),
                rendered;

            // Re-use nice "noel" trick from LayoutManager
            rendered = this.$el.html(rawHtml).children();
            this.$el.replaceWith(rendered);
            this.setElement(rendered);

            // Add sub-views
            var base;
            _.each(this._views, function(viewList, selector) {
                base = (selector) ? this.$el.find(selector) : this.$el;
                _.each(viewList, function(view) {
                    view.render().$el.appendTo(this);
                }, base);
            }, this);
            base = null; // Allow GC

            // Give a chance to child classes to do something after render
            this.afterRender();

            return this;
        }
    });

    var GridRow = BaseView.extend({
        template: 'row',

        events: {
            'click': 'onClick'
        },

        initialize: function() {
            BaseView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, 'change', this.render);
        },

        _getFlatAttrs: function (prefix, values, schema, attrs) {

            _.each(schema, function (field, fieldName) {

                if (('main' in field) && !field.main) return;
                switch (field.type) {
                    case 'MultiSchema':
                        var schemas = _.result(schema[fieldName], 'schemas');
                        this._getFlatAttrs(
                            prefix + fieldName + '.',
                            values,
                            schemas[attrs[schema[fieldName].selector].id],
                            attrs[fieldName] || {}
                        );
                        break;
                    case 'NestedModel':
                        this._getFlatAttrs(
                            prefix + fieldName + '.',
                            values,
                            schema[fieldName].model.schema,
                            attrs[fieldName].attributes
                        );
                        break;
                    case 'List':
                        if (Object.keys(attrs[fieldName]).length === 0 ) {
                            var array = [];
                            _.each(schema[fieldName].model.schema, function(v) {
                                if ("main" in v) {
                                    if (v['main']) {
                                        array.push( {} );
                                    }
                                } else {
                                    array.push( {} );
                                }
                            });
                            values[fieldName] = array;
                        } else {
                            values[fieldName] = [];
                            _.each(attrs[fieldName], function (model, idx) {
                                var tmp = {};
                                this._getFlatAttrs(
                                    prefix + fieldName + '.' + idx + '.',
                                    tmp,
                                    schema[fieldName].model.schema,
                                    attrs[fieldName][idx].attributes
                                );
                                values[fieldName][idx] = tmp;
                            }, this);
                        }

                        break;
                    case 'Date':
                        var d = attrs[fieldName];
                        if (_.isDate(d))
                            d = d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear();
                        values[prefix + fieldName] = d;
                        break;
                    default:
                        values[prefix + fieldName] = attrs[fieldName];
                        break;
                }
            }, this);
        },

        getFlatAttrs: function (model) {
            if (! model.constructor.schema) { return model.attributes; }
            var values = {};

            this._getFlatAttrs('', values, model.constructor.schema, model.attributes);

            return values;
        },

        serialize: function() {
            var viewData = {};
            viewData.attr = this.getFlatAttrs(this.model);
            viewData.maxRowSpan = 1;
            _.each(viewData.attr, function(element) {
                if (_.isArray(element)) {
                    var len = element.length;
                    viewData.maxRowSpan = (len > viewData.maxRowSpan) ? len : viewData.maxRowSpan;
                }
            });
            return viewData;
        },

        onClick: function(e) {
            e.preventDefault(); // FIXME: What if the grid row holds button or anchors? or the user want to add click handler on some part of the row?
            this.trigger('selected', this.model);
        }
    });

    ns.Grid = BaseView.extend({
        template: 'grid',

        events: {
            'click .pagination [data-target]': 'onPage',
            'click .sort-action': 'onSort',
            'click .filter-action': 'toggleFilter',
            'submit .filter-form form': 'addFilter',
            'input .filter-form input[type="number"]': 'onNumberInput',
            'reset .filter-form form': 'clearFilter',
            'change .pagination select[name="pagesizes"]': 'onPageRedim'
        },

        initialize: function(options) {
            BaseView.prototype.initialize.apply(this, arguments);

            // Config
            options = options || {};
            _.defaults(options, {
                currentSchemaId: '',
                filters: {},
                disableFilters: false,
                size: 0,
                pageSizes: [5,9,10, 15, 25, 50],
                pageSize: 9,
                page: 1,
                maxIndexButtons: 7
            });
            _.extend(this, _.pick(options, ['sortColumn', 'sortOrder', 'currentSchemaId', 'filters', 'disableFilters', 'size', 'pageSizes', 'pageSize', 'page', 'maxIndexButtons']));
            if (options.collection) this.setCollection(options.collection);

            this._numberRegexp = new RegExp('^([0-9]+|[0-9]*[\.,][0-9]+)$');
        },

        setCollection: function(c) {
            if (this.collection) this.stopListening(this.collection);
            this.collection = c;
            this.listenTo(c, 'reset', this.render);
        },

        _getSubHeaders: function(schema, prefix) {
            var context = {
                grid: this,
                prefix: prefix,
                subDepth: 0
            }, sub = {
                headers: []
            };

            _.each(schema, function(field, id) {
                if (('main' in field) && !field.main) return ;
                var header = {
                    id: this.prefix + id,
                    title: field.title || id,
                    sortable: 'sortable' in field && field.sortable,
                    order: (this.prefix + id == this.grid.sortColumn) ? this.grid.sortOrder || 'asc' : '',
                    sub: {depth: 0, headers: []}
                };
                switch (field.type) {
                    case 'NestedModel':
                    case 'List':
                        header.sub = this.grid._getSubHeaders(field.model.schema, this.prefix + id + '.');
                        break;
                    case 'MultiSchema':
                        var schemas = _.result(field, 'schemas');
                        var selected = this.grid.currentSchemaId;
                        if (selected !== '') {
                            header.sub = this.grid._getSubHeaders(schemas[selected], this.prefix + id + '.');
                        }
                        break;
                    case 'Text':
                    case 'Boolean':
                    case 'Number':
                        if (!this.grid.disableFilters)
                            header.filter = {type: field.type, val: this.grid.filters[this.prefix + id]};
                        break;
                    case 'Date':
                        if (!this.grid.disableFilters) {
                            var d = new Date(this.grid.filters[this.prefix + id]),
                                val = (isFinite(d)) ? d.getFullYear() + '-' + (d.getMonth()+1)  + '-' + d.getDate() : undefined;
                            header.filter = {type: field.type, val: val};
                        }
                        break;
                }
                if (header.sub.depth > this.subDepth) {this.subDepth = header.sub.depth;}
                sub.headers.push(header);
            }, context);

            sub.depth = context.subDepth + 1;

            return sub;
        },

        getHeaderIterator: function() {
            return _.bind(
                /*
                 * Breadth-first tree traversal algorithm
                 * adapted to insert a step between each row
                 */
                function (cbBeforeRow, cbCell, cbAfterRow) {
                    var queue = [],
                        cell, row;
                    // initialize queue with a copy of headers
                    _.each(this.headers, function(h) {queue.push(h);});
                    // Iterate over row queue
                    while (queue.length > 0) {
                        row = queue, queue = [];
                        cbBeforeRow(this.depth);
                        while (cell = row.shift()) {
                            // Enqueue sub-headers if any
                            _.each(cell.sub.headers, function(h) {queue.push(h);});
                            // Process the header cell
                            cbCell(cell, this.depth);
                        }
                        cbAfterRow(this.depth);
                        this.depth--;
                    }
                },
                // Bind the tree traversal algorithm to the actual header tree
                this._getSubHeaders(this.collection.model.schema, '')
            );
        },

        serialize: function() {
            // Default view data
            var pagerData = {
                firstPage: 1,
                lastPage: Math.ceil(this.size / this.pageSize),
                page: this.page,
                totalCount: this.size,
                windowStart: 1,
                windowEnd: this.maxIndexButtons,
                activeFirst: false,
                activePrevious: false,
                activeNext: false,
                activeLast: false,
                showLeftDots: false,
                showRightDots: true
            };

            // Decide what to do with arrow buttons
            if (pagerData.page > pagerData.firstPage) {
                pagerData.activeFirst = true;
                pagerData.activePrevious = true;
            }
            if (pagerData.lastPage !== null && pagerData.page < pagerData.lastPage) {
                pagerData.activeLast = true;
                pagerData.activeNext = true;
            }
            // Compute a window for indexes
            pagerData.windowStart = pagerData.page - Math.floor(this.maxIndexButtons/2);
            pagerData.windowEnd = pagerData.page + Math.floor(this.maxIndexButtons/2) + this.maxIndexButtons % 2 - 1;
            if (pagerData.windowStart < pagerData.firstPage) {
                pagerData.windowEnd += pagerData.firstPage - pagerData.windowStart;
                pagerData.windowStart = pagerData.firstPage;
            }
            if (pagerData.windowEnd > pagerData.lastPage) {
                var offset = pagerData.windowEnd - pagerData.lastPage;
                if (pagerData.windowStart > pagerData.firstPage + offset) pagerData.windowStart -= offset;
                pagerData.windowEnd = pagerData.lastPage;
            }
            // Append/Prepend dots where necessary
            pagerData.showRightDots = pagerData.windowEnd < pagerData.lastPage;
            pagerData.showLeftDots = pagerData.windowStart > pagerData.firstPage;

            return {
                pageSizes: this.pageSizes,
                pageSize: this.pageSize,
                headerIterator: this.getHeaderIterator(),
                pager: pagerData
            };
        },

        beforeRender: function() {
            // Clear rows of a previous render
            this.removeViews('table');
            // Add a subview for each grid row
            this.collection.each(function(item) {
                var v = new GridRow({model: item});
                this.insertView('table', v);
                v.on('selected', function(model) {
                    this.trigger('selected', model);
                }, this);
            }, this);
        },

        afterRender: function() {
            // Allow user to define a datepicker widget
            this.$el.find('th input[type="date"]').each($.proxy(function(idx, elt) {
                this.addDatePicker(elt);
            }, this));
        },

        addDatePicker: function(element) {
            // Can be overridden by users to activate a custom datepicker on date inputs
        },

        onPageRedim: function(e) {
            var $select = $(e.target),
                size = parseInt($select.val());
            if (! isNaN(size))
                this.trigger('pagesize', size);
        },

        onPage: function(e) {
            var $pageButton = $(e.target),
                target = parseInt($pageButton.data('target'));
            if (! isNaN(target))
                this.trigger('page', target);
        },

        onNumberInput: function(e) {
            var $input = $(e.target),
                val = $input.val();
            $input.toggleClass('error', val != '' && !this._numberRegexp.test(val));
        },

        clearFilter: function(e) {
            var $form = $(e.target);
            this.trigger('unfilter', $form.data('id'));
            $form.find('.error').removeClass('error');
            $form.parents('.filter-form').hide();
        },

        addFilter: function(e) {
            e.preventDefault();
            var val;
            var $form = $(e.target),
                key = $form.data('id');
            switch ($form.data('type')) {
                case 'Text':
                    val = $form.find('[name="val"]').val();
                    val = $.trim(val);
                    break;
                case 'Number':
                    val = $form.find('[name="val"]').val();
                    val = $.trim(val);
                    if (this._numberRegexp.test(val))
                        val = val.replace(/,/, '.');
                    else
                        val = '';
                    break;
                case 'Date':
                    val = $.trim($form.find('[name="val"]').val());
                    var parts;
                    /*if (! /\d{2}\/\d{2}\/\d{4}/.test(val)) {
                        val = '';
                        break;
                    }*/
                    // Beware of new Date(s), if s is 01/10/2012, it is interpreted as Jan 10, 2012
                    parts = val.split('-');
					if ( parts.length == 1) {
						parts = val.split('/');
						var prt = parts[0];
						parts[0] = parts[2];
						parts[2] = prt;
					}
                    val = new Date(parts[0], parts[1]-1, parts[2]);
					val = val.toString();
                    if (isFinite(val)) {
                        // Remove TZ offset
                        // FIXME: it should be possible to handle TZ in a clever way, I have to investigate...
                        // Note that the problem comes from the server data which pretend to be UTC but is not
                        /*val.setMinutes(val.getMinutes() - val.getTimezoneOffset());
                        val = val.toISOString();*/
                    } else {
                       // val = '';
                    }
                    break;
                case 'Boolean':
                    val = $form.find('[name="val"]:checked').val() || '';
                    break;
            }
            if (val === '' && key in this.filters) {
                this.trigger('unfilter', key);
                $form.find('.error').removeClass('error');
            } else if (val !== '') {
                this.trigger('filter', key, val);
                $form.find('.error').removeClass('error');
            }
            $form.parents('.filter-form').hide();
        },

        toggleFilter: function(e) {
            var form = $(e.target).siblings('.filter-form'),
                isHidden = form.is(':hidden');
            $('.grid .filter-form').hide(); // Close all open forms (on this column or on other columns)
            if (isHidden) {
                form.show();
                form.find('input').first().focus();
            }
        },

        onSort: function(e) {
            var $elt = $(e.target);
            var col = $elt.data('id');
            var currentOrder = $elt.data('order');
            if (currentOrder == 'asc') { // Already sorted (asc), switch to descending order
                this.trigger('sort', col, 'desc');
            } else if (currentOrder == 'desc') { // Already sorted (desc), swtich back to unsorted
                this.trigger('unsort');
            } else { // Not sorted yet, switch to ascending order
                this.trigger('sort', col, 'asc');
            }
        }
    });

    ns.GridTemplates = {
        'row': '<tbody><% for (var i = 0 ; i < data.maxRowSpan ; i++) {' +
               '    %><tr><%' +
               '    _.each(data.attr, function(value, key) {' +
               '        if (_.isArray(value)) {' +
               '            if (value[i] != undefined) { ' +
               '                if (_.isObject(value[i])) {' +
               '                    if (_.isEmpty(value[i]) && i === 0) {' +
               '                        %> <td colspan="<%= value.length %>">&nbsp;</td><%' +
               '                    } else {' +
               '                        _.each(value[i], function(v,k) {' +
               '                            %><td><%= v %></td><%' +
               '                        });' +
               '                    }' +
               '                } else {' +
               '                    if (i == value.length - 1) {' +
               '                        %> <td rowspan="<%= data.maxRowSpan - i %>"><%= value[i] %></td> <%' +
               '                    } else {' +
               '                        %><td><%= value[i] %></td><%' +
               '                    }' +
               '                }' +
               '            } else if (i === 0) {' +
               '                %> <td rowspan="<%= data.maxRowSpan %>">&nbsp; </td> <%' +
               '            }' +
               '        } else if (i === 0) {' +
               '            %><td rowspan="<%= data.maxRowSpan %>"><%= value %></td><%' +
               '        }' +
               '    });' +
               '    %></tr><%' +
               '}%></tbody>',
        'grid': '<div class="grid">' +
                '<table class="table table-bordered">' +
                '    <thead><% data.headerIterator(' +
                '        function (depth) {%><tr><%},' +
                '        function (cell, depth) {' +
                '            var colspan = (cell.sub.headers.length > 1) ? \' colspan="\' + cell.sub.headers.length + \'"\' : \'\',' +
                '                rowspan = (depth > 1 && cell.sub.depth === 0) ? \' rowspan="\' + depth + \'"\' : \'\',' +
                '                iconClass = (cell.order == "") ? "icon-sort" : (cell.order == "asc") ? "icon-sort-up" : "icon-sort-down";' +
                '            %><th<%= colspan %><%= rowspan %>><div>' +
                '                <%= cell.title %>' +
                '                <% if (cell.sortable) { %><i class="sort-action <%= iconClass %>" data-order="<%= cell.order %>" data-id="<%= cell.id %>" title="Trier"></i><% } %>' +
                '                <% if (cell.filter) { %>' +
                '                    <i class="filter-action icon-filter<%= (cell.filter.val ? " active" : "" ) %>" title="Filter"></i>' +
                '                    <div class="filter-form"><form data-type="<%= cell.filter.type %>" data-id="<%= cell.id %>">' +
                '                        <div class="filter-form-div">' +
                '                            <% if (cell.filter.type == "Text") { %>' +
                '                            <input  type="text" name="val" value="<%= cell.filter.val || "" %>" />' +
                '                            <% } else if (cell.filter.type == "Number") { %>' +
                '                            <input  type="number" name="val" value="<%= cell.filter.val || "" %>" />' +
                '                            <% } else if (cell.filter.type == "Date") { %>' +
                '                            <input  type="date" name="val" value="<%= cell.filter.val || "" %>" />' +
                '                            <% } else if (cell.filter.type == "Boolean") { %>' +
                '                            <div  filter-form-boolean">' +
                '                            <label class="radio inline"><input type="radio" name="val" value="true"<%= cell.filter.val == "true" ? " checked" : "" %> />Yes</label>' +
                '                            <label class="radio inline"><input type="radio" name="val" value="false"<%= cell.filter.val == "false" ? " checked" : "" %> />No</label>' +
                '                            </div>' +
                '                            <% } %>' +
                '                            <br/><button class="btn btn-primary" type="submit">Filter</button>' +
                '                            <button class="btn" type="reset">Clear</button>' +
                '                        </div>' +
                '                    </form></div>' +
                '                <% } %>' +
                '            </div></th><%' +
                '        },' +
                '        function (depth) {%></tr><%}) %></thead>' +
                '</table>' +
                '<div class="pagination pagination-right">' +
                '<div class="pagination-stats">' +
                '<%= (data.pager.totalCount > 1) ? data.pager.totalCount + " observations" : data.pager.totalCount + " item" %>,' +
                '<%= (data.pager.lastPage > 1) ? data.pager.lastPage + " pages" : data.pager.lastPage + " page" %>' +
                '</div>' +
                '<ul>' +
                '<li class="<% if (!data.pager.activeFirst) { %>disabled"><span>&lt;&lt;</span><% } else { %>"><span data-target="<%= data.pager.firstPage %>">&lt;&lt;</span><% } %></li>' +
                '<li class="<% if (!data.pager.activePrevious) { %>disabled"><span>&lt;</span><% } else { %>"><span data-target="<%= data.pager.page - 1 %>">&lt;</span><% } %></li>' +
                '<% if (data.pager.showLeftDots) { %><li><span>...</span></li><% } %>' +
                '<% for (var i=data.pager.windowStart; i<=data.pager.windowEnd; i++) { if (i == data.pager.page) { %><li class="active"><span><%= i %></span></li><% } else { %><li><span data-target="<%= i %>"><%= i %></span></li><% }} %>' +
                '<% if (data.pager.showRightDots) { %><li><span>...</span></li><% } %>' +
                '<li class="<% if (!data.pager.activeNext) { %>disabled"><span>&gt;</span><% } else { %>"><span data-target="<%= data.pager.page + 1 %>">&gt;</span><% } %></li>' +
                '<li class="<% if (!data.pager.activeLast) { %>disabled"><span>&gt;&gt;</span><% } else { %>"><span data-target="<%= data.pager.lastPage %>">&gt;&gt;</span><% } %></li>' +
                '</ul>' +
                '<span id="pagesize-selector">' +
                '<select name="pagesizes">' +
                '    <% for (var i=0; i<data.pageSizes.length; i++) { %><option<% if (data.pageSizes[i] == data.pageSize) { %> selected="selected"<% } %>><%= data.pageSizes[i] %></option><% } %>' +
                '</select>' +
                'observations per page' +
                '</span>' +
                '</div>' +
                '</div>'
    };

    return ns;
})(NS.UI || {});
