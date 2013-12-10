/*! 
* DevExpress Exporter (part of ChartJS)
* Version: 13.2.5
* Build date: Dec 3, 2013
*
* Copyright (c) 2012 - 2013 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: http://chartjs.devexpress.com/EULA
*/

"use strict";

if (!DevExpress.MOD_TMP_WIDGETS_FOR_EXPORTER) {
    /*! Module tmp-widgets-for-exporter, file ui.menu.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            utils = DX.utils,
            events = ui.events,
            DIV = '<div />',
            duration = 50,
            CLICK = events.addNamespace('dxclick', 'dxMenu'),
            DX_MENU = "dx-menu",
            DX_ROOT_ITEM = "dx-menu-group",
            DX_ITEM = 'dx-menu-item',
            DX_EMPTY_ITEMS = 'dx-menu-empty-childitems',
            DX_CHILD_ITEMS = "dx-menu-child-items",
            DX_PIC = 'dx-menu-image',
            DX_CAPTION = 'dx-menu-caption',
            DX_CHOOSER_DOWN = 'dx-menu-chouser-down',
            DX_ROOT_HOVERED = 'dx-menu-main-item-hovered';
        var menuItem = DX.Class.inherit({
                _addItems: function(options) {
                    var _this = this;
                    $.each(options.items, function(_, valueObject) {
                        var child = new menuItem(valueObject);
                        _this._items.push(child)
                    })
                },
                _createDiv: function(cssClass) {
                    return $(DIV).addClass(cssClass)
                },
                _drawItem: function() {
                    var _this = this,
                        $item = _this._createDiv(DX_ITEM),
                        $image,
                        $caption,
                        $choserDown;
                    if (_this.imageUrl || _this.imageCSS) {
                        $image = _this._createDiv(DX_PIC);
                        _this.imageUrl && $image.append('<img src="' + _this.imageUrl + '" />');
                        _this.imageCSS && $image.addClass(_this.imageCSS);
                        $item.append($image)
                    }
                    $caption = _this._createDiv(DX_CAPTION).text(_this.caption);
                    $item.append($caption);
                    if (_this._items.length) {
                        $choserDown = _this._createDiv(DX_CHOOSER_DOWN);
                        $item.append($choserDown)
                    }
                    else
                        $item.addClass(DX_EMPTY_ITEMS);
                    return $item
                },
                _draw: function($element) {
                    var _this = this,
                        $item,
                        $childItems = _this._createDiv(DX_CHILD_ITEMS).hide(),
                        $rootItem = _this._createDiv(DX_ROOT_ITEM);
                    $item = _this._drawItem();
                    $.each(_this._items, function(_, value) {
                        value._draw($childItems)
                    });
                    _this._subscribeToItem($rootItem, $item, $childItems);
                    $rootItem.append($item);
                    _this._items.length && $rootItem.append($childItems);
                    $element.append($rootItem)
                },
                _subscribeToItem: function($rootItem, $item, $childItems) {
                    var _this = this;
                    $rootItem.on('mouseenter', function(event) {
                        _this._showPopup(event, $rootItem, $item, $childItems, _this)
                    });
                    $rootItem.on('mouseleave', function(event) {
                        _this._hidePopup(event, $rootItem, $item, $childItems, _this)
                    });
                    $item.on(CLICK, function(event) {
                        _this._popupShowed ? _this._hidePopup(event, $rootItem, $item, $childItems, _this) : _this._showPopup(event, $rootItem, $item, $childItems, _this);
                        if (utils.isFunction(_this.click))
                            _this.click(_this);
                        else
                            _this._items.length && event.stopPropagation()
                    })
                },
                _showPopup: function(event, $rootItem, $item, $childItems, _this) {
                    if ($childItems.outerWidth() < $item.outerWidth())
                        $childItems.outerWidth($item.outerWidth());
                    $childItems.stop().fadeIn(duration);
                    if ($(window).width() <= $childItems.offset().left + $childItems.outerWidth())
                        $childItems.css({left: -$childItems.outerWidth() + $rootItem.outerWidth()});
                    !$rootItem.parent().hasClass(DX_CHILD_ITEMS) && $item.addClass(DX_ROOT_HOVERED);
                    _this._popupShowed = true
                },
                _hidePopup: function(event, $rootItem, $item, $childItems, _this) {
                    $childItems.stop().hide();
                    $item.removeClass(DX_ROOT_HOVERED);
                    $childItems.css({left: ''});
                    _this._popupShowed = false;
                    $item.trigger('testHideItems')
                },
                ctor: function(options) {
                    var _this = this;
                    _this.name = options.name;
                    _this.caption = options.caption;
                    _this.imageUrl = options.imageUrl;
                    _this.imageCSS = options.imageCSS;
                    _this.click = options.click;
                    _this._items = [];
                    if (options.items && options.items.length)
                        _this._addItems(options)
                }
            });
        ui.registerComponent("dxMenu", ui.Widget.inherit({
            _init: function() {
                var options = this.option(['items', 'name']);
                this._menuItem = new menuItem(options)
            },
            _hideAllItems: function($element) {
                $.each($element.find('.' + DX_CHILD_ITEMS), function(_, value) {
                    $(value).hide()
                });
                $.each($element.find('.' + DX_ITEM), function(_, value) {
                    $(value).removeClass(DX_ROOT_HOVERED)
                })
            },
            addItems: function(options) {
                this._menuItem._addItems(options)
            },
            _render: function() {
                var _this = this,
                    align = _this.option('align'),
                    $menu = $(DIV).addClass(DX_MENU);
                align && $menu.css('float', align);
                $(document).on(CLICK, function() {
                    _this._hideAllItems(_this._$element)
                });
                _this._$element.append($menu);
                $.each(_this._menuItem._items, function(_, item) {
                    item._draw($menu)
                })
            }
        }))
    })(jQuery, DevExpress);
    DevExpress.MOD_TMP_WIDGETS_FOR_EXPORTER = true
}
if (!DevExpress.MOD_TMP_EXPORTER) {
    /*! Module tmp-exporter, file exporter.js */
    (function(DX, $) {
        var ui = DX.ui,
            utils = DX.utils,
            FILE = "file",
            BODY = "body",
            ICON_TO = 'dx-exporter-icon-to',
            ICON_PRINT = 'dx-exporter-icon-print',
            NO_PRINTABLE = 'dx-non-printable',
            PRINTABLE = 'dx-printable',
            FORMATS_EXPORT = ['PDF', 'PNG', 'SVG'];
        var Exporter = ui.Component.inherit({
                _updateSvGForIE: function(svgContent) {
                    var re = /xmlns="[\s\S]*?"/gi,
                        first = true;
                    svgContent = svgContent.replace(re, function(findedStr) {
                        var str = "";
                        if (first) {
                            str = findedStr;
                            first = false
                        }
                        return str
                    });
                    return svgContent.replace(/xmlns:NS1="[\s\S]*?"/gi, "").replace(/NS1:xmlns:xlink="([\s\S]*?)"/gi, 'xmlns:xlink="$1"')
                },
                _getSvgElements: function() {
                    var _this = this,
                        svgArray = [];
                    $($(_this.option('sourceContainerId'))).find("svg").each(function(i) {
                        svgArray[i] = _this._updateSvGForIE($(this).clone().wrap("<div></div>").parent().html())
                    });
                    return JSON.stringify(svgArray)
                },
                _appendTextArea: function(name, value, rootElement) {
                    $("<textarea/>", {
                        id: name,
                        name: name,
                        val: value
                    }).appendTo(rootElement)
                },
                _formSubmit: function(form) {
                    form.submit();
                    form.remove();
                    return form.submit()
                },
                _defaultOptions: function() {
                    return {
                            menuAlign: 'right',
                            exportFormat: FORMATS_EXPORT,
                            printingEnabled: true,
                            fileName: FILE
                        }
                },
                _createWindow: function() {
                    return window.open('', 'printDiv', '')
                },
                _createExportItems: function(exportFormat) {
                    var _this = this,
                        fileName = _this.option('fileName');
                    return $.map(exportFormat, function(value) {
                            value = value.toUpperCase();
                            if ($($(_this.option('sourceContainerId'))).find("svg").length > 1 && value === "SVG")
                                return null;
                            if ($.inArray(value.toUpperCase(), FORMATS_EXPORT) === -1)
                                return null;
                            return {
                                    name: value,
                                    caption: value + ' ' + FILE,
                                    click: function(item) {
                                        _this.exportTo(fileName, item.name)
                                    }
                                }
                        })
                },
                _render: function() {
                    var _this = this,
                        exportItems = _this._createExportItems(_this.option('exportFormat')),
                        container = $('<div />'),
                        rootItems = [{
                                name: 'export',
                                imageCSS: ICON_TO,
                                items: exportItems
                            }],
                        options = {
                            align: _this.option('menuAlign'),
                            items: rootItems
                        };
                    _this.option('printingEnabled') && rootItems.push({
                        imageCSS: ICON_PRINT,
                        name: 'print',
                        click: function() {
                            _this.print()
                        }
                    });
                    container.dxMenu(options);
                    _this._$element.append(container);
                    return options
                },
                print: function() {
                    var $sourceContainer = $(this.option('sourceContainerId')).html(),
                        printWindow = this._createWindow();
                    $(printWindow.document.body).html($sourceContainer);
                    printWindow.document.close();
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close()
                },
                exportTo: function(fileName, format) {
                    var _this = this,
                        $sourceContainer = $(_this.option('sourceContainerId')),
                        form = $("<form/>", {
                            method: "POST",
                            action: _this.option('serverUrl'),
                            enctype: "application/x-www-form-urlencoded",
                            target: "_self",
                            css: {
                                display: "none",
                                visibility: "hidden"
                            }
                        });
                    _this._appendTextArea("exportContent", $sourceContainer.clone().wrap("<div></div>").parent().html(), form);
                    _this._appendTextArea("svgElements", _this._getSvgElements(), form);
                    _this._appendTextArea("fileName", fileName, form);
                    _this._appendTextArea("format", format.toLowerCase(), form);
                    _this._appendTextArea("width", $sourceContainer.width(), form);
                    _this._appendTextArea("height", $sourceContainer.height(), form);
                    _this._appendTextArea("url", window.location.host, form);
                    $(document.body).append(form);
                    _this._testForm = form;
                    _this._formSubmit(form)
                }
            });
        $.extend(true, DX, {exporter: {Exporter: Exporter}});
        ui.registerComponent("dxExporter", Exporter)
    })(DevExpress, jQuery);
    DevExpress.MOD_TMP_EXPORTER = true
}
