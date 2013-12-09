/*! 
* DevExpress Visualization VectorMap (part of ChartJS)
* Version: 13.2.5
* Build date: Dec 3, 2013
*
* Copyright (c) 2012 - 2013 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: http://chartjs.devexpress.com/EULA
*/

"use strict";
if (!DevExpress.MOD_VIZ_VECTORMAP) {
    if (!window.DevExpress)
        throw Error('Required module is not referenced: core');
    if (!DevExpress.MOD_VIZ_CORE)
        throw Error('Required module is not referenced: viz-core');
    /*! Module viz-vectormap, file map.js */
    (function(DX, $, undefined) {
        DX.viz.map = {};
        DX.viz.map._tests = {};
        var _Number = window.Number,
            _String = window.String,
            _isFinite = window.isFinite,
            _setTimeout = window.setTimeout,
            _clearTimeout = window.clearTimeout,
            _round = Math.round,
            _abs = Math.abs,
            _max = Math.max,
            _min = Math.min,
            _pow = Math.pow,
            _ln = Math.log,
            _exp = Math.exp,
            _tan = Math.tan,
            _atan = Math.atan,
            _isArray = DX.utils.isArray,
            _isFunction = DX.utils.isFunction,
            _isString = DX.utils.isString,
            _windowResizeCallbacks = DX.utils.windowResizeCallbacks,
            _createResizeHandler = DX.utils.createResizeHandler,
            _getRootOffset = DX.utils.getRootOffset,
            _buildPath = DX.viz.renderers.buildPath,
            _Color = DX.Color,
            _ajax = $.ajax,
            _extend = $.extend;
        var _LN2 = Math.LN2;
        var COMMAND_RESET = 'command-reset',
            COMMAND_MOVE_UP = 'command-move-up',
            COMMAND_MOVE_RIGHT = 'command-move-right',
            COMMAND_MOVE_DOWN = 'command-move-down',
            COMMAND_MOVE_LEFT = 'command-move-left',
            COMMAND_ZOOM_IN = 'command-zoom-in',
            COMMAND_ZOOM_OUT = 'command-zoom-out',
            COMMAND_ZOOM_DRAG = 'command-zoom-drag';
        var DEFAULT_WIDTH = 800,
            DEFAULT_HEIGHT = 400;
        var MIN_ZOOM = 1,
            MAX_ZOOM = 32;
        var TOOLTIP_SHOW_DELAY = 300,
            TOOLTIP_HIDE_DELAY = 300,
            TOOLTIP_TOUCH_SHOW_DELAY = 400,
            TOOLTIP_TOUCH_HIDE_DELAY = 300;
        var SELECTION_MODE_NONE = 'none',
            SELECTION_MODE_SINGLE = 'single',
            SELECTION_MODE_MULTIPLE = 'multiple';
        var FLAG_NO_CALLBACK = 1,
            FLAG_NO_CHECK = 2;
        DX.viz.map.Map = DX.ui.Component.inherit({
            _rendererType: DX.viz.renderers.Renderer,
            _init: function() {
                var self = this;
                self.callBase();
                self._renderer = new self._rendererType;
                self._renderer.recreateCanvas(1, 1);
                self._renderer.draw(self._element().get(0));
                self._themeManager = new self._themeManagerType;
                self._projection = new self._projectionType;
                self._tracker = new self._trackerType;
                self._root = self._renderer.getRoot();
                self._root.applySettings({
                    'class': 'dxm',
                    stroke: 'none',
                    strokeWidth: 0,
                    fill: 'none',
                    align: 'center',
                    cursor: 'default',
                    style: {overflow: 'hidden'}
                });
                self._background = self._renderer.createSimplePath({'class': 'dxm-background'});
                self._tracker.attachRoot(self._root);
                self._tracker.setCallbacks(self, {
                    start: startCallback,
                    move: moveCallback,
                    end: endCallback,
                    wheel: wheelCallback,
                    'hover-on': hoverOnCallback,
                    'hover-off': hoverOffCallback,
                    click: clickCallback,
                    'tooltip-check': checkTooltipCallback,
                    'tooltip-show': showTooltipCallback,
                    'tooltip-move': moveTooltipCallback,
                    'tooltip-hide': hideTooltipCallback
                });
                self._initAreas();
                self._initMarkers();
                self._controlBar = new self._controlBarType({
                    container: self._root,
                    renderer: self._renderer,
                    context: self,
                    resetCallback: controlResetCallback,
                    moveCallback: controlMoveCallback,
                    zoomCallback: controlZoomCallback
                });
                self._tooltip = new self._tooltipType({
                    container: self._root,
                    renderer: self._renderer
                });
                self._legend = new self._legendType({
                    container: self._root,
                    renderer: self._renderer,
                    themeManager: self._themeManager
                });
                self._initResizing();
                self._debug_renderer = self._renderer;
                self._debug_themeManager = self._themeManager;
                self._debug_projection = self._projection;
                self._debug_tracker = self._tracker;
                self._debug_controlBar = self._controlBar;
                self._debug_tooltip = self._tooltip;
                self._debug_legend = self._legend
            },
            _initAreas: function() {
                var self = this;
                self._areasGroup = self._renderer.createGroup({'class': 'dxm-areas'});
                self._areasCancelLock = 0;
                self._tracker.attachGroup('areas', self._areasGroup)
            },
            _initMarkers: function() {
                var self = this,
                    options = _extend({}, self.option('marker'));
                self._markersGroup = self._renderer.createGroup({'class': 'dxm-markers'});
                self._markerShapesGroup = self._renderer.createGroup();
                self._markerTextsGroup = self._renderer.createGroup({'class': 'dxm-marker-texts'});
                self._markerCoversGroup = self._renderer.createGroup({
                    stroke: 'none',
                    strokeWidth: 0,
                    fill: '#000000',
                    opacity: 0.0001
                });
                self._markerShadowFilter = self._renderer.createFilter('shadow').applySettings({
                    id: 'shadow-filter',
                    x: '-40%',
                    y: '-40%',
                    width: '180%',
                    height: '200%',
                    color: '#000000',
                    opacity: 0.2,
                    dx: 0,
                    dy: 1,
                    blur: 1
                }).append();
                self._markersCancelLock = 0;
                self._tracker.attachGroup('markers', self._markersGroup)
            },
            _initResizing: function() {
                var self = this;
                self._resizeHandler = _createResizeHandler(function() {
                    self._resize()
                });
                self._resizeHandler.dispose = function() {
                    self = null;
                    return this
                };
                _windowResizeCallbacks.add(self._resizeHandler)
            },
            _dispose: function() {
                var self = this;
                self.callBase();
                delete self._root;
                delete self._background;
                self._themeManager.dispose() && delete self._themeManager;
                self._tracker.detachRoot();
                self._disposeAreas();
                self._disposeMarkers();
                self._controlBar.dispose() && delete self._controlBar;
                self._tooltip.dispose() && delete self._tooltip;
                self._legend.dispose() && delete self._legend;
                self._renderer.dispose();
                delete self._renderer;
                delete self._projection;
                self._tracker.dispose() && delete self._tracker;
                delete self._readyCallback;
                self._disposeResizing();
                self._remoteDataCache = null;
                delete self._debug_renderer;
                delete self._debug_themeManager;
                delete self._debug_projection;
                delete self._debug_tracker;
                delete self._debug_controlBar;
                delete self._debug_tooltip;
                delete self._debug_legend
            },
            _disposeAreas: function() {
                var self = this;
                self._areasGroup = self._areasInfo = self._areasDataItems = null;
                self._tracker.detachGroup('areas')
            },
            _disposeMarkers: function() {
                var self = this;
                self._markersGroup.clear();
                self._markerShadowFilter.dispose();
                self._markersGroup = self._markerShapesGroup = self._markerTextsGroup = self._markerCoversGroup = self._markerShadowFilter = self._markersDataItems = null;
                self._tracker.detachGroup('markers')
            },
            _disposeResizing: function() {
                var self = this;
                _windowResizeCallbacks.remove(self._resizeHandler);
                self._resizeHandler.stop().dispose() && delete self._resizeHandler
            },
            _adjustSize: function() {
                var self = this,
                    size = self.option('size') || {},
                    width = size.width >= 0 ? _Number(size.width) : self._element().width(),
                    height = size.height >= 0 ? _Number(size.height) : self._element().height();
                width === 0 && _Number(size.width) !== 0 && (width = DEFAULT_WIDTH);
                height === 0 && _Number(size.height) !== 0 && (height = DEFAULT_HEIGHT);
                var needResize = self._width !== width || self._height !== height;
                if (needResize) {
                    self._renderer.resize(width, height);
                    self._projection.setSize(width, height);
                    self._applyTransform();
                    self._tooltip.setSize(width, height);
                    self._legend.setSize(width, height);
                    self._background.applySettings({d: _buildPath([0, 0, width, 0, width, height, 0, height])});
                    self._width = width;
                    self._height = height
                }
                return needResize
            },
            _clean: function() {
                var self = this;
                self._themeManager.reset();
                self._background.detach();
                self._cleanAreas();
                self._cleanMarkers();
                self._controlBar.clean();
                self._legend.clean();
                self._tooltip.clean();
                self._tracker.clean()
            },
            _render: function() {
                var self = this;
                self._projection.setBounds(self.option('bounds')).setZoom(self.option('zoomFactor')).setCenter(self.option('center'));
                self._adjustSize();
                self._themeManager.setTheme(self.option('theme'));
                self._tooltip.setOptions(self._themeManager.getTooltipSettings(self.option('tooltip')));
                self._legend.setOptions(self._themeManager.getLegendSettings(self.option('legend')));
                self._tracker.setOptions(self._getTrackerSettings());
                self._controlBar.setZoom(self._projection.getZoom()).setOptions(self._themeManager.getControlBarSettings(self.option('controlBar')));
                _isFunction(self._readyCallback = self.option('ready')) || (self._readyCallback = null);
                self._applyTransform();
                self._background.applySettings(self._themeManager.getBackgroundSettings(self.option('background')));
                self._background.append(self._root);
                self._renderAreas();
                self._renderMarkers();
                self._controlBar.render();
                self._legend.render();
                self._tooltip.render();
                self._tracker.render();
                self._contentReady = true;
                self._raiseReady()
            },
            _getTrackerSettings: function() {
                var interaction = this.option('interaction'),
                    settings = {};
                if (interaction !== undefined && !interaction)
                    settings.enabled = false;
                else {
                    interaction = interaction || {};
                    settings.enabled = true;
                    settings.touchEnabled = interaction.touchEnabled !== undefined ? !!interaction.touchEnabled : true;
                    settings.wheelEnabled = interaction.wheelEnabled !== undefined ? !!interaction.wheelEnabled : true;
                    settings.tooltipEnabled = this._tooltip.enabled()
                }
                return settings
            },
            _optionChanged: function(name, value) {
                switch (name) {
                    case'zoomFactor':
                        this._updateZoomFactor(value);
                        break;
                    case'center':
                        this._updateCenter(value);
                        break;
                    default:
                        this._invalidate();
                        break
                }
            },
            _updateZoomFactor: function(zoomFactor) {
                var self = this,
                    zoom = self._projection.getZoom();
                self._projection.setZoom(zoomFactor);
                if (zoom !== self._projection.getZoom()) {
                    self._controlBar.setZoom(self._projection.getZoom());
                    self._applyTransform(true)
                }
            },
            _updateCenter: function(center) {
                var self = this;
                self._projection.setCenter(center);
                self._applyTransform()
            },
            _resize: function() {
                var self = this;
                if (self._adjustSize()) {
                    self._applyTransform();
                    self._parseAreas();
                    self._redrawAreas();
                    self._parseMarkers();
                    self._redrawMarkers();
                    self._debug_resized && self._debug_resized()
                }
            },
            _raiseReady: function() {
                var self = this;
                if (self._areasReady && self._markersReady && self._contentReady) {
                    self._areasReady = self._markersReady = self._contentReady = null;
                    self._readyCallback && self._readyCallback();
                    self._debug_ready && self._debug_ready()
                }
            },
            _loadData: function(dataSource, callback) {
                if (_isArray(dataSource))
                    callback(dataSource);
                else if (_isString(dataSource)) {
                    var cache = this._remoteDataCache = this._remoteDataCache || {};
                    if (cache[dataSource])
                        callback(cache[dataSource]);
                    else
                        _ajax({
                            url: dataSource,
                            dataType: 'json',
                            type: 'GET',
                            success: function(data, status, xhr) {
                                cache[dataSource] = _isArray(data) ? data : [];
                                callback(cache[dataSource])
                            },
                            error: function(xhr, status, error) {
                                callback([], error)
                            }
                        })
                }
                else
                    callback([])
            },
            _cleanAreas: function() {
                var self = this;
                self._areaCustomizeCallback = self._areaClickCallback = self._areaSelectionChangedCallback = self._selectedAreas = null;
                self._areasGroup.detach();
                self._areasGroup.clear();
                var areasInfo = self._areasInfo;
                if (areasInfo) {
                    var i = 0,
                        ii = areasInfo.length;
                    for (; i < ii; ++i)
                        areasInfo[i].proxy._dispose();
                    self._areasInfo = null
                }
                else
                    ++self._areasCancelLock
            },
            _renderAreas: function() {
                var self = this,
                    options = self.option('areaSettings') || {},
                    dataSource = self.option('mapData');
                self._themeManager.initCommonAreaSettings(options);
                self._areaCustomizeCallback = _isFunction(options.customize) ? options.customize : null;
                self._areaClickCallback = _isFunction(options.click) ? options.click : null;
                self._areaSelectionChangedCallback = _isFunction(options.selectionChanged) ? options.selectionChanged : null;
                self._areaHoverEnabled = 'hoverEnabled' in options ? !!options.hoverEnabled : true;
                var selectionMode = _String(options.selectionMode).toLowerCase();
                self._areaSelectionMode = selectionMode === SELECTION_MODE_NONE || selectionMode === SELECTION_MODE_SINGLE || selectionMode === SELECTION_MODE_MULTIPLE ? selectionMode : SELECTION_MODE_SINGLE;
                self._selectedAreas = self._areaSelectionMode === SELECTION_MODE_MULTIPLE ? {} : null;
                self._areasGroup.append(self._root);
                self._loadData(dataSource, function(dataItems) {
                    self._areasDataItems = dataItems;
                    self._areasCancelLock === 0 ? self._createAreas() : --self._areasCancelLock;
                    self = null
                })
            },
            _parseAreas: function() {
                var areasInfo = this._areasInfo,
                    dataItems = this._areasDataItems,
                    projection = this._projection,
                    i = 0,
                    ii = dataItems.length;
                for (; i < ii; ++i)
                    (areasInfo[i] = areasInfo[i] || {}).coordinates = projection.parseAreaData(dataItems[i].coordinates)
            },
            _createAreas: function() {
                var self = this,
                    areasInfo = self._areasInfo = [];
                self._parseAreas();
                var group = self._areasGroup,
                    renderer = self._renderer,
                    themeManager = self._themeManager,
                    projection = self._projection,
                    dataItems = self._areasDataItems,
                    customizeCallback = self._areaCustomizeCallback,
                    areaInfo,
                    dataItem,
                    i = 0,
                    ii = areasInfo.length,
                    selectedList = [],
                    element,
                    path;
                group.applySettings(themeManager.getCommonAreaSettings().common);
                for (; i < ii; ++i) {
                    areaInfo = areasInfo[i];
                    dataItem = dataItems[i];
                    element = null;
                    areaInfo.attributes = dataItem.attributes = dataItem.attributes || {};
                    areaInfo.options = (customizeCallback ? customizeCallback.call(dataItem, dataItem) : null) || {};
                    path = projection.projectArea(areaInfo.coordinates);
                    areaInfo.styles = themeManager.getAreaSettings(areaInfo.options);
                    areaInfo.element = element = renderer.createSimplePath({d: path});
                    element.applySettings(areaInfo.styles.normal);
                    areaInfo.index = i;
                    setElementData(element.$element, i);
                    areaInfo.options.isSelected && selectedList.push(areaInfo);
                    areaInfo.proxy = new ElementProxy(self, areaInfo, {
                        type: 'area',
                        setSelectionCallback: self._setAreaSelection
                    });
                    element.append(group)
                }
                ii = self._areaSelectionMode !== SELECTION_MODE_NONE ? selectedList.length : 0;
                i = ii > 0 && self._areaSelectionMode === SELECTION_MODE_SINGLE ? ii - 1 : 0;
                for (; i < ii; ++i)
                    self._setAreaSelection(selectedList[i], true, FLAG_NO_CALLBACK);
                self._areasReady = true;
                self._raiseReady()
            },
            _redrawAreas: function() {
                var areasInfo = this._areasInfo,
                    projection = this._projection,
                    areaInfo,
                    i = 0,
                    ii = areasInfo.length;
                for (; i < ii; ++i) {
                    areaInfo = areasInfo[i];
                    areaInfo.element.applySettings({d: projection.projectArea(areaInfo.coordinates)})
                }
                this._DEBUG_areasRedrawn && this._DEBUG_areasRedrawn()
            },
            _cleanMarkers: function() {
                var self = this;
                self._markerCustomizeCallback = self._markerClickCallback = self._markerSelectionChangedCallback = self._selectedMarkers = null;
                self._markersGroup.detach();
                self._markerShapesGroup.detach();
                self._markerTextsGroup.detach();
                self._markerCoversGroup.detach();
                self._markerShapesGroup.clear();
                self._markerTextsGroup.clear();
                self._markerCoversGroup.clear();
                var markersInfo = self._markersInfo;
                if (markersInfo) {
                    var i = 0,
                        ii = markersInfo.length;
                    for (; i < ii; ++i)
                        markersInfo[i].proxy._dispose();
                    self._markersInfo = null
                }
                else
                    ++self._markersCancelLock
            },
            _renderMarkers: function() {
                var self = this,
                    options = self.option('markerSettings') || {},
                    dataSource = self.option('markers');
                self._themeManager.initCommonMarkerSettings(options);
                self._markerCustomizeCallback = _isFunction(options.customize) ? options.customize : null;
                self._markerClickCallback = _isFunction(options.click) ? options.click : null;
                self._markerSelectionChangedCallback = _isFunction(options.selectionChanged) ? options.selectionChanged : null;
                self._markerHoverEnabled = 'hoverEnabled' in options ? !!options.hoverEnabled : true;
                var selectionMode = _String(options.selectionMode).toLowerCase();
                self._markerSelectionMode = selectionMode === SELECTION_MODE_NONE || selectionMode === SELECTION_MODE_SINGLE || selectionMode === SELECTION_MODE_MULTIPLE ? selectionMode : SELECTION_MODE_SINGLE;
                self._selectedMarkers = self._markerSelectionMode === SELECTION_MODE_MULTIPLE ? {} : null;
                self._markersGroup.append(self._root);
                self._loadData(dataSource, function(dataItems) {
                    self._markersDataItems = dataItems;
                    self._markersCancelLock === 0 ? self._createMarkers() : --self._markersCancelLock;
                    self = null
                })
            },
            _parseMarkers: function() {
                var markersInfo = this._markersInfo,
                    dataItems = this._markersDataItems,
                    projection = this._projection,
                    i = 0,
                    ii = dataItems.length;
                for (; i < ii; ++i)
                    (markersInfo[i] = markersInfo[i] || {}).coordinates = projection.parsePointData(dataItems[i].coordinates)
            },
            _createMarkers: function() {
                var self = this,
                    markersInfo = self._markersInfo = [];
                self._parseMarkers();
                var rootGroup = self._markersGroup,
                    shapesGroup = self._markerShapesGroup,
                    textsGroup = self._markerTextsGroup,
                    coversGroup = self._markerCoversGroup,
                    renderer = self._renderer,
                    themeManager = self._themeManager,
                    projection = self._projection,
                    dataItems = self._markersDataItems,
                    customizeCallback = self._markerCustomizeCallback,
                    markerInfo,
                    dataItem,
                    i = 0,
                    ii = markersInfo.length,
                    selectedList = [],
                    shape,
                    text,
                    cover;
                shapesGroup.applySettings(themeManager.getCommonMarkerSettings().common);
                textsGroup.applySettings(themeManager.getCommonMarkerSettings().text);
                themeManager.getCommonMarkerSettings().normal.filter = self._markerShadowFilter.ref;
                for (; i < ii; ++i) {
                    markerInfo = markersInfo[i];
                    dataItem = dataItems[i];
                    markerInfo.attributes = dataItem.attributes = dataItem.attributes || {};
                    markerInfo.options = (customizeCallback ? customizeCallback.call(dataItem, dataItem) : null) || {};
                    markerInfo.styles = themeManager.getMarkerSettings(markerInfo.options);
                    shape = text = cover = null;
                    markerInfo.location = projection.projectPoint(markerInfo.coordinates);
                    markerInfo.index = i;
                    shape = renderer.createCircle(markerInfo.location.x, markerInfo.location.y, markerInfo.styles.size, markerInfo.styles.normal).append(shapesGroup);
                    setElementData(shape.$element, i);
                    if (markerInfo.options.text) {
                        text = renderer.createText(markerInfo.options.text, markerInfo.location.x, markerInfo.location.y).append(textsGroup);
                        cover = renderer.createRect().append(coversGroup);
                        setElementData(cover.$element, i)
                    }
                    markerInfo.shape = shape;
                    markerInfo.text = text;
                    markerInfo.cover = cover;
                    markerInfo.options.isSelected && selectedList.push(markerInfo);
                    markerInfo.proxy = new ElementProxy(self, markerInfo, {
                        type: 'marker',
                        setSelectionCallback: self._setMarkerSelection
                    })
                }
                shapesGroup.append(rootGroup);
                textsGroup.append(rootGroup);
                coversGroup.append(rootGroup);
                self._arrangeMarkers();
                ii = self._markerSelectionMode !== SELECTION_MODE_NONE ? selectedList.length : 0;
                i = ii > 0 && self._markerSelectionMode === SELECTION_MODE_SINGLE ? ii - 1 : 0;
                for (; i < ii; ++i)
                    self._setMarkerSelection(selectedList[i], true, FLAG_NO_CALLBACK);
                self._markersReady = true;
                self._raiseReady()
            },
            _arrangeMarkers: function() {
                var self = this,
                    markersInfo = self._markersInfo,
                    i,
                    ii = markersInfo.length,
                    markerInfo,
                    measureList = [],
                    measureItem,
                    textBox,
                    x,
                    y;
                for (i = 0; i < ii; ++i) {
                    markerInfo = markersInfo[i];
                    measureItem = null;
                    if (markerInfo.text) {
                        textBox = markerInfo.text.getBBox();
                        x = markerInfo.location.x;
                        y = markerInfo.location.y;
                        markerInfo.textOffsetX = _round(x - textBox.x + markerInfo.styles.size) + 2;
                        markerInfo.textOffsetY = _round(y - textBox.y - textBox.height / 2) - 1;
                        markerInfo.trackerOffsetX = markerInfo.textOffsetX + textBox.x - x - 1;
                        markerInfo.trackerOffsetY = markerInfo.textOffsetY + textBox.y - y - 1;
                        markerInfo.trackerWidth = textBox.width + 2;
                        markerInfo.trackerHeight = textBox.height + 2;
                        measureItem = {
                            text: {
                                x: x + markerInfo.textOffsetX,
                                y: y + markerInfo.textOffsetY
                            },
                            cover: {
                                x: x + markerInfo.trackerOffsetX,
                                y: y + markerInfo.trackerOffsetY,
                                width: markerInfo.trackerWidth,
                                height: markerInfo.trackerHeight
                            }
                        }
                    }
                    measureList.push(measureItem)
                }
                self._markerTextsGroup.detach();
                self._markerCoversGroup.detach();
                for (i = 0; i < ii; ++i) {
                    markerInfo = markersInfo[i];
                    if (markerInfo.text) {
                        measureItem = measureList[i];
                        markerInfo.text.applySettings(measureItem.text);
                        markerInfo.cover.applySettings(measureItem.cover)
                    }
                }
                self._markerTextsGroup.append(self._markersGroup);
                self._markerCoversGroup.append(self._markersGroup)
            },
            _redrawMarkers: function() {
                var markersInfo = this._markersInfo,
                    projection = this._projection,
                    markerInfo,
                    i = 0,
                    ii = markersInfo.length,
                    x,
                    y;
                for (; i < ii; ++i) {
                    markerInfo = markersInfo[i];
                    markerInfo.location = projection.projectPoint(markerInfo.coordinates);
                    x = markerInfo.location.x;
                    y = markerInfo.location.y;
                    markerInfo.shape.applySettings({
                        cx: x,
                        cy: y
                    });
                    markerInfo.extra && markerInfo.extra.applySettings({
                        cx: x,
                        cy: y
                    });
                    if (markerInfo.options.text) {
                        markerInfo.text.applySettings({
                            x: x + markerInfo.textOffsetX,
                            y: y + markerInfo.textOffsetY
                        });
                        markerInfo.cover.applySettings({
                            x: x + markerInfo.trackerOffsetX,
                            y: y + markerInfo.trackerOffsetY
                        })
                    }
                }
                this._DEBUG_markersRedrawn && this._DEBUG_markersRedrawn()
            },
            _applyTransform: function(redraw) {
                var self = this,
                    transform = self._projection.getTransform();
                self._areasGroup.applySettings(transform);
                self._markersGroup.applySettings(transform);
                if (redraw) {
                    self._redrawAreas();
                    self._redrawMarkers()
                }
            },
            _setAreaHover: function(info, state) {
                if (!this._areaHoverEnabled)
                    return;
                state && DX.utils.debug.assert(!info.hovered, 'Area is already hovered');
                !state && DX.utils.debug.assert(info.hovered, 'Area is not hovered');
                info.hovered = !!state;
                if (!info.selected) {
                    info.element.applySettings(info.styles[state ? 'hovered' : 'normal']);
                    state ? info.element.toForeground() : info.element.toBackground()
                }
            },
            _setMarkerHover: function(info, state) {
                if (!this._markerHoverEnabled)
                    return;
                state && DX.utils.debug.assert(!info.hovered, 'Marker is already hovered');
                !state && DX.utils.debug.assert(info.hovered, 'Marker is not hovered');
                info.hovered = !!state;
                var extra = info.extra;
                if (!info.selected)
                    if (info.hovered) {
                        if (!extra) {
                            extra = info.extra = this._renderer.createCircle(info.location.x, info.location.y, info.styles.extraSize, info.styles.extra);
                            setElementData(extra.$element, info.index)
                        }
                        info.shape.applySettings(info.styles.hovered);
                        extra.insertBefore(info.shape)
                    }
                    else {
                        info.shape.applySettings(info.styles.normal);
                        extra.detach();
                        extra.dispose();
                        info.extra = null
                    }
            },
            _setAreaSelection: function(info, state, flag) {
                state && DX.utils.debug.assert(!info.selected, 'Area is already selected');
                !state && DX.utils.debug.assert(info.selected, 'Area is not selected');
                var self = this;
                if (self._areaSelectionMode === SELECTION_MODE_NONE)
                    return;
                info.selected = !!state;
                info.element.applySettings(info.styles[state ? 'selected' : info.hovered ? 'hovered' : 'normal']);
                if (info.selected)
                    !info.hovered && info.element.toForeground();
                else
                    !info.hovered && info.element.toBackground();
                if (!(flag & FLAG_NO_CALLBACK) && self._areaSelectionChangedCallback)
                    self._areaSelectionChangedCallback.call(info.proxy, info.proxy);
                if (!(flag & FLAG_NO_CHECK))
                    if (self._areaSelectionMode === SELECTION_MODE_SINGLE) {
                        info.selected && self._selectedAreas && self._setAreaSelection(self._selectedAreas, false, flag | FLAG_NO_CHECK);
                        self._selectedAreas = info.selected ? info : null
                    }
                    else
                        info.selected ? self._selectedAreas[info.index] = info : delete self._selectedAreas[info.index]
            },
            _setMarkerSelection: function(info, state, flag) {
                state && DX.utils.debug.assert(!info.selected, 'Marker is already selected');
                !state && DX.utils.debug.assert(info.selected, 'Marker is not selected');
                var self = this;
                if (self._markerSelectionMode === SELECTION_MODE_NONE)
                    return;
                info.selected = !!state;
                var extra = info.extra;
                if (info.selected) {
                    if (!extra) {
                        extra = info.extra = self._renderer.createCircle(info.location.x, info.location.y, info.styles.extraSize, info.styles.extra);
                        setElementData(extra.$element, info.index)
                    }
                    info.shape.applySettings(info.styles.selected);
                    extra.insertBefore(info.shape)
                }
                else if (info.hovered)
                    info.shape.applySettings(info.styles.hovered);
                else {
                    info.shape.applySettings(info.styles.normal);
                    extra.detach();
                    extra.dispose();
                    info.extra = null
                }
                if (!(flag & FLAG_NO_CALLBACK) && self._markerSelectionChangedCallback)
                    self._markerSelectionChangedCallback.call(info.proxy, info.proxy);
                if (!(flag & FLAG_NO_CHECK))
                    if (self._markerSelectionMode === SELECTION_MODE_SINGLE) {
                        info.selected && self._selectedMarkers && self._setMarkerSelection(self._selectedMarkers, false, flag | FLAG_NO_CHECK);
                        self._selectedMarkers = info.selected ? info : null
                    }
                    else
                        info.selected ? self._selectedMarkers[info.index] = info : delete self._selectedMarkers[info.index]
            },
            render: function(mode) {
                if (mode === 'resize')
                    this._resize();
                else
                    this._refresh();
                return this
            },
            getAreas: function() {
                var infos = this._areasInfo,
                    i = 0,
                    ii = infos.length,
                    list = [];
                for (; i < ii; ++i)
                    list.push(infos[i].proxy);
                return list
            },
            getMarkers: function() {
                var infos = this._markersInfo,
                    i = 0,
                    ii = infos.length,
                    list = [];
                for (; i < ii; ++i)
                    list.push(infos[i].proxy);
                return list
            },
            clearAreaSelection: function() {
                var self = this,
                    selectedAreas = self._selectedAreas;
                if (self._areaSelectionMode === SELECTION_MODE_SINGLE)
                    selectedAreas && self._setAreaSelection(selectedAreas, false);
                else if (self._areaSelectionMode === SELECTION_MODE_MULTIPLE) {
                    var key;
                    for (key in selectedAreas)
                        self._setAreaSelection(selectedAreas[key], false)
                }
                return self
            },
            clearMarkerSelection: function() {
                var self = this,
                    selectedMarkers = self._selectedMarkers;
                if (self._markerSelectionMode === SELECTION_MODE_SINGLE)
                    selectedMarkers && self._setMarkerSelection(selectedMarkers, false);
                else if (self._markerSelectionMode === SELECTION_MODE_MULTIPLE) {
                    var key;
                    for (key in selectedMarkers)
                        self._setMarkerSelection(selectedMarkers[key], false)
                }
                return self
            },
            clearSelection: function() {
                return this.clearAreaSelection().clearMarkerSelection()
            }
        });
        function setElementData($element, index) {
            $element.data('index', index)
        }
        function getElementData($element) {
            return $element.data('index')
        }
        function controlResetCallback() {
            var zoom = this._projection.getZoom();
            this._projection.setCenter(null).setZoom(null);
            this._applyTransform(zoom !== this._projection.getZoom())
        }
        function controlMoveCallback(dx, dy) {
            this._projection.moveCenter(dx, dy);
            this._applyTransform()
        }
        function controlZoomCallback(zoom) {
            this._projection.setZoom(zoom);
            this._applyTransform(true)
        }
        function startCallback(arg) {
            arg.data = getElementData(arg.$target);
            this._controlBar.processStart(arg)
        }
        function moveCallback(arg) {
            arg.data = getElementData(arg.$target);
            this._controlBar.processMove(arg)
        }
        function endCallback(arg) {
            arg.data = getElementData(arg.$target);
            this._controlBar.processEnd(arg)
        }
        function wheelCallback(arg) {
            this._controlBar.processWheel(arg)
        }
        function hoverOnCallback(arg) {
            var index = getElementData(arg.$target);
            switch (arg.category) {
                case'areas':
                    this._setAreaHover(this._areasInfo[index], true);
                    break;
                case'markers':
                    this._setMarkerHover(this._markersInfo[index], true);
                    break;
                default:
                    DX.utils.debug.assert(false, 'Unknown hover-on category!');
                    break
            }
        }
        function hoverOffCallback(arg) {
            var index = getElementData(arg.$target);
            switch (arg.category) {
                case'areas':
                    this._setAreaHover(this._areasInfo[index], false);
                    break;
                case'markers':
                    this._setMarkerHover(this._markersInfo[index], false);
                    break;
                default:
                    DX.utils.debug.assert(false, 'Unknown hover-off category!');
                    break
            }
        }
        function clickCallback(arg) {
            var map = this,
                index = getElementData(arg.$target),
                callback,
                proxy;
            switch (arg.category) {
                case'areas':
                    callback = map._areaClickCallback;
                    proxy = map._areasInfo[index].proxy;
                    break;
                case'markers':
                    callback = map._markerClickCallback;
                    proxy = map._markersInfo[index].proxy;
                    break;
                default:
                    DX.utils.debug.assert(false, 'Unknown click category!');
                    break
            }
            callback && callback.call(proxy, proxy)
        }
        function checkTooltipCallback(arg) {
            var index = getElementData(arg.$target),
                info;
            switch (arg.category) {
                case'areas':
                    info = this._areasInfo[index];
                    break;
                case'markers':
                    info = this._markersInfo[index];
                    break;
                default:
                    DX.utils.debug.assert(false, 'Unknown tooltip-check category!');
                    break
            }
            return this._tooltip.check(info.proxy)
        }
        function showTooltipCallback() {
            this._tooltip.show()
        }
        function moveTooltipCallback(arg) {
            var offset = _getRootOffset(this._renderer);
            this._tooltip.move({
                x: arg.x - offset.left,
                y: arg.y - offset.top
            })
        }
        function hideTooltipCallback() {
            this._tooltip.hide()
        }
        var ThemeManager = DX.Class.inherit({
                dispose: function() {
                    var self = this;
                    self._inner && self._inner.dispose();
                    self._inner = self._theme = null;
                    return self
                },
                setTheme: function(theme) {
                    var self = this;
                    if (!self._inner || self._tag !== theme) {
                        self._tag = theme;
                        self._inner && self._inner.dispose();
                        self._inner = new DX.viz.core.BaseThemeManager(theme, 'map');
                        self._theme = self._inner.theme;
                        self._inner.initializeFont(self._theme.marker.font);
                        self._inner.initializeFont(self._theme.tooltip.font);
                        self._inner.initializeFont(self._theme.legend.font)
                    }
                    return self
                },
                reset: function() {
                    this._commonAreaSettings = this._commonMarkerSettings = this._palette = null;
                    return this
                },
                getBackgroundSettings: function(options) {
                    var theme = this._theme.background,
                        merged = _extend({}, theme, options);
                    return {
                            strokeWidth: theme.borderWidth,
                            stroke: merged.borderColor,
                            fill: merged.color
                        }
                },
                initCommonAreaSettings: function(options) {
                    var theme = this._theme.area,
                        merged = _extend({}, theme, options);
                    this._commonAreaSettings = {
                        common: {
                            strokeWidth: theme.borderWidth,
                            stroke: merged.borderColor,
                            fill: merged.color
                        },
                        normal: {
                            'class': null,
                            strokeWidth: null,
                            stroke: null,
                            fill: null
                        },
                        hovered: {
                            'class': merged.hoveredClass,
                            strokeWidth: theme.hoveredBorderWidth,
                            stroke: merged.hoveredBorderColor,
                            fill: merged.hoveredColor
                        },
                        selected: {
                            'class': merged.selectedClass,
                            strokeWidth: theme.selectedBorderWidth,
                            stroke: merged.selectedBorderColor,
                            fill: merged.selectedColor
                        }
                    };
                    this._palette = new ContinuousPalette(merged.palette, merged.paletteSize);
                    this._DEBUG_palette = this._palette;
                    return this
                },
                getCommonAreaSettings: function() {
                    return this._commonAreaSettings
                },
                getAreaSettings: function(options) {
                    options = options || {};
                    if (options.color === undefined && options.paletteIndex >= 0)
                        options.color = this._palette.getColor(options.paletteIndex) || undefined;
                    var settings = this._commonAreaSettings;
                    return {
                            normal: getPartialSettings(settings.normal, options, AREA_PARTIAL_SETTINGS),
                            hovered: getPartialSettings(settings.hovered, options, HOVERED_AREA_PARTIAL_SETTINGS),
                            selected: getPartialSettings(settings.selected, options, SELECTED_AREA_PARTIAL_SETTINGS)
                        }
                },
                initCommonMarkerSettings: function(options) {
                    var theme = this._theme.marker,
                        merged = _extend({}, theme, options);
                    this._commonMarkerSettings = {
                        size: merged.size,
                        extraSize: merged.extraSize,
                        common: {
                            strokeWidth: theme.borderWidth,
                            stroke: merged.borderColor,
                            fill: merged.color
                        },
                        text: {
                            strokeWidth: 0,
                            stroke: 'none',
                            fill: 'none',
                            font: _extend({}, theme.font, merged.font)
                        },
                        normal: {
                            'class': null,
                            stroke: null,
                            fill: null
                        },
                        hovered: {
                            'class': merged.hoveredClass,
                            stroke: merged.hoveredBorderColor,
                            fill: merged.hoveredColor
                        },
                        selected: {
                            'class': merged.selectedClass,
                            stroke: merged.selectedBorderColor,
                            fill: merged.selectedColor
                        },
                        extra: {
                            strokeWidth: 0,
                            stroke: 'none',
                            fill: theme.extraColor,
                            opacity: theme.extraOpacity
                        }
                    };
                    return this
                },
                getCommonMarkerSettings: function() {
                    return this._commonMarkerSettings
                },
                getMarkerSettings: function(options) {
                    options = options || {};
                    var settings = this._commonMarkerSettings;
                    return {
                            size: options.size !== undefined ? options.size : settings.size,
                            extraSize: options.extraSize !== undefined ? options.extraSize : settings.extraSize,
                            normal: getPartialSettings(settings.normal, options, MARKER_PARTIAL_SETTINGS),
                            hovered: getPartialSettings(settings.hovered, options, HOVERED_MARKER_PARTIAL_SETTINGS),
                            selected: getPartialSettings(settings.selected, options, SELECTED_MARKER_PARTIAL_SETTINGS),
                            extra: settings.extra
                        }
                },
                getControlBarSettings: function(options) {
                    var theme = this._theme.controlBar,
                        merged = _extend({}, theme, options);
                    return _extend({}, options, {shape: {
                                strokeWidth: theme.borderWidth,
                                stroke: merged.borderColor,
                                fill: merged.color
                            }})
                },
                getTooltipSettings: function(options) {
                    var theme = this._theme.tooltip,
                        merged = _extend({}, theme, options);
                    return _extend({}, options, {
                            shape: {
                                strokeWidth: theme.borderWidth,
                                stroke: merged.borderColor,
                                fill: merged.color
                            },
                            text: {
                                strokeWidth: 0,
                                stroke: 'none',
                                fill: 'none',
                                font: _extend({}, theme.font, merged.font)
                            }
                        })
                },
                getLegendSettings: function(options) {
                    var theme = this._theme.legend,
                        merged = _extend({}, theme, options);
                    return _extend({}, options, {
                            background: {
                                strokeWidth: theme.borderWidth,
                                stroke: merged.borderColor,
                                fill: merged.color,
                                opacity: theme.opacity
                            },
                            text: {
                                strokeWidth: 0,
                                stroke: 'none',
                                fill: 'none',
                                align: 'left',
                                font: _extend({}, theme.font, merged.font),
                                'class': 'dxm-legend-text'
                            },
                            metrics: {
                                horizontalIndent: theme.horizontalIndent,
                                verticalIndent: theme.verticalIndent,
                                horizontalPadding: merged.horizontalPadding,
                                verticalPadding: merged.verticalPadding,
                                textIndent: merged.textIndent,
                                itemSize: merged.itemSize,
                                itemSpacing: merged.itemSpacing,
                                maxWidth: merged.maxWidth,
                                maxHeight: merged.maxHeight
                            }
                        })
                },
                getLegendItemSettings: function(item) {
                    var color = item.color;
                    if (color === undefined && item.paletteIndex >= 0)
                        color = this._palette.getColor(item.paletteIndex);
                    return {
                            strokeWidth: 0,
                            stroke: 'none',
                            fill: color
                        }
                }
            });
        var AREA_PARTIAL_SETTINGS = {
                color: 'fill',
                borderColor: 'stroke'
            },
            HOVERED_AREA_PARTIAL_SETTINGS = {
                hoveredColor: 'fill',
                hoveredBorderColor: 'stroke',
                hoveredClass: 'class'
            },
            SELECTED_AREA_PARTIAL_SETTINGS = {
                selectedColor: 'fill',
                selectedBorderColor: 'stroke',
                selectedClass: 'class'
            },
            MARKER_PARTIAL_SETTINGS = {
                color: 'fill',
                borderColor: 'stroke'
            },
            HOVERED_MARKER_PARTIAL_SETTINGS = {
                hoveredColor: 'fill',
                hoveredBorderColor: 'stroke',
                hoveredClass: 'class'
            },
            SELECTED_MARKER_PARTIAL_SETTINGS = {
                selectedColor: 'fill',
                selectedBorderColor: 'stroke',
                selectedClass: 'class'
            };
        function getPartialSettings(common, partial, map) {
            var name,
                count = 0,
                cache = {};
            for (name in map)
                if (partial[name] !== undefined) {
                    ++count;
                    cache[map[name]] = partial[name]
                }
            return count ? _extend({}, common, cache) : common
        }
        var palettes = {
                'default': {
                    start: '#5f8b95',
                    end: '#ba4d51'
                },
                'soft pastel': {
                    start: '#92c7e2',
                    end: '#f2ca84'
                },
                'harmony light': {
                    start: '#a6c567',
                    end: '#fcb65e'
                },
                pastel: {
                    start: '#bb7862',
                    end: '#a4d5c2'
                },
                bright: {
                    start: '#e97f02',
                    end: '#f8ca00'
                },
                soft: {
                    start: '#9ab57e',
                    end: '#e8c267'
                },
                ocean: {
                    start: '#00a7c6',
                    end: '#378a8a'
                },
                vintage: {
                    start: '#f2c0b5',
                    end: '#a85c4c'
                },
                violet: {
                    start: '#d1a1d1',
                    end: '#7b5685'
                }
            };
        function ContinuousPalette(source, size) {
            var palette = source && source.start && source.end ? source : palettes[_String(source).toLowerCase()] || palettes['default'];
            palette = size > 0 ? createPaletteColors(palette.start, palette.end, _Number(size)) : [];
            this.getColor = function(index) {
                return palette[index] || null
            };
            this._DEBUG_source = source;
            this._DEBUG_size = size
        }
        function createPaletteColors(start, end, count) {
            var startColor = new _Color(start),
                endColor = new _Color(end);
            if (count === 1)
                return [startColor.blend(endColor, 0.5).toHex()];
            else {
                var list = [],
                    step = 1 / (count - 1),
                    i,
                    ii = count;
                list.push(0);
                for (i = 1; i < ii - 1; ++i)
                    list.push(step * i);
                list.push(1);
                for (i = 0; i < ii; ++i)
                    list[i] = startColor.blend(endColor, list[i]).toHex();
                return list
            }
        }
        DX.viz.map._tests.ThemeManager = ThemeManager;
        DX.viz.map._tests.ContinuousPalette = ContinuousPalette;
        DX.viz.map._tests.palettes = palettes;
        DX.viz.map.Map.include({_themeManagerType: ThemeManager});
        var DOUBLE_PI = Math.PI * 2,
            HALF_PI = Math.PI / 2,
            QUARTER_PI = Math.PI / 4,
            PI_TO_180 = Math.PI / 180;
        var ASPECT_RATIO = 1,
            MIN_LON = -180,
            MAX_LON = 180,
            MIN_LAT = -90,
            MAX_LAT = 90;
        var Projection = DX.Class.inherit({
                setBounds: function(bounds) {
                    bounds = bounds || {};
                    var self = this;
                    self._minlon = bounds.minLon >= MIN_LON ? _Number(bounds.minLon) : MIN_LON;
                    self._maxlon = bounds.maxLon <= MAX_LON ? _Number(bounds.maxLon) : MAX_LON;
                    self._minlat = bounds.minLat >= MIN_LAT ? _Number(bounds.minLat) : MIN_LAT;
                    self._maxlat = bounds.maxLat <= MAX_LAT ? _Number(bounds.maxLat) : MAX_LAT;
                    return self
                },
                setSize: function(width, height) {
                    var self = this;
                    self._width = width;
                    self._height = height;
                    self._setupBounds();
                    self._adjustZoom();
                    self._adjustCenter();
                    return self
                },
                _setupBounds: function() {
                    var self = this,
                        width = self._width,
                        height = self._height,
                        size = height / width;
                    size = size <= ASPECT_RATIO ? height : width;
                    self._radius = size / DOUBLE_PI;
                    self._x0 = width / 2;
                    self._y0 = height / 2;
                    self._miny = self._y0 - size / 2;
                    self._maxy = self._y0 + size / 2;
                    if (self._maxlon - self._minlon >= 360 && self._maxlat - self._minlat >= 180)
                        return;
                    var coords1 = self._project(self._minlon, self._maxlat),
                        coords2 = self._project(self._maxlon, self._minlat),
                        xratio = width / (coords2.x - coords1.x),
                        yratio = height / (coords2.y - coords1.y),
                        ratio = xratio;
                    if (xratio < yratio) {
                        ratio = xratio;
                        xratio = (coords1.y + coords2.y) / 2;
                        yratio = height / ratio / 2;
                        coords1.y = xratio - yratio;
                        coords2.y = xratio + yratio
                    }
                    else if (xratio > yratio) {
                        ratio = yratio;
                        yratio = (coords1.x + coords2.x) / 2;
                        xratio = width / ratio / 2;
                        coords1.x = yratio - xratio;
                        coords2.x = yratio + xratio
                    }
                    self._x0 = -coords1.x * ratio + width * ratio / 2;
                    self._y0 = -coords1.y * ratio + height * ratio / 2;
                    self._radius *= ratio;
                    size *= ratio;
                    self._miny = self._y0 - size / 2;
                    self._maxy = self._y0 + size / 2
                },
                _project: function(lon, lat, noTruncate) {
                    var self = this,
                        lon_ = lon * PI_TO_180,
                        lat_,
                        x = self._radius * lon_ + self._x0,
                        y;
                    if (lat <= MIN_LAT)
                        y = self._maxy;
                    else if (lat >= MAX_LAT)
                        y = self._miny;
                    else {
                        lat_ = lat * PI_TO_180;
                        y = self._radius * -_ln(_tan(QUARTER_PI + lat_ / 2)) + self._y0
                    }
                    if (!noTruncate) {
                        y <= self._miny && (y = self._miny);
                        y >= self._maxy && (y = self._maxy)
                    }
                    return {
                            x: x,
                            y: y
                        }
                },
                _invproject: function(x, y) {
                    var self = this,
                        lon = (x - self._x0) / self._radius,
                        lat = 2 * _atan(_exp((self._y0 - y) / self._radius)) - HALF_PI;
                    return {
                            lat: lat / PI_TO_180,
                            lon: lon / PI_TO_180
                        }
                },
                parseAreaData: function(coordinates) {
                    var self = this,
                        i = 0,
                        ii = _isArray(coordinates) ? coordinates.length : 0,
                        area,
                        j,
                        jj,
                        x,
                        y,
                        points,
                        coords,
                        list = [];
                    for (; i < ii; ++i) {
                        area = coordinates[i];
                        j = 0;
                        jj = _isArray(area) ? area.length : 0;
                        if (jj) {
                            points = [];
                            for (; j < jj; ) {
                                coords = self._project(area[j++], area[j++]);
                                points.push(coords.x, coords.y)
                            }
                            list.push(points)
                        }
                    }
                    return list
                },
                parsePointData: function(coordinates) {
                    return this._project(coordinates[0], coordinates[1])
                },
                projectArea: function(data) {
                    var k = 0,
                        kk = data.length,
                        partialData,
                        i,
                        ii,
                        list = [],
                        partialPath,
                        zoom = this._zoom,
                        xzoom = this._xzoom,
                        yzoom = this._yzoom;
                    for (; k < kk; ++k) {
                        partialData = data[k];
                        partialPath = [];
                        for (i = 0, ii = partialData.length; i < ii; i += 2)
                            partialPath.push(zoom * partialData[i] - xzoom, zoom * partialData[i + 1] - yzoom);
                        list.push(_buildPath(partialPath))
                    }
                    return list.join(' ')
                },
                projectPoint: function(data) {
                    return {
                            x: _round(this._zoom * data.x - this._xzoom),
                            y: _round(this._zoom * data.y - this._yzoom)
                        }
                },
                _adjustZoom: function() {
                    var self = this;
                    self._xzoom = self._width * (self._zoom - 1) / 2;
                    self._yzoom = self._height * (self._zoom - 1) / 2
                },
                _adjustCenter: function() {
                    var self = this,
                        center = self._project(self._loncenter, self._latcenter, true);
                    self._dxcenter = (self._x0 - (self._xcenter = center.x)) * self._zoom;
                    self._dycenter = (self._y0 - (self._ycenter = center.y)) * self._zoom
                },
                getZoom: function() {
                    return this._zoom
                },
                setZoom: function(zoom) {
                    var self = this,
                        _zoom = _Number(zoom);
                    _zoom < MIN_ZOOM && (_zoom = MIN_ZOOM);
                    _zoom > MAX_ZOOM && (_zoom = MAX_ZOOM);
                    self._zoom = MIN_ZOOM <= _zoom && _zoom <= MAX_ZOOM ? _zoom : 1;
                    self._adjustZoom();
                    self._adjustCenter();
                    return self
                },
                setCenter: function(center) {
                    center = center || {};
                    this._latcenter = _Number(center.lat) || 0;
                    this._loncenter = _Number(center.lon) || 0;
                    this._adjustCenter();
                    return this
                },
                moveCenter: function(screenDx, screenDy) {
                    var self = this,
                        newx = self._xcenter + screenDx / self._zoom,
                        newy = self._ycenter + screenDy / self._zoom,
                        coords = self._invproject(newx, newy);
                    return self.setCenter(coords)
                },
                getTransform: function() {
                    return {
                            translateX: this._dxcenter,
                            translateY: this._dycenter
                        }
                }
            });
        DX.viz.map._tests.Projection = Projection;
        DX.viz.map.Map.include({_projectionType: Projection});
        var _document = $(window.document),
            _now = $.now,
            _addNamespace = DX.ui.events.addNamespace,
            EVENT_NAMESPACE = 'dxVectorMap',
            EVENT_NAMES = {},
            EVENT_MODE,
            REQUIRED_STYLE_ON,
            REQUIRED_STYLE_OFF,
            isTouchEvent;
        setupEvents();
        function setupEvents() {
            var wnd = window,
                isPointer = wnd.navigator.pointerEnabled,
                isMSPointer = wnd.navigator.msPointerEnabled,
                isTouch = 'ontouchstart' in wnd;
            switch (arguments[0]) {
                case'pointer':
                    isPointer = true;
                    isMSPointer = isTouch = false;
                    break;
                case'MSPointer':
                    isMSPointer = true;
                    isPointer = isTouch = false;
                    break;
                case'touch':
                    isTouch = true;
                    isPointer = isMSPointer = false;
                    break;
                case'mouse':
                    isPointer = isMSPointer = isTouch = false;
                    break
            }
            EVENT_NAMES.start = _addNamespace(isPointer ? 'pointerdown' : isMSPointer ? 'MSPointerDown' : isTouch ? 'touchstart mousedown' : 'mousedown', EVENT_NAMESPACE);
            EVENT_NAMES.move = _addNamespace(isPointer ? 'pointermove' : isMSPointer ? 'MSPointerMove' : isTouch ? 'touchmove mousemove' : 'mousemove', EVENT_NAMESPACE);
            EVENT_NAMES.end = _addNamespace(isPointer ? 'pointerup' : isMSPointer ? 'MSPointerUp' : isTouch ? 'touchend mouseup' : 'mouseup', EVENT_NAMESPACE);
            EVENT_NAMES.over = _addNamespace(isPointer ? 'pointerover' : isMSPointer ? 'MSPointerOver' : 'mouseover', EVENT_NAMESPACE);
            EVENT_NAMES.out = _addNamespace(isPointer ? 'pointerout' : isMSPointer ? 'MSPointerOut' : 'mouseout', EVENT_NAMESPACE);
            EVENT_NAMES.wheel = _addNamespace('mousewheel DOMMouseScroll', EVENT_NAMESPACE);
            if (isPointer) {
                EVENT_MODE = 'pointer';
                REQUIRED_STYLE_ON = {'touch-action': 'none'};
                REQUIRED_STYLE_OFF = {'touch-action': ''};
                isTouchEvent = function(event) {
                    return event.originalEvent.pointerType !== 'mouse'
                }
            }
            else if (isMSPointer) {
                EVENT_MODE = 'MSPointer';
                REQUIRED_STYLE_ON = {'-ms-touch-action': 'none'};
                REQUIRED_STYLE_OFF = {'-ms-touch-action': ''};
                isTouchEvent = function(event) {
                    return event.originalEvent.pointerType !== 4
                }
            }
            else if (isTouch) {
                EVENT_MODE = 'touch';
                REQUIRED_STYLE_ON = {'-webkit-user-select': 'none'};
                REQUIRED_STYLE_OFF = {'-webkit-user-select': ''};
                isTouchEvent = function() {
                    return true
                }
            }
            else {
                EVENT_MODE = 'mouse';
                REQUIRED_STYLE_ON = {};
                REQUIRED_STYLE_OFF = {};
                isTouchEvent = function() {
                    return false
                }
            }
        }
        function getEventCoords(event) {
            var originalEvent = event.originalEvent,
                touch = originalEvent.changedTouches ? originalEvent.changedTouches[0] : {};
            return {
                    x: event.pageX || originalEvent.pageX || touch.pageX,
                    y: event.pageY || originalEvent.pageY || touch.pageY
                }
        }
        var EVENT_START = 'start',
            EVENT_MOVE = 'move',
            EVENT_END = 'end',
            EVENT_WHEEL = 'wheel',
            EVENT_HOVER_ON = 'hover-on',
            EVENT_HOVER_OFF = 'hover-off',
            EVENT_CLICK = 'click',
            EVENT_TOOLTIP_CHECK = 'tooltip-check',
            EVENT_TOOLTIP_SHOW = 'tooltip-show',
            EVENT_TOOLTIP_HIDE = 'tooltip-hide',
            EVENT_TOOLTIP_MOVE = 'tooltip-move';
        var Tracker = DX.Class.inherit({
                ctor: function() {
                    var self = this;
                    self._groups = {};
                    self._createCallbacks();
                    self._resetState()
                },
                dispose: function() {
                    var self = this;
                    DX.utils.debug.assert(!self._root, 'Undetached root!');
                    DX.utils.debug.assert($.map(self._groups, function(item) {
                        return item
                    }).length === 0, 'Undetached groups!');
                    self._dispose();
                    self._groups = self._context = self._callbacks = null;
                    return self
                },
                _resetState: function() {
                    var self = this;
                    _clearTimeout(self._tooltip_showTimeout);
                    _clearTimeout(self._tooltip_hideTimeout);
                    self._moving = self._click_time = self._hover_event = self._tooltip_target = self._tooltip_showTimeout = self._tooltip_hideTimeout = null
                },
                _createCallbacks: function() {
                    var self = this;
                    self._rootEvents = {};
                    self._rootEvents[EVENT_NAMES.start] = function(event) {
                        var isTouch = isTouchEvent(event);
                        if (isTouch && !self._touchEnabled)
                            return;
                        event.preventDefault();
                        self._processStart(event);
                        isTouch && self._processTooltipRootTouchStart(event)
                    };
                    self._documentEventsMoveEnd = {};
                    self._documentEventsMoveEnd[EVENT_NAMES.move] = function(event) {
                        self._processMove(event)
                    };
                    self._documentEventsMoveEnd[EVENT_NAMES.end] = function(event) {
                        self._processEnd(event)
                    };
                    self._rootEvents[EVENT_NAMES.wheel] = function(event) {
                        if (self._wheelEnabled) {
                            event.preventDefault();
                            self._processWheel(event)
                        }
                    };
                    self._groupEvents = {};
                    self._groupEvents[EVENT_NAMES.start] = function(event) {
                        var isTouch = isTouchEvent(event);
                        if (isTouch && !self._touchEnabled)
                            return;
                        self._processClickStart(event);
                        isTouch && self._processTooltipTouchStart(event)
                    };
                    self._groupClickEventsEnd = {};
                    self._groupClickEventsEnd[EVENT_NAMES.end] = function(event) {
                        self._processClickEnd(event)
                    };
                    self._groupEvents[EVENT_NAMES.over] = function(event) {
                        if (isTouchEvent(event))
                            return;
                        self._processHoverOn(event);
                        self._processTooltipMouseOver(event)
                    };
                    self._groupEvents[EVENT_NAMES.out] = function(event) {
                        if (isTouchEvent(event))
                            return;
                        self._processHoverOff(event);
                        self._processTooltipMouseOut(event)
                    };
                    self._groupTooltipEventsMouseMove = {};
                    self._groupTooltipEventsMouseMove[EVENT_NAMES.move] = function(event) {
                        self._processTooltipMouseMove(event)
                    };
                    self._groupTooltipEventsTouchMoveEnd = {};
                    self._groupTooltipEventsTouchMoveEnd[EVENT_NAMES.move] = function(event) {
                        self._processTooltipTouchMove(event)
                    };
                    self._groupTooltipEventsTouchMoveEnd[EVENT_NAMES.end] = function(event) {
                        self._processTooltipTouchEnd(event)
                    };
                    self._showTooltipCallback = function() {
                        self._showTooltipCore()
                    };
                    self._hideTooltipCallback = function() {
                        self._hideTooltipCore()
                    };
                    self._dispose = function() {
                        var self = this;
                        self = self._dispose = self._rootEvents = self._documentEventsMoveEnd = self._groupEvents = self._groupClickEventsEnd = self._groupTooltipEventsMouseMove = self._groupTooltipEventsTouchMoveEnd = self._showTooltipCallback = self._hideTooltipCallback = null
                    }
                },
                _processStart: function(event) {
                    var self = this,
                        coords = getEventCoords(event);
                    self._start_x = self._x = coords.x;
                    self._start_y = self._y = coords.y;
                    self._callbacks[EVENT_START].call(self._context, {
                        $target: $(event.target),
                        x: self._x,
                        y: self._y
                    });
                    _document.off(self._documentEventsMoveEnd).on(self._documentEventsMoveEnd, event.data)
                },
                _processMove: function(event) {
                    var self = this,
                        coords = getEventCoords(event);
                    if (self._moving || _abs(self._start_x - coords.x) > 3 || _abs(self._start_y - coords.y) > 3) {
                        self._moving = true;
                        self._x = coords.x;
                        self._y = coords.y;
                        self._callbacks[EVENT_MOVE].call(self._context, {
                            $target: $(event.target),
                            x: self._x,
                            y: self._y
                        })
                    }
                },
                _processEnd: function(event) {
                    var self = this;
                    _document.off(self._documentEventsMoveEnd);
                    self._callbacks[EVENT_END].call(self._context, {
                        $target: $(event.target),
                        x: self._x,
                        y: self._y
                    });
                    self._moving = self._start_x = self._start_y = self._x = self._y = null
                },
                _processWheel: function(event) {
                    var delta = event.originalEvent.wheelDelta / 120 || event.originalEvent.detail / -3 || 0;
                    this._callbacks[EVENT_WHEEL].call(this._context, {
                        $target: $(event.target),
                        delta: delta
                    })
                },
                _processHoverOn: function(event) {
                    var self = this;
                    if (self._hover_event && self._hover_event.target === event.target)
                        return;
                    self._hover_event && self._callbacks[EVENT_HOVER_OFF].call(self._context, {
                        $target: $(self._hover_event.target),
                        category: self._hover_event.data.category
                    });
                    self._hover_event = event;
                    self._callbacks[EVENT_HOVER_ON].call(self._context, {
                        $target: $(self._hover_event.target),
                        category: self._hover_event.data.category
                    })
                },
                _processHoverOff: function(event) {
                    var self = this;
                    if (getElementData($(event.target)) === undefined)
                        return;
                    self._hover_event && self._callbacks[EVENT_HOVER_OFF].call(self._context, {
                        $target: $(self._hover_event.target),
                        category: self._hover_event.data.category
                    });
                    self._hover_event = null
                },
                _processClickStart: function(event) {
                    this._click_time = _now();
                    event.data.container.off(this._groupClickEventsEnd).on(this._groupClickEventsEnd, event.data)
                },
                _processClickEnd: function(event) {
                    var self = this;
                    if (self._click_time && !self._moving && _now() - self._click_time <= 500)
                        self._callbacks[EVENT_CLICK].call(self._context, {
                            $target: $(event.target),
                            category: event.data.category
                        });
                    self._click_time = null;
                    event.data.container.off(self._groupClickEventsEnd)
                },
                _processTooltipMouseOver: function(event) {
                    var self = this;
                    if (self._tooltipEnabled && self._isTooltipAvailable(event)) {
                        var coords = getEventCoords(event);
                        self._tooltip_x = coords.x;
                        self._tooltip_y = coords.y;
                        event.data.container.off(self._groupTooltipEventsMouseMove).on(self._groupTooltipEventsMouseMove, event.data);
                        self._showTooltip(event, self._tooltip_target ? null : TOOLTIP_SHOW_DELAY)
                    }
                },
                _processTooltipMouseMove: function(event) {
                    var self = this;
                    if (self._isTooltipAvailable(event))
                        if (self._tooltip_target)
                            self._showTooltip(event);
                        else {
                            var coords = getEventCoords(event);
                            if (_abs(self._tooltip_x - coords.x) > 3 || _abs(self._tooltip_y - coords.y) > 3)
                                self._showTooltip(event, TOOLTIP_SHOW_DELAY)
                        }
                    else {
                        event.data.container.off(self._groupTooltipEventsMouseMove);
                        self._hideTooltip(TOOLTIP_HIDE_DELAY)
                    }
                },
                _processTooltipMouseOut: function(event) {
                    if (this._tooltipEnabled) {
                        event.data.container.off(this._groupTooltipEventsMouseMove);
                        this._hideTooltip(TOOLTIP_HIDE_DELAY)
                    }
                },
                _processTooltipTouchStart: function(event) {
                    var self = this;
                    if (self._tooltipEnabled && self._isTooltipAvailable(event)) {
                        self._showTooltip(event, TOOLTIP_TOUCH_SHOW_DELAY);
                        event.data.container.off(self._groupTooltipEventsTouchMoveEnd).on(self._groupTooltipEventsTouchMoveEnd, event.data);
                        self._skipTouchStart = true
                    }
                },
                _processTooltipRootTouchStart: function(event) {
                    if (!this._skipTouchStart)
                        this._hideTooltip(TOOLTIP_TOUCH_HIDE_DELAY);
                    this._skipTouchStart = null
                },
                _processTooltipTouchMove: function(event) {
                    if (this._moving) {
                        this._hideTooltip();
                        event.data.container.off(this._groupTooltipEventsTouchMoveEnd)
                    }
                },
                _processTooltipTouchEnd: function(event) {
                    if (this._tooltip_showTimeout)
                        this._hideTooltip(TOOLTIP_TOUCH_HIDE_DELAY);
                    event.data.container.off(this._groupTooltipEventsTouchMoveEnd)
                },
                _isTooltipAvailable: function(event) {
                    var self = this,
                        result = !self._moving;
                    if (result && (!self._tooltip_event || self._tooltip_event.target !== event.target))
                        result = self._callbacks[EVENT_TOOLTIP_CHECK].call(self._context, {
                            $target: $(event.target),
                            category: event.data.category
                        });
                    return result
                },
                _showTooltip: function(event, delay) {
                    var self = this;
                    _clearTimeout(self._tooltip_hideTimeout);
                    self._tooltip_hideTimeout = null;
                    _clearTimeout(self._tooltip_showTimeout);
                    self._tooltip_event = event;
                    if (delay > 0)
                        self._tooltip_showTimeout = _setTimeout(self._showTooltipCallback, delay);
                    else
                        self._showTooltipCallback()
                },
                _hideTooltip: function(delay) {
                    var self = this;
                    _clearTimeout(self._tooltip_showTimeout);
                    self._tooltip_showTimeout = null;
                    if (delay > 0)
                        self._tooltip_hideTimeout = self._tooltip_hideTimeout || _setTimeout(self._hideTooltipCallback, delay);
                    else {
                        _clearTimeout(self._tooltip_hideTimeout);
                        self._hideTooltipCallback()
                    }
                },
                _showTooltipCore: function() {
                    var self = this,
                        event = self._tooltip_event,
                        coords = getEventCoords(event);
                    if (!self._tooltip_target)
                        self._callbacks[EVENT_TOOLTIP_SHOW].call(self._context, {
                            $target: $(event.target),
                            category: event.data.category
                        });
                    self._tooltip_target = event.target;
                    self._callbacks[EVENT_TOOLTIP_MOVE].call(self._context, {
                        $target: $(self._tooltip_target),
                        category: event.data.category,
                        x: coords.x,
                        y: coords.y
                    });
                    self._tooltip_showTimeout = null
                },
                _hideTooltipCore: function() {
                    var self = this,
                        event = self._tooltip_event;
                    if (self._tooltip_target)
                        self._callbacks[EVENT_TOOLTIP_HIDE].call(self._context, {
                            $target: $(self._tooltip_target),
                            category: event.data.category
                        });
                    self._tooltip_target = self._tooltip_hideTimeout = self._tooltip_event = null
                },
                attachRoot: function(container) {
                    DX.utils.debug.assert(!this._root, 'Root is already attached!');
                    this._root = container;
                    return this
                },
                detachRoot: function() {
                    DX.utils.debug.assert(this._root, 'Root is not attached!');
                    this._root = null;
                    return this
                },
                attachGroup: function(category, container) {
                    DX.utils.debug.assert(!this._groups[category], 'Group category is already attached!');
                    this._groups[category] = container;
                    return this
                },
                detachGroup: function(category) {
                    DX.utils.debug.assert(this._groups[category], 'Group category is not attached!');
                    this._groups[category] = null;
                    return this
                },
                setCallbacks: function(context, callbacks) {
                    this._context = context;
                    this._callbacks = callbacks;
                    return this
                },
                setOptions: function(options) {
                    options = options || {};
                    var self = this;
                    self._enabled = options.enabled;
                    self._touchEnabled = options.touchEnabled;
                    self._wheelEnabled = options.wheelEnabled;
                    self._tooltipEnabled = options.tooltipEnabled;
                    return self
                },
                render: function() {
                    var self = this;
                    if (!self._enabled)
                        return self;
                    if (self._touchEnabled) {
                        if (EVENT_MODE === 'pointer' || EVENT_MODE === 'MSPointer')
                            self._root.on(_addNamespace('MSHoldVisual', EVENT_NAMESPACE), function(event) {
                                event.preventDefault()
                            });
                        self._root.applySettings({style: REQUIRED_STYLE_ON})
                    }
                    self._root.on(self._rootEvents, {container: self._root});
                    var category,
                        group;
                    for (category in self._groups) {
                        group = self._groups[category];
                        group && group.on(self._groupEvents, {
                            category: category,
                            container: group
                        })
                    }
                    return self
                },
                clean: function() {
                    var self = this;
                    if (!self._enabled)
                        return self;
                    if (self._touchEnabled)
                        self._root.applySettings({style: REQUIRED_STYLE_OFF});
                    self._root.off('.' + EVENT_NAMESPACE);
                    _document.off(self._documentEventsMoveEnd);
                    var category,
                        group;
                    for (category in self._groups) {
                        group = self._groups[category];
                        group && group.off('.' + EVENT_NAMESPACE)
                    }
                    self._resetState();
                    return self
                }
            });
        DX.viz.map._tests.Tracker = Tracker;
        DX.viz.map._tests._DEBUG_forceEventMode = function(mode) {
            setupEvents(mode)
        };
        DX.viz.map.Map.include({_trackerType: Tracker});
        var COMMAND_TO_TYPE_MAP = {};
        COMMAND_TO_TYPE_MAP[COMMAND_RESET] = ResetCommand;
        COMMAND_TO_TYPE_MAP[COMMAND_MOVE_UP] = COMMAND_TO_TYPE_MAP[COMMAND_MOVE_RIGHT] = COMMAND_TO_TYPE_MAP[COMMAND_MOVE_DOWN] = COMMAND_TO_TYPE_MAP[COMMAND_MOVE_LEFT] = MoveCommand;
        COMMAND_TO_TYPE_MAP[COMMAND_ZOOM_IN] = COMMAND_TO_TYPE_MAP[COMMAND_ZOOM_OUT] = ZoomCommand;
        COMMAND_TO_TYPE_MAP[COMMAND_ZOOM_DRAG] = ZoomDragCommand;
        var ControlBar = DX.Class.inherit({
                ctor: function(parameters) {
                    var self = this;
                    self._container = parameters.container;
                    self._createElements(parameters.renderer);
                    var context = parameters.context,
                        resetCallback = parameters.resetCallback,
                        moveCallback = parameters.moveCallback,
                        zoomCallback = parameters.zoomCallback;
                    self._reset = function() {
                        resetCallback.call(context)
                    };
                    self._move = function(dx, dy) {
                        moveCallback.call(context, dx, dy)
                    };
                    self._zoom = function(zoom) {
                        zoomCallback.call(context, zoom)
                    };
                    self._dispose = function() {
                        delete this._reset;
                        delete this._move;
                        delete this._zoom;
                        delete this._dispose;
                        context = resetCallback = moveCallback = zoomCallback = null
                    };
                    parameters = null
                },
                _createElements: function(renderer) {
                    var rootGroup = this._root = renderer.createGroup({'class': 'dxm-control-bar'}),
                        buttonsGroup = renderer.createGroup({'class': 'dxm-control-buttons'}).append(rootGroup),
                        trackersGroup = renderer.createGroup({
                            stroke: 'none',
                            strokeWidth: 0,
                            fill: '#000000',
                            opacity: 0.0001,
                            cursor: 'pointer'
                        }).append(rootGroup),
                        options = {
                            bigCircleSize: 58,
                            smallCircleSize: 28,
                            buttonSize: 10,
                            arrowButtonOffset: 20,
                            incdecButtonSize: 11,
                            incButtonOffset: 66,
                            decButtonOffset: 227,
                            sliderLineStartOffset: 88.5,
                            sliderLineEndOffset: 205.5,
                            sliderLength: 20,
                            sliderWidth: 8,
                            trackerGap: 4
                        };
                    this._buttonsGroup = buttonsGroup;
                    this._createButtons(renderer, buttonsGroup, options);
                    this._createTrackers(renderer, trackersGroup, options);
                    rootGroup.applySettings({
                        translateX: 50.5,
                        translateY: 50.5
                    })
                },
                _createButtons: function(renderer, group, options) {
                    var size = options.buttonSize / 2,
                        offset1 = options.arrowButtonOffset - size,
                        offset2 = options.arrowButtonOffset,
                        incdecButtonSize = options.incdecButtonSize / 2;
                    renderer.createCircle(0, 0, options.bigCircleSize / 2).append(group);
                    renderer.createCircle(0, 0, size).append(group);
                    renderer.createPath([-size, -offset1, 0, -offset2, size, -offset1]).append(group);
                    renderer.createPath([offset1, -size, offset2, 0, offset1, size]).append(group);
                    renderer.createPath([size, offset1, 0, offset2, -size, offset1]).append(group);
                    renderer.createPath([-offset1, size, -offset2, 0, -offset1, -size]).append(group);
                    renderer.createCircle(0, options.incButtonOffset, options.smallCircleSize / 2).append(group);
                    renderer.createSimplePath({d: _buildPath([-incdecButtonSize, options.incButtonOffset, incdecButtonSize, options.incButtonOffset]) + ' ' + _buildPath([0, options.incButtonOffset - incdecButtonSize, 0, options.incButtonOffset + incdecButtonSize])}).append(group);
                    renderer.createCircle(0, options.decButtonOffset, options.smallCircleSize / 2).append(group);
                    renderer.createSimplePath({d: _buildPath([-incdecButtonSize, options.decButtonOffset, incdecButtonSize, options.decButtonOffset])}).append(group);
                    renderer.createSimplePath({d: _buildPath([0, options.sliderLineStartOffset, 0, options.sliderLineEndOffset])}).append(group);
                    this._zoomDrag = renderer.createRect(-options.sliderLength / 2, options.sliderLineEndOffset - options.sliderWidth / 2, options.sliderLength, options.sliderWidth).append(group);
                    this._zoomCoeff = (options.sliderLineEndOffset - options.sliderLineStartOffset) / 5
                },
                _createTrackers: function(renderer, group, options) {
                    var size = _round((options.arrowButtonOffset - options.trackerGap) / 2),
                        offset1 = options.arrowButtonOffset - size,
                        offset2 = _round(_pow(options.bigCircleSize * options.bigCircleSize / 4 - size * size, 0.5)),
                        size2 = offset2 - offset1,
                        element;
                    element = renderer.createRect(-size, -size, size * 2, size * 2).append(group);
                    setElementData(element.$element, COMMAND_RESET);
                    element = renderer.createRect(-size, -offset2, size * 2, size2).append(group);
                    setElementData(element.$element, COMMAND_MOVE_UP);
                    element = renderer.createRect(offset1, -size, size2, size * 2).append(group);
                    setElementData(element.$element, COMMAND_MOVE_RIGHT);
                    element = renderer.createRect(-size, offset1, size * 2, size2).append(group);
                    setElementData(element.$element, COMMAND_MOVE_DOWN);
                    element = renderer.createRect(-offset2, -size, size2, size * 2).append(group);
                    setElementData(element.$element, COMMAND_MOVE_LEFT);
                    element = renderer.createCircle(0, options.incButtonOffset, options.smallCircleSize / 2).append(group);
                    setElementData(element.$element, COMMAND_ZOOM_IN);
                    element = renderer.createCircle(0, options.decButtonOffset, options.smallCircleSize / 2).append(group);
                    setElementData(element.$element, COMMAND_ZOOM_OUT);
                    element = this._zoomDragCover = renderer.createRect(-options.sliderLength / 2, options.sliderLineEndOffset - options.sliderWidth / 2, options.sliderLength, options.sliderWidth).append(group);
                    setElementData(element.$element, COMMAND_ZOOM_DRAG)
                },
                dispose: function() {
                    var self = this;
                    delete self._container;
                    self._dispose();
                    self._root.clear();
                    delete self._root;
                    delete self._buttonsGroup;
                    delete self._zoomDrag;
                    delete self._zoomDragCover;
                    return self
                },
                setZoom: function(zoom) {
                    this._adjustZoom(_ln(zoom) / _LN2);
                    return this
                },
                setOptions: function(options) {
                    options = options || {};
                    this._enabled = options.enabled !== undefined ? !!options.enabled : true;
                    this._buttonsGroup.applySettings(options.shape);
                    return this
                },
                clean: function() {
                    this._enabled && this._root.detach();
                    return this
                },
                render: function() {
                    this._enabled && this._root.append(this._container);
                    return this
                },
                _adjustZoom: function(zoomFactor) {
                    var value = zoomFactor;
                    value <= 5 || (value = 5);
                    value >= 0 || (value = 0);
                    this._zoomFactor = value;
                    var offset = -value * this._zoomCoeff;
                    this._zoomDrag.applySettings({translateY: offset});
                    this._zoomDragCover.applySettings({translateY: offset})
                },
                _applyZoom: function() {
                    this._zoom(_pow(2, this._zoomFactor))
                },
                processStart: function(arg) {
                    var commandType = COMMAND_TO_TYPE_MAP[arg.data] || MoveScreenCommand;
                    this._command = new commandType(this, arg);
                    return this
                },
                processMove: function(arg) {
                    this._command.update(arg);
                    return this
                },
                processEnd: function(arg) {
                    this._command.finish(arg);
                    return this
                },
                processWheel: function(arg) {
                    this._adjustZoom(this._zoomFactor + arg.delta * 0.5);
                    this._applyZoom();
                    return this
                }
            });
        function disposeCommand(command) {
            delete command._owner;
            command.update = function(){};
            command.finish = function(){}
        }
        function MoveScreenCommand(owner, arg) {
            this._owner = owner;
            this._x = arg.x;
            this._y = arg.y
        }
        MoveScreenCommand.prototype.update = function(arg) {
            var self = this;
            self._owner._move(self._x - arg.x, self._y - arg.y);
            self._x = arg.x;
            self._y = arg.y
        };
        MoveScreenCommand.prototype.finish = function() {
            disposeCommand(this)
        };
        function ResetCommand(owner, arg) {
            this._owner = owner;
            this._command = arg.data
        }
        ResetCommand.prototype.update = function(arg) {
            arg.data !== this._command && disposeCommand(this)
        };
        ResetCommand.prototype.finish = function() {
            this._owner._reset();
            this._owner._adjustZoom(0);
            disposeCommand(this)
        };
        function MoveCommand(owner, arg) {
            this._command = arg.data;
            var timeout = null,
                interval = 100,
                dx = 0,
                dy = 0;
            switch (this._command) {
                case COMMAND_MOVE_UP:
                    dy = -10;
                    break;
                case COMMAND_MOVE_RIGHT:
                    dx = 10;
                    break;
                case COMMAND_MOVE_DOWN:
                    dy = 10;
                    break;
                case COMMAND_MOVE_LEFT:
                    dx = -10;
                    break
            }
            function callback() {
                owner._move(dx, dy);
                timeout = _setTimeout(callback, interval)
            }
            this._stop = function() {
                _clearTimeout(timeout);
                this._stop = owner = callback = null;
                return this
            };
            arg = null;
            callback()
        }
        MoveCommand.prototype.update = function(arg) {
            this._command !== arg.data && this.finish()
        };
        MoveCommand.prototype.finish = function() {
            disposeCommand(this._stop())
        };
        function ZoomCommand(owner, arg) {
            this._owner = owner;
            this._command = arg.data;
            var timeout = null,
                interval = 150,
                dzoom = this._command === COMMAND_ZOOM_IN ? 0.5 : -0.5;
            function callback() {
                owner._adjustZoom(owner._zoomFactor + dzoom);
                timeout = _setTimeout(callback, interval)
            }
            this._stop = function() {
                _clearTimeout(timeout);
                this._stop = owner = callback = null;
                return this
            };
            arg = null;
            callback()
        }
        ZoomCommand.prototype.update = function(arg) {
            this._command !== arg.data && this.finish()
        };
        ZoomCommand.prototype.finish = function() {
            this._owner._applyZoom();
            disposeCommand(this._stop())
        };
        function ZoomDragCommand(owner, arg) {
            this._owner = owner;
            this._pos = arg.y
        }
        ZoomDragCommand.prototype.update = function(arg) {
            this._owner._adjustZoom(this._owner._zoomFactor + (this._pos - arg.y) / this._owner._zoomCoeff);
            this._pos = arg.y
        };
        ZoomDragCommand.prototype.finish = function() {
            this._owner._applyZoom();
            disposeCommand(this)
        };
        DX.viz.map._tests.ControlBar = ControlBar;
        DX.viz.map.Map.include({_controlBarType: ControlBar});
        var Tooltip = DX.Class.inherit({
                ctor: function(parameters) {
                    var self = this;
                    self._container = parameters.container;
                    self._root = parameters.renderer.createGroup({'class': 'dxm-tooltip'});
                    self._renderer = parameters.renderer;
                    self._inner = new DX.viz.charts.Tooltip({
                        renderer: parameters.renderer,
                        arrowLength: 10,
                        paddingLeftRight: 12,
                        paddingTopBottom: 10
                    }, self._root);
                    self._inner.draw();
                    self._inner.text.applySettings({'class': 'dxm-tooltip-text'});
                    self._enabled = false
                },
                dispose: function() {
                    var self = this;
                    self._inner.dispose(),
                    delete self._inner;
                    delete self._container;
                    self._root.clear();
                    delete self._root;
                    return self
                },
                enabled: function() {
                    return this._enabled
                },
                setSize: function(width, height) {
                    this._inner.update({
                        canvasWidth: width,
                        canvasHeight: height
                    });
                    return this
                },
                setOptions: function(options) {
                    var self = this;
                    options = options || {};
                    self._enabled = !!options.enabled;
                    self._inner.update({color: options.color || null});
                    self._inner.cloud.applySettings(options.shape);
                    self._inner.text.applySettings(options.text);
                    self._customizeText = _isFunction(options.customizeText) ? options.customizeText : null;
                    return self
                },
                clean: function() {
                    this._root.detach();
                    this._inner.hide();
                    return this
                },
                render: function() {
                    this._root.append(this._container);
                    return this
                },
                check: function(target) {
                    if (this._enabled) {
                        var text = this._customizeText ? this._customizeText.call(target, target) : null;
                        return !!(this._text = text !== null && text !== undefined ? _String(text) : '')
                    }
                    return false
                },
                show: function() {
                    this._inner.show();
                    return this
                },
                hide: function() {
                    this._inner.hide();
                    return this
                },
                move: function(options) {
                    this._inner.move(options.x, options.y, 12, this._text);
                    return this
                }
            });
        DX.viz.map._tests.Tooltip = Tooltip;
        DX.viz.map.Map.include({_tooltipType: Tooltip});
        var Legend = DX.Class.inherit({
                ctor: function(parameters) {
                    var self = this;
                    self._container = parameters.container;
                    self._renderer = parameters.renderer;
                    self._themeManager = parameters.themeManager;
                    self._root = self._renderer.createGroup({'class': 'dxm-legend'});
                    self._background = self._renderer.createRect(0, 0, 0, 0, 0, {'class': 'dxm-legend-background'}).append(self._root);
                    self._itemsGroup = self._renderer.createGroup().append(self._root);
                    self._clip = self._renderer.createClipRect().append();
                    self._itemsGroup.applySettings({clipId: self._clip.id})
                },
                dispose: function() {
                    var self = this;
                    self._root.clear();
                    self._clip.dispose();
                    self._root = self._background = self._itemsGroup = self._clip = self._container = self._renderer = null;
                    return self
                },
                setSize: function(width, height) {
                    var self = this;
                    self._containerWidth = width;
                    self._containerHeight = height;
                    self._hasItems && self._adjustLocation();
                    return self
                },
                setOptions: function(options) {
                    options = options || {};
                    var self = this;
                    self._items = options.items && options.items.length > 0 ? options.items : [];
                    self._enabled = (options.enabled !== undefined ? !!options.enabled : true) && self._items.length > 0;
                    self._metrics = options.metrics;
                    self._backgroundSettings = options.background;
                    self._textSettings = options.text;
                    return self
                },
                _createItems: function() {
                    var self = this,
                        metrics = self._metrics,
                        renderer = self._renderer,
                        themeManager = self._themeManager,
                        textSettings = self._textSettings,
                        group = self._itemsGroup,
                        items = self._items,
                        i,
                        ii = items.length,
                        item,
                        texts = [],
                        bbox,
                        leftOffset = metrics.horizontalPadding,
                        topOffset = metrics.verticalPadding,
                        itemSize = metrics.itemSize,
                        itemSpacing = metrics.itemSpacing,
                        textIndent = metrics.textIndent,
                        actualItemSize,
                        position;
                    for (i = 0; i < ii; ++i)
                        texts.push(renderer.createText(items[i].text, 0, 0, textSettings).append(group));
                    for (i = 0; i < ii; ++i) {
                        bbox = texts[i].getBBox();
                        actualItemSize = _max(itemSize, bbox.height);
                        position = topOffset + actualItemSize / 2;
                        renderer.createRect(leftOffset, position - itemSize / 2, itemSize, itemSize, 0, themeManager.getLegendItemSettings(items[i])).append(group);
                        texts[i].applySettings({
                            x: leftOffset + itemSize + textIndent,
                            y: position - bbox.y - bbox.height / 2
                        });
                        topOffset += actualItemSize + itemSpacing
                    }
                    self._totalWidth = _min(self._metrics.maxWidth, group.getBBox().width + 2 * metrics.horizontalPadding);
                    self._totalHeight = _min(self._metrics.maxHeight, topOffset + metrics.verticalPadding - itemSpacing);
                    self._background.applySettings({
                        x: 0,
                        y: 0,
                        width: self._totalWidth,
                        height: self._totalHeight
                    });
                    self._clip.updateRectangle({
                        x: 0,
                        y: 0,
                        width: self._totalWidth,
                        height: self._totalHeight
                    });
                    self._adjustLocation();
                    self._hasItems = true
                },
                _adjustLocation: function() {
                    var self = this;
                    self._root.applySettings({
                        translateX: self._containerWidth - self._totalWidth - self._metrics.horizontalIndent,
                        translateY: self._containerHeight - self._totalHeight - self._metrics.verticalIndent
                    })
                },
                clean: function() {
                    var self = this;
                    if (self._enabled) {
                        self._root.detach();
                        self._itemsGroup.clear();
                        self._hasItems = null
                    }
                    return self
                },
                render: function() {
                    var self = this;
                    if (self._enabled) {
                        self._background.applySettings(self._backgroundSettings);
                        self._root.append(self._container);
                        self._createItems()
                    }
                    return self
                }
            });
        DX.viz.map._tests.Legend = Legend;
        DX.viz.map.Map.include({_legendType: Legend});
        function ElementProxy(map, info, settings) {
            var self = this;
            self._debug_map = map;
            self._debug_info = info;
            self.selected = function(state) {
                var current = !!info.selected;
                if (state !== undefined) {
                    !!state !== current && settings.setSelectionCallback.call(map, info, !current);
                    return this
                }
                return current
            };
            self.type = settings.type;
            var attributes = info.attributes;
            self.attribute = function(name) {
                return attributes[name]
            };
            var options = info.options;
            self.option = function(name, value) {
                return options[name]
            };
            self._dispose = function() {
                map = info = attributes = options = null;
                self._debug_map = self._debug_info = null
            }
        }
        DX.viz.map._tests.ElementProxy = ElementProxy;
        DX.ui.registerComponent('dxVectorMap', DX.viz.map.Map);
        DX.viz.map.sources = {}
    })(DevExpress, jQuery);
    DevExpress.MOD_VIZ_VECTORMAP = true
}