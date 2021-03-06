/**
 * Copyright (c) 2008-2012 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 * @requires widgets/form/CSWFilterField.js
 */

/** api: (define)
 *  module = gxp
 *  class = CatalogueSearchPanel
 *  base_link = `Ext.Panel <http://extjs.com/deploy/dev/docs/?class=Ext.Panel>`_
 */
Ext.namespace("gxp");

/** api: constructor
 *  .. class:: CatalogueSearchPanel(config)
 *   
 *      Create a panel for searching a CS-W.
 */
gxp.CatalogueSearchPanel = Ext.extend(Ext.Panel, {

    /** private: property[border]
     *  ``Boolean``
     */
    border: false,

    /** api: config[maxRecords]
     *  ``Integer`` The maximum number of records to retrieve in one batch.
     *  Defaults to 10.
     */
    maxRecords: 10,

    /** api: config[map]
     *  ``OpenLayers.Map``
     */
    map: null,

    /** api: config[selectedSource]
     *  ``String`` The key of the catalogue source to use on startup.
     */
    selectedSource: null,

    /** api: config[sources]
     *  ``Object`` The set of catalogue sources for which the user will be
     *  able to query on.
     */
    sources: null,

    /* i18n */
    searchFieldEmptyText: "Search",
    searchButtonText: "Search",
    addTooltip: "Create filter",
    addMapTooltip: "Add to map",
    advancedTitle: "Advanced",
    datatypeLabel: "Data type",
    extentLabel: "Spatial extent",
    categoryLabel: "Category",
    datasourceLabel: "Data source",
    filterLabel: "Filter search by",
    removeSourceTooltip: "Switch back to original source",
    showMetaDataTooltip: "Show full metadata",
    /* end i18n */

    /** private: method[initComponent]
     *  Initializes the catalogue search panel.
     */
    initComponent: function() {
        var me = this;
        this.addEvents(
            /** api: event[addlayer]
             *  Fires when a layer needs to be added to the map.
             *
             *  Listener arguments:
             *
             *  * :class:`gxp.CatalogueSearchPanel` this component
             *  * ``String`` the key of the catalogue source to use
             *  * ``Object`` config object for the WMS layer to create.
             */
            "addlayer"
        );
        this.filters = [];
        var sourceComboData = [];
        for (var key in this.sources) {
            sourceComboData.push([key, this.sources[key].title]);
        }
        if (sourceComboData.length >= 1) {
            this.selectedSource = sourceComboData[0][0];
        }
        var filterOptions = [['datatype', 'data type'], ['extent', 'spatial extent'], ['category', 'category']];
        if (sourceComboData.length > 1) {
            filterOptions.push(['csw', 'data source']);
        }
        this.sources[this.selectedSource].store.on('loadexception', function(proxy, o, response, e) {
            if (response.success()) {
                Ext.Msg.show({
                    title: e.message,
                    msg: gxp.util.getOGCExceptionText(e.arg.exceptionReport),
                    icon: Ext.MessageBox.ERROR,
                    buttons: Ext.MessageBox.OK
                });
            }
        });

        var recordRenderer = function (value, metadata, record) {
            // Line Splitter Function
            // copyright Stephen Chapman, 19th April 2006
            // you may copy this code but please keep the copyright notice as well
            function splitLine(st, n) {
                var b = '';
                var s = st;
                while (s.length > n) {
                    var c = s.substring(0, n);
                    var d = c.lastIndexOf(' ');
                    var e = c.lastIndexOf('\n');
                    if (e != -1) d = e;
                    if (d == -1) d = n;
                    b += c.substring(0, d) + '\n';
                    s = s.substring(d + 1);
                }
                return b + s;
            }

            function htmlEscape(str) {
                return String(str)
                        .replace(/&/g, '&amp;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
            }
            // tooltip template
            var qtipTpl = new Ext.XTemplate(
                '<h3>Abstract</h3>'
                , '<tpl for=".">'
                , '<div>{abstr}</div>'
                , '</tpl>'
            );
            var qtipStr = qtipTpl.apply({abstr: 'Unavailable'});
            var abstr = record.data['abstract'];
            if (abstr.length > 0) {
                abstr = abstr[0];
                abstr = htmlEscape(abstr);
                abstr = splitLine(abstr, 50);
                abstr = abstr.replace(/\r?\n/g, '<br/>');
                qtipStr = qtipTpl.apply({abstr: abstr});
            }
            abstr = abstr.split('<br/>')[0] + '...';
            var tplStr = new Ext.XTemplate('<b>{title}</b><br/>{abstr}').apply({title: value, abstr: abstr});
            return '<div ext:qtip=\'' + qtipStr + '\'>' + tplStr + '</div>';
        };

        this.items = [{
            xtype: 'form',
            border: false,
            ref: 'form',
            hideLabels: true,
            autoHeight: true,
            style: "margin-left: 5px; margin-right: 5px; margin-bottom: 5px; margin-top: 5px",
            items: [{
                xtype: "compositefield",
                items: [{
                    xtype: "textfield",
                    emptyText: this.searchFieldEmptyText,
                    ref: "../../search",
                    name: "search",
                    listeners: {
                         specialkey: function(field, e) {
                             if (e.getKey() == e.ENTER) {
                                 this.performQuery();
                             }
                         },
                         scope: this
                    },
                    width: 250
                }, {
                    xtype: "button",
                    text: this.searchButtonText,
                    handler: this.performQuery,
                    scope: this
                }]
            }, {
                xtype: "fieldset",
                collapsible: true,
                collapsed: true,
                hideLabels: false,
                hidden: true,
                title: this.advancedTitle,
                items: [{
                    xtype: 'gxp_cswfilterfield',
                    name: 'datatype',
                    property: 'apiso:Type',
                    comboFieldLabel: this.datatypeLabel,
                    comboStoreData: [
                        ['dataset', 'Dataset'],
                        ['datasetcollection', 'Dataset collection'],
                        ['application', 'Application'],
                        ['service', 'Service']
                    ],
                    target: this
                }, {
                    xtype: 'gxp_cswfilterfield',
                    name: 'extent',
                    property: 'BoundingBox',
                    map: this.map,
                    comboFieldLabel: this.extentLabel,
                    comboStoreData: [
                        ['map', 'spatial extent of the map']
                    ],
                    target: this
                }, {
                    xtype: 'gxp_cswfilterfield',
                    name: 'category',
                    property: 'apiso:TopicCategory',
                    comboFieldLabel: this.categoryLabel,
                    comboStoreData: [
                        ['farming', 'Farming'],
                        ['biota', 'Biota'],
                        ['boundaries', 'Boundaries'],
                        ['climatologyMeteorologyAtmosphere', 'Climatology/Meteorology/Atmosphere'],
                        ['economy', 'Economy'],
                        ['elevation', 'Elevation'],
                        ['environment', 'Environment'],
                        ['geoscientificinformation', 'Geoscientific Information'],
                        ['health', 'Health'],
                        ['imageryBaseMapsEarthCover', 'Imagery/Base Maps/Earth Cover'],
                        ['intelligenceMilitary', 'Intelligence/Military'],
                        ['inlandWaters', 'Inland Waters'],
                        ['location', 'Location'],
                        ['oceans', 'Oceans'],
                        ['planningCadastre', 'Planning Cadastre'],
                        ['society', 'Society'],
                        ['structure', 'Structure'],
                        ['transportation', 'Transportation'],
                        ['utilitiesCommunications', 'Utilities/Communications']
                    ],
                    target: this
                }, {
                    xtype: "compositefield",
                    id: "csw",
                    ref: "../../cswCompositeField",
                    hidden: true,
                    items: [{
                        xtype: "combo",
                        ref: "../../../sourceCombo",
                        fieldLabel: this.datasourceLabel,
                        store: new Ext.data.ArrayStore({
                            fields: ['id', 'value'],
                            data: sourceComboData
                        }),
                        displayField: 'value',
                        valueField: 'id',
                        mode: 'local',
                        listeners: {
                            'select': function(cmb, record) {
                                this.setSource(cmb.getValue());
                            },
                            'render': function() { 
                                this.sourceCombo.setValue(this.selectedSource);
                            },
                            scope: this
                        },
                        triggerAction: 'all'
                    }, {
                        xtype: 'button',
                        iconCls: 'gxp-icon-removelayers',
                        tooltip: this.removeSourceTooltip,
                        handler: function(btn) {
                            this.setSource(this.initialConfig.selectedSource);
                            this.sourceCombo.setValue(this.initialConfig.selectedSource);
                            this.cswCompositeField.hide();
                        },
                        scope: this
                    }]
                }, {
                    xtype: 'compositefield',
                    items: [{
                        xtype: "combo",
                        fieldLabel: this.filterLabel,
                        store: new Ext.data.ArrayStore({
                            fields: ['id', 'value'],
                            data: filterOptions
                        }),
                        displayField: 'value',
                        valueField: 'id',
                        mode: 'local',
                        triggerAction: 'all'
                    }, {
                        xtype: 'button',
                        iconCls: 'gxp-icon-addlayers',
                        tooltip: this.addTooltip,
                        handler: function(btn) {
                            btn.ownerCt.items.each(function(item) {
                                if (item.getXType() === "combo") {
                                    var id = item.getValue();
                                    item.clearValue();
                                    var field = this.form.getForm().findField(id);
                                    if (field) {
                                        field.show();
                                    }
                                }
                            }, this);
                        },
                        scope: this
                    }]
                }]
            }, {
                xtype: "grid",
                width: '100%', 
                anchor: '99%',
                viewConfig: {
                    scrollOffset: 0,
                    forceFit: true
                },
                border: false,
                ref: "../grid",
                bbar: new Ext.PagingToolbar({
                    listeners: {
                        'beforechange': function(tb, params) {
                            var delta = me.sources[me.selectedSource].getPagingStart();
                            if (params.startPosition) {
                                params.startPosition += delta;
                            }
                        }
                    },
                    /* override to support having a different value than 0 for the start */
                    onLoad : function(store, r, o) {
                        var delta = me.sources[me.selectedSource].getPagingStart();
                        if(!this.rendered){
                            this.dsLoaded = [store, r, o];
                            return;
                        }
                        var p = this.getParams();
                        this.cursor = (o.params && o.params[p.start]) ? o.params[p.start]-delta : 0;
                        var d = this.getPageData(), ap = d.activePage, ps = d.pages;
                        this.afterTextItem.setText(String.format(this.afterPageText, d.pages));
                        this.inputItem.setValue(ap);
                        this.first.setDisabled(ap == 1);
                        this.prev.setDisabled(ap == 1);
                        this.next.setDisabled(ap == ps);
                        this.last.setDisabled(ap == ps);
                        this.refresh.enable();
                        this.updateInfo();
                        this.fireEvent('change', this, d);
                    },
                    paramNames: this.sources[this.selectedSource].getPagingParamNames(),
                    store: this.sources[this.selectedSource].store,
                    pageSize: this.maxRecords
                }),
                loadMask: true,
                hideHeaders: true,
                store: this.sources[this.selectedSource].store,
                columns: [
                    {
                        id: 'title',
                        // xtype: "templatecolumn",
                        // tpl: '<div ext:qtip="{abstract}"><b>{title}</b><br/>{abstract}</div>',

                        // tpl: new Ext.XTemplate('<div ext:qtip="{abstract}"><b>{title}</b><br/>{abstract}</div>'),
                        sortable: true,
                        dataIndex: 'title',
                        renderer: recordRenderer
                    },
                    {
                        xtype: "actioncolumn",
                        width: 15,
                        items: [
                            {
                                getClass: function (v, meta, rec) {
                                    if (this.sources[this.selectedSource].fullMetadataUrlTpl) {
                                        return "gxp-icon-metadata";
                                    }
                                },
                                tooltip: this.showMetaDataTooltip,
                                handler: function (grid, rowIndex, colIndex) {
                                    var rec = this.grid.store.getAt(rowIndex);
                                    var id = rec.get("identifier")[0];

                                    // GeoNetwork cases where id is embedded in capitals but id should be lowercase
                                    // e.g. "{0FECD83D-66DF-49AB-8406-DB3EF00709C5}"
                                    if (id.indexOf('{') > -1) {
                                        id = id.toLowerCase();
                                    }
                                    var urlTemplate = this.sources[this.selectedSource].fullMetadataUrlTpl;
                                    if (urlTemplate) {
                                        var url = urlTemplate.apply({id: id});
                                        window.open(url, "MDWindow", "width=800, height=600, scrollbars=1, resizable=1");
                                    }
                                },
                                scope: this
                            }
                        ]
                    },
                    {
                        xtype: "actioncolumn",
                        width: 15,
                        items: [
                            {
                                getClass: function (v, meta, rec) {
                                    var ows = this.findWMS(rec.get("URI")) || this.findWMS(rec.get("references"));
                                    if (ows !== false) {
                                        return "gxp-icon-addlayers";
                                    }
                                },
                                tooltip: this.addMapTooltip,
                                handler: function (grid, rowIndex, colIndex) {
                                    var rec = this.grid.store.getAt(rowIndex);
                                    this.addLayer(rec);
                                },
                                scope: this
                            }
                        ]
                    }
                ],
                autoExpandColumn: 'title',
                autoHeight: true
            }] 
        }];
        gxp.CatalogueSearchPanel.superclass.initComponent.apply(this, arguments);
    },

    /** private: method[destroy]
     *  Clean up.
     */
    destroy: function() {
        this.sources = null;
        this.map = null;
        gxp.CatalogueSearchPanel.superclass.destroy.call(this);
    },

    /** private: method[setSource]
     *  :arg key: ``String`` The key of the source to search on.
     *
     *  Change the CS-W this panel will search on.
     */
    setSource: function(key) {
        this.selectedSource = key;
        var store = this.sources[key].store;
        this.grid.reconfigure(store, this.grid.getColumnModel());
        this.grid.getBottomToolbar().bindStore(store);
    },

    /** private: method[performQuery]
     *  Query the Catalogue and show the results.
     */
    performQuery: function() {
        var plugin = this.sources[this.selectedSource];
        plugin.filter({
            queryString: this.search.getValue(),
            limit: this.maxRecords,
            filters: this.filters
        });
    },

    /** private: method[addFilter]
     *  :arg filter: ``OpenLayers.Filter`` The filter to add.
     *
     *  Add the filter to the list of filters to use in the CS-W query.
     */
    addFilter: function(filter) {
        this.filters.push(filter);
    },

    /** private: method[removeFilter]
     *  :arg filter: ``OpenLayers.Filter`` The filter to remove.
     *
     *  Remove the filter from the list of filters to use in the CS-W query.
     */
    removeFilter: function(filter) {
        this.filters.remove(filter);
    },

    /** private: method[findWMS]
     *  :arg links: ``Array`` The links to search for a GetMap URL.
     *  :returns: ``Object`` A config object with the url and the layer name.
     *
     *  Look up the WMS url in a set of hyperlinks.
     *  TODO: find a more solid way to do this, without using GetCapabilities
     *  preferably.
     */
    findWMS: function(links) {
        var protocols = [
            'OGC:WMS-1.1.1-HTTP-GET-MAP',
            'OGC:WMS'
        ];
        var url = null, name = null, i, ii, link;
        // search for a protocol that matches WMS
        for (i=0, ii=links.length; i<ii; ++i) {
            link = links[i];
            if (link.protocol && protocols.indexOf(link.protocol.toUpperCase()) !== -1 && link.value && link.name) {
                url = link.value;
                name = link.name;
                break;
            }
        }
        // if not found by protocol, try by inspecting the url
        if (url === null) {
            for (i=0, ii=links.length; i<ii; ++i) {
                link = links[i];
                var value = link.value ? link.value : link;
                if (value.toLowerCase().indexOf('service=wms') > 0) {
                    var obj = OpenLayers.Util.createUrlObject(value);
                    url = obj.protocol + "//" + obj.host + ":" + obj.port + obj.pathname;
                    name = obj.args.layers;
                    break;
                }
            }
        }
        if (url !== null && name !== null && name.length > 0) {
            url = url.split('?')[0];
            return {
                url: url,
                name: name
            };
        } else {
            return false;
        }
    },

    /** private: method[addLayer]
     *  :arg record: ``GeoExt.data.LayerRecord`` The layer record to add.
     *
     *  Add WMS layers coming from a catalogue search.
     */
    addLayer: function (record) {

        var bounds = record.get("bounds");

        // Bounds may be empty
        var bbox;
        if (bounds && bounds != '') {
            var bLeft = bounds.left,
                bRight = bounds.right,
                bBottom = bounds.bottom,
                bTop = bounds.top;
            var left = Math.min(bLeft, bRight),
                right = Math.max(bLeft, bRight),
                bottom = Math.min(bBottom, bTop),
                top = Math.max(bBottom, bTop);
            bbox = [left, bottom, right, top];
        }

        // There may be multiple WMS layers!
        var uris = record.get("URI"), i, refsChecked=false;
        for (i = 0; i < uris.length; ++i) {

            var wmsInfo = this.findWMS([uris[i]]);
            if (wmsInfo === false && refsChecked === false) {
                // fallback to dct:references
                var references = record.get("references");
                wmsInfo = this.findWMS(references);
                // Do this only once TODO: make elegant
                refsChecked = true;
            }
            if (wmsInfo !== false) {
                this.fireEvent("addlayer", this, this.selectedSource, Ext.apply({
                    title: record.get('title')[0],
                    bbox: bbox,
                    srs: "EPSG:4326",
                    projection: record.get('projection'),
                    queryable: true
                }, wmsInfo));
            }
        }
    }

});

/** api: xtype = gxp_cataloguesearchpanel */
Ext.reg('gxp_cataloguesearchpanel', gxp.CatalogueSearchPanel);
