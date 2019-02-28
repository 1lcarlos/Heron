Heron.options.map.toolbar = [
	{type: "featureinfo", options: {
	}},
	{type: "pan"},
	{type: "zoomin"},
	{type: "zoomout"},
	{type: "zoomvisible"},
	{type: "-"}
];

/**
 * Defines the entire layout of a Heron webapp using ExtJS-style.
 **/
Heron.layout = {
	xtype: 'panel',
	id: 'hr-container-main',
	layout: 'border',
	border: true,

	items: [
		{
			xtype: 'panel',

			id: 'hr-menu-left-container',
			layout: 'accordion',
			region: "west",
			width: 240,
			collapsible: true,
			split: false,
			border: false,
			items: [
				{
					xtype: 'hr_layertreepanel',
                    contextMenu: [
                         {
                             xtype: 'hr_layernodemenulayerinfo'
                         },
                         {
                             xtype: 'hr_layernodemenuzoomextent'
                         },
                         {
                             xtype: 'hr_layernodemenuopacityslider'
                         }
                     ],
					hropts: Heron.options.layertree
				}
			]
		},
		{
			xtype: 'panel',

			id: 'hr-map-featureinfo-container',
			layout: 'border',
			region: 'center',
			width: '100%',
			collapsible: false,
			split: false,
			border: false,
			items: [
				{
					xtype: 'hr_mappanel',
					title: '&nbsp;',
					id: 'hr-map',
					region: 'center',
					collapsible: false,
					border: false,
					hropts: Heron.options.map
				},
				{
					xtype: 'hr_featureinfopanel',
					id: 'hr-feature-info',
					region: "south",
					border: true,
					collapsible: true,
					collapsed: true,
					height: 205,
					split: false,
                    showTopToolbar: true,
                    displayPanels: ['Table'],
					// Export to download file. Option values are 'CSV', 'XLS', default is no export (results in no export menu).
                    exportFormats: ['CSV', 'XLS', 'GMLv2', 'Shapefile', 'GeoJSON', 'WellKnownText'],
					maxFeatures: 10
				}
			]
		},
		{
			xtype: 'panel',

			id: 'hr-menu-right-container',
			layout: 'accordion',
			region: "east",
			width: 240,
			collapsible: true,
			split: false,
			border: false,
			items: [
				{
					xtype: 'hr_layerlegendpanel',
					id: 'hr-layerlegend-panel',
					defaults: {
						useScaleParameter: true,
						baseParams: {
							FORMAT: 'image/png'
						}
					},
					hropts: {
						// Preload Legends on initial startup
						// Will fire WMS GetLegendGraphic's for WMS Legends
						// Otherwise Legends will be loaded only when Layer
						// becomes visible. Default: false
						prefetchLegends: false
					}
				}
			]
		}
	]
};