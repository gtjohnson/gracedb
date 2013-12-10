/*! 
* DevExpress Visualization Sparklines (part of ChartJS)
* Version: 13.2.5
* Build date: Dec 3, 2013
*
* Copyright (c) 2012 - 2013 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: http://chartjs.devexpress.com/EULA
*/
"use strict";if(!DevExpress.MOD_VIZ_SPARKLINES){if(!window.DevExpress)throw Error("Required module is not referenced: core");if(!DevExpress.MOD_VIZ_CORE)throw Error("Required module is not referenced: viz-core");(function(n,t){var b=t.viz.charts,o=100,k=10,u=200,d=1e3,c=Math,l=n.extend,a=setTimeout,e=clearTimeout,v=c.abs,g=String,i=Number,r=c.round;t.viz.sparklines={},t.viz.sparklines.BaseSparkline=t.ui.Component.inherit({render:function(){return this._refresh(),this},_rendererType:t.viz.renderers.Renderer,_clean:function(){this._tooltipContainer.detach(),this._cleanWidgetElements()},_optionChanged:function(n,t){if(n==="size"&&this._allOptions){if(this._clean(),this._canvas=this._calculateCanvas(),this._renderer.resize(this._canvas.width,this._canvas.height),!this._isContainerVisible())return;this._allOptions.size=t,this._redrawWidgetElements(),this._prepareTooltipContainer()}else this._invalidate(),this.callBase.apply(this,arguments)},_init:function(){this._renderer=new this._rendererType({cssClass:this._widgetClass+" "+this._widgetClass+"-"+this._widgetType}),this._renderer.recreateCanvas(1,1),this._createHtmlElements(),this._createTooltipGroups(),this._initTooltipEvents(),this._drawContainer()},_dispose:function(){this.callBase(),this._disposeWidgetElements(),this._disposeTooltipEvents(),this._renderer.killContainer(),this._tooltipRenderer.killContainer(),delete this._renderer,delete this._tooltipRenderer,delete this._tooltipTrackerGroup,delete this._tooltipGroup,delete this._tooltipContainer},_render:function(){(this._canvas=this._calculateCanvas(),this._renderer.resize(this._canvas.width,this._canvas.height),this._isContainerVisible())&&(this._prepareOptions(),this._createWidgetElements(),this._drawWidgetElements())},_isContainerVisible:function(){var t=this,n=t._canvas,i=n.width-n.left-n.right>0,r=n.height-n.top-n.bottom>0;return n.height&&n.width&&r&&i},_createWidgetElements:function(){this._createRange(),this._createTranslator()},_prepareOptions:function(n){var e=this,f=t.viz.core,o=e.option()||{},i,u,r;return u=f.findTheme("default"),u=u[this._widgetType],i=l(!0,{},n,o),typeof i.theme=="string"?(r=f.findTheme(i.theme),r=r[this._widgetType]):r=i.theme,l(!0,{},u,r,i)},_calculateCanvas:function(){var r=this,s={},n=r.option("size")||{},u=r.option("margin")||{},t=r._defaultSize,o=r._element(),f=n.width>=0?i(n.width):o.width(),e=n.height>=0?i(n.height):o.height();return f||i(n.width)===0||(f=t.width),e||i(n.height)===0||(e=t.height),{width:f,height:e,top:i(u.top)||t.top,bottom:i(u.bottom)||t.bottom,left:i(u.left)||t.left,right:i(u.right)||t.right}},_createTooltipGroups:function(){var t=this,i,u,r=t._widgetClass;t._tooltipRenderer=i=new t._rendererType({cssClass:r+" "+r+"-tooltip"}),i.recreateCanvas(1,1),t._tooltipContainer=n('<div style="position: relative">'),i.draw(t._tooltipContainer[0]),u=i.getRoot(),t._tooltipGroup=i.createGroup({"class":r+"-tooltip-group",style:{"z-index":"1"}}).append(u),t._tooltipTrackerGroup=i.createGroup({"class":r+"-tooltip-tracker-group"}).append(u),t._tooltipTracker=t._createTooltipTracker().append(t._tooltipTrackerGroup),t._tooltip=b.factory.createTooltip({renderer:i},t._tooltipGroup)},_createTooltipTracker:function(){return this._tooltipRenderer.createRect(0,0,0,0,0,{fill:"grey",opacity:0})},_initTooltipEvents:function(){var n=this,t={widget:n,container:n._tooltipTracker};n._showTooltipCallback=function(){n._showTooltipTimeout=null,n._tooltipShown||(n._tooltipShown=!0,n._showTooltip())},n._hideTooltipCallback=function(){n._hideTooltipTimeout=null,n._tooltipShown&&(n._tooltipShown=!1,n._hideTooltip())},n._disposeCallbacks=function(){n=n._showTooltipCallback=n._hideTooltipCallback=n._disposeCallbacks=null};n._tooltipTracker.on(tt,t).on(it,t);n._tooltipTracker.on(nt)},_disposeTooltipEvents:function(){this._tooltipTracker.off(),this._disposeCallbacks()},_drawContainer:function(){this._renderer.draw(this._element()[0])},_createTranslator:function(){this._translator=new t.viz.core.Translator2D(this._range,this._canvas)},_prepareTooltipOptions:function(){var t=this,e=t._canvas,r=t._getTooltipText(),i=t._getTooltipSize(!0),u={canvasWidth:i.width,canvasHeight:i.height,paddingLeftRight:t._allOptions.tooltip.paddingLeftRight,paddingTopBottom:t._allOptions.tooltip.paddingTopBottom,arrowLength:t._allOptions.tooltip.arrowLength,cloudHorizontalPosition:t._allOptions.tooltip.horizontalAlignment,cloudVerticalPosition:t._allOptions.tooltip.verticalAlignment},f=n.extend(u,t._allOptions.tooltip);t._tooltipOptions={text:r,size:i,options:f}},_getTooltipText:function(){var r=this,u=r._allOptions.tooltip.customizeText,i=r._getTooltipData(),t,n;return typeof u=="function"?(n=u.call(i,i),t=n!==undefined&&n!==null&&n!==""?g(n):null):t=this._getDefaultTooltipText(i),t},_prepareTooltipContainer:function(){var n=this,i=n._canvas,r=i.width,t=i.height,u=n._tooltipRenderer;n._tooltipTracker.applySettings({width:r,height:t}),u.resize(r,t),u.getRoot().applySettings({style:{top:-t,position:"absolute",left:0}}),n._tooltipContainer.appendTo(n._element()),n._tooltipInitializated=!1,n._canShowTooltip=n._allOptions.tooltip.enabled},_isTooltipVisible:function(){var n=this,i=n._allOptions.tooltip.enabled,r=n._tooltipOptions.text!==null,t;return t=n._widgetType==="sparkline"?n._dataSource.length!==0:!0,i&&r&&t},_createTooltip:function(){var n=this,t=n._tooltip;n._prepareTooltipOptions(),n._isTooltipVisible()?(t.update(n._tooltipOptions.options),t.draw(),n._updateTooltipSizeToWide(),n._checkTooltipSize(),n._updateTooltipSizeToNormal(),t.cloud.applySettings({opacity:n._allOptions.tooltip.opacity})):n._canShowTooltip=!1},_doShowTooltip:function(n){var t=this;t._canShowTooltip&&(e(t._hideTooltipTimeout),t._hideTooltipTimeout=null,e(t._showTooltipTimeout),t._showTooltipTimeout=a(t._showTooltipCallback,n))},_doHideTooltip:function(n){var t=this;t._canShowTooltip&&(e(t._showTooltipTimeout),t._showTooltipTimeout=null,e(t._hideTooltipTimeout),t._hideTooltipTimeout=a(t._hideTooltipCallback,n))},_getNormalTooltipSize:function(){var t={};return t.width=this._canvas.width,t.left=0,t.tooltipLeft=r(t.width/2),t},_getWideTooltipSize:function(n){var u=this,i=u._canvas,f=u._allOptions.tooltip.horizontalAlignment,t={};return t.width=n+i.width,f==="right"?(t.left=0,t.tooltipLeft=r(i.width/2)):f==="left"?(t.left=-n,t.tooltipLeft=r(i.width/2)+n):(t.left=-r(n/2),t.tooltipLeft=r(t.width/2)),t},_getTooltipSize:function(n,t){var u=this,f=u._canvas,e=u._allOptions.tooltip.verticalAlignment==="top",i=n?u._getNormalTooltipSize(t):u._getWideTooltipSize(t);return i.height=f.height+o,i.top=e?-i.height:-f.height,i.trackerY=e?o:0,i.tooltipY=e?r(f.height/2)+o-k:r(f.height/2),i},_checkTooltipSize:function(){var n=this,r=n._canvas,u=n._tooltip.text.getBBox().width+2*n._tooltipOptions.options.paddingLeftRight,t,f=n._allOptions.tooltip.horizontalAlignment,e=n._allOptions.tooltip.allowContainerResizing,i;t=f==="left"||f==="right"?r.width/2:r.width,u>t&&(e?(n._tooltipOptions.size=i=n._getTooltipSize(!1,u-t),n._tooltipOptions.options.canvasWidth=i.width,n._tooltipOptions.options.canvasHeight=i.height,n._tooltip.update(n._tooltipOptions.options),n._updateTooltipSizeToWide()):n._canShowTooltip=!1)},_updateTooltipSizeToWide:function(){var t=this,n=t._tooltipOptions.size,i=t._tooltipRenderer;i.resize(n.width,n.height),i.getRoot().applySettings({style:{left:n.left,top:n.top,position:"absolute"}}),t._tooltipTracker.applySettings({y:n.trackerY,x:-n.left}),t._tooltip.move(n.tooltipLeft,n.tooltipY,0,t._tooltipOptions.text)},_updateTooltipSizeToNormal:function(){var n=this,i=n._tooltipRenderer,t=n._canvas;i.resize(t.width,t.height),i.getRoot().applySettings({style:{left:0,top:-t.height,position:"absolute"}}),n._tooltipTracker.applySettings({y:0,x:0})},_showTooltip:function(){(this._tooltipInitializated||(this._createTooltip(),this._tooltipInitializated=!0,this._canShowTooltip))&&(this._updateTooltipSizeToWide(),this._tooltip.show())},_hideTooltip:function(){this._updateTooltipSizeToNormal(),this._tooltip.hide()}});var nt={"contextmenu.sparkline-tooltip":function(n){(t.ui.events.isTouchEvent(n)||t.ui.events.isPointerEvent(n))&&n.preventDefault()},"MSHoldVisual.sparkline-tooltip":function(n){n.preventDefault()}},tt={"mouseover.sparkline-tooltip":function(n){h=!1;var t=n.data.widget;t._x=n.pageX,t._y=n.pageY;t._tooltipTracker.off(s).on(s,n.data);t._doShowTooltip(u)},"mouseout.sparkline-tooltip":function(n){if(!h){var t=n.data.widget;t._tooltipTracker.off(s),t._doHideTooltip(u)}}},s={"mousemove.sparkline-tooltip":function(n){var t=n.data.widget;t._showTooltipTimeout&&(v(t._x-n.pageX)>3||v(t._y-n.pageY)>3)&&(t._x=n.pageX,t._y=n.pageY,t._doShowTooltip(u))}},f=null,y=function(n){n.preventDefault();var t=f;t&&t!==n.data.widget&&t._doHideTooltip(u),t=f=n.data.widget,t._doShowTooltip(d),t._touch=!0},p=function(){var n=f;n&&(n._touch||(n._doHideTooltip(u),f=null),n._touch=null)},w=function(){var n=f;n&&n._showTooltipTimeout&&(n._doHideTooltip(u),f=null)},h=!1,it={"pointerdown.sparkline-tooltip":function(n){y(n)},"touchstart.sparkline-tooltip":function(n){y(n)}};n(document).on({"pointerdown.sparkline-tooltip":function(){h=!0,p()},"touchstart.sparkline-tooltip":function(){p()},"pointerup.sparkline-tooltip":function(){w()},"touchend.sparkline-tooltip":function(){w()}})})(jQuery,DevExpress),function(n,t){var r=t.viz.charts,u=1,f=50,a=4,v=250,y=30,e=5,o=3,s="dxsl-first-last-points",p="dxsl-min-point",w="dxsl-max-point",b="dxsl-positive-points",k="dxsl-negative-points",d={theme:"default",dataSource:[],size:{},margin:{},type:"line",argumentField:"arg",valueField:"val",winlossThreshold:0,showFirstLast:!0,showMinMax:!1},g={line:!0,spline:!0,stepline:!0,area:!0,steparea:!0,splinearea:!0,bar:!0,winloss:!0},h=n.map,nt=n.extend,tt=Math.abs,it=Math.round,rt=isFinite,c=Number,l=String,i=t.formatHelper;t.viz.sparklines.Sparkline=t.viz.sparklines.BaseSparkline.inherit({_widgetType:"sparkline",_widgetClass:"dxsl",_defaultSize:{width:v,height:y,left:e,right:e,top:o,bottom:o},_redrawWidgetElements:function(){this._createTranslator(),this._correctPoints(),this._series.draw(this._translator),this._seriesGroup.append(this._renderer.getRoot())},_disposeWidgetElements:function(){delete this._seriesGroup,delete this._seriesLabelGroup},_cleanWidgetElements:function(){this._seriesGroup.detach(),this._seriesLabelGroup.detach(),this._seriesGroup.clear(),this._seriesLabelGroup.clear()},_createWidgetElements:function(){this._createSeries(),this.callBase()},_drawWidgetElements:function(){this._drawSeries()},_prepareOptions:function(){this._allOptions=this.callBase(d),this._allOptions.type=l(this._allOptions.type).toLowerCase(),g[this._allOptions.type]||(this._allOptions.type="line")},_createHtmlElements:function(){this._seriesGroup=this._renderer.createGroup({"class":"dxsl-series"}),this._seriesLabelGroup=this._renderer.createGroup({"class":"dxsl-series-labels"})},_createSeries:function(){var n=this,i=n._renderer,t;n._prepareDataSource(),n._prepareSeriesOptions(),n._series=r.factory.createSeries(n._seriesOptions.type,i,n._seriesOptions),t=r.factory.createDataValidator(n._dataSource,[[n._series]],null,{checkTypeForAllData:!1,convertToAxisDataType:!0,sortingMethod:!0}),n._dataSource=t.validate(),n._series.options.customizePoint=n._getCustomizeFunction(),n._series.reinitData(n._dataSource)},_parseNumericDataSource:function(n,t,i){return h(n,function(n,r){var u=null,f;return n!==undefined&&(u={},f=rt(n),u[t]=f?l(r):n[t],u[i]=f?c(n):c(n[i]),u=u[t]!==undefined&&u[i]!==undefined?u:null),u})},_parseWinlossDataSource:function(n,t,i){var u=-1,f=0,e=1,o=.0001,r=this._allOptions.winlossThreshold;return h(n,function(n){var s={};return s[t]=n[t],s[i]=tt(n[i]-r)<o?f:n[i]>r?e:u,s})},_prepareDataSource:function(){var n=this,t=n._allOptions,r=t.argumentField,u=t.valueField,i=n._parseNumericDataSource(t.dataSource||[],r,u);t.type==="winloss"?(n._winlossDataSource=i,n._dataSource=n._parseWinlossDataSource(i,r,u)):n._dataSource=i},_prepareSeriesOptions:function(){var n=this,t=n._allOptions,i={border:{},hoverStyle:{border:{}},selectionStyle:{border:{}}},r={size:t.pointSize,symbol:t.pointSymbol,border:{visible:!0,width:2},color:t.pointColor};n._seriesOptions={argumentField:t.argumentField,valueField:t.valueField,color:t.lineColor,width:t.lineWidth},n._seriesOptions.type=t.type==="winloss"?"bar":t.type,(t.type==="winloss"||t.type==="bar")&&(n._seriesOptions.argumentAxisType="discrete"),n._seriesOptions.seriesGroup=n._seriesGroup,n._seriesOptions.seriesLabelsGroup=n._seriesLabelGroup,n._seriesOptions.point=nt(i,r),n._seriesOptions.point.visible=!1,n._seriesOptions.border={color:n._seriesOptions.color,width:n._seriesOptions.width,visible:!0}},_createBarCustomizeFunction:function(n){var i=this,t=i._allOptions,r=i._winlossDataSource;return function(){var u=this.index,f=t.type==="winloss",e=f?t.winlossThreshold:0,o=f?r[u][t.valueField]:this.value,s=f?t.winColor:t.barPositiveColor,h=f?t.lossColor:t.barNegativeColor,i;return i=o>=e?s:h,(u===n.first||u===n.last)&&(i=t.firstLastColor),u===n.min&&(i=t.minColor),u===n.max&&(i=t.maxColor),{color:i}}},_createLineCustomizeFunction:function(n){var i=this,t=i._allOptions;return function(){var i,r=this.index;return(r===n.first||r===n.last)&&(i=t.firstLastColor),r===n.min&&(i=t.minColor),r===n.max&&(i=t.maxColor),i?{visible:!0,border:{color:i}}:{}}},_getCustomizeFunction:function(){var n=this,i=n._allOptions,u=n._winlossDataSource||n._dataSource,r=n._getExtremumPointsIndexes(u),t;return t=i.type==="winloss"||i.type==="bar"?n._createBarCustomizeFunction(r):n._createLineCustomizeFunction(r)},_getExtremumPointsIndexes:function(n){var t=this,r=t._allOptions,u=n.length-1,i={};return t._minMaxIndexes=t._findMinMax(n),r.showFirstLast&&(i.first=0,i.last=u),r.showMinMax&&(i.min=t._minMaxIndexes.minIndex,i.max=t._minMaxIndexes.maxIndex),i},_findMinMax:function(n){for(var h=this,r=h._allOptions.valueField,c=n[0]||{},u=c[r]||0,f=u,e=u,o=0,s=0,l=n.length,i,t=1;t<l;t++)i=n[t][r],i<f&&(f=i,o=t),i>e&&(e=i,s=t);return{minIndex:o,maxIndex:s}},_createRange:function(){var n=this,t=n._series,i=t.type==="bar",u=.15,f=i?.1:0,e={stickX:!i&&t.points.length>1,minValueMarginY:u,maxValueMarginY:u,minValueMarginX:f,maxValueMarginX:f};n._range=new r.Range(e),n._range.getBoundRange(t.getRangeData()),n._range.applyValueMargins()},_getBarWidth:function(n){var r=this,i=r._canvas,e=n*a,o=i.width-i.left-i.right-e,t=it(o/n);return t<u&&(t=u),t>f&&(t=f),t},_preparePointsClasses:function(){var u=this,i=u._allOptions,f=i.type==="bar",e=f||i.type==="winloss",t=u._series.getAllPoints(),o=0,h=t.length-1,c=u._minMaxIndexes.minIndex,l=u._minMaxIndexes.maxIndex,a=f?0:i.winlossThreshold,r="";e&&(r=" dxsl-bar-point",n.each(t,function(n,i){var r;r=i.value>=a?b:k,t[n].options.attributes["class"]=r})),i.showFirstLast&&(t[o].options.attributes["class"]=s+r,t[h].options.attributes["class"]=s+r),i.showMinMax&&(t[c].options.attributes["class"]=p+r,t[l].options.attributes["class"]=w+r)},_correctPoints:function(){var t=this,i=t._allOptions.type,r=t._series.getPoints(),u=r.length,f,n;if(i==="bar"||i==="winloss")for(f=t._getBarWidth(u),n=0;n<u;n++)r[n].correctCoordinates({width:f,offset:0})},_drawSeries:function(){var n=this;n._dataSource.length!==0&&(n._correctPoints(),n._series._segmentPoints(),n._series.styles.area&&(n._series.styles.area.opacity=n._allOptions.areaOpacity),n._preparePointsClasses(),n._series.createPatterns=function(){},n._series.draw(n._translator),n._seriesGroup.append(n._renderer.getRoot()),n._prepareTooltipContainer())},_getTooltipData:function(){var f=this,n=f._allOptions,r=n.tooltip.format,u=n.tooltip.precision,t=f._winlossDataSource||f._dataSource;if(t.length===0)return{};var s=f._minMaxIndexes,e=n.valueField,h=t[0][e],c=t[t.length-1][e],l=t[s.minIndex][e],a=t[s.maxIndex][e],v=i.format(h,r,u),y=i.format(c,r,u),p=i.format(l,r,u),w=i.format(a,r,u),o={firstValue:v,lastValue:y,minValue:p,maxValue:w,originalFirstValue:h,originalLastValue:c,originalMinValue:l,originalMaxValue:a};return n.type==="winloss"&&(o.originalThresholdValue=n.winlossThreshold,o.thresholdValue=i.format(n.winlossThreshold,r,u)),o},_getDefaultTooltipText:function(n){return"Start: "+n.firstValue+"<br/>End: "+n.lastValue+"<br/>Min: "+n.minValue+"<br/>Max: "+n.maxValue}})}(jQuery,DevExpress),function(n,t){var y=t.viz.charts,u=.02,f=.98,h=.1,c=.9,l=300,a=30,e=1,o=2,v={theme:"default",size:{},margin:{}},s=t.formatHelper,p=String,i=Number,r=isFinite;t.viz.sparklines.Bullet=t.viz.sparklines.BaseSparkline.inherit({_widgetType:"bullet",_widgetClass:"dxb",_defaultSize:{width:l,height:a,left:e,right:e,top:o,bottom:o},_disposeWidgetElements:function(){delete this._zeroLevelPath,delete this._targetPath,delete this._barValuePath},_redrawWidgetElements:function(){this._createTranslator(),this._drawBarValue(),this._drawTarget(),this._drawZeroLevel()},_cleanWidgetElements:function(){this._zeroLevelPath.detach(),this._targetPath.detach(),this._barValuePath.detach()},_drawWidgetElements:function(){this._drawBullet()},_createHtmlElements:function(){var n=this._renderer;this._zeroLevelPath=n.createPath(undefined,{"class":"dxb-zero-level"}),this._targetPath=n.createPath(undefined,{"class":"dxb-target"}),this._barValuePath=n.createPath(undefined,{"class":"dxb-bar-value"})},_prepareOptions:function(){var n=this,t,f,e,o,r,u;n._allOptions=t=n.callBase(v),n._allOptions.value===undefined&&(n._allOptions.value=0),n._allOptions.target===undefined&&(n._allOptions.target=0),t.value=r=i(t.value),t.target=u=i(t.target),n._allOptions.startScaleValue===undefined&&(n._allOptions.startScaleValue=u<r?u:r,n._allOptions.startScaleValue=n._allOptions.startScaleValue<0?n._allOptions.startScaleValue:0),n._allOptions.endScaleValue===undefined&&(n._allOptions.endScaleValue=u>r?u:r),t.startScaleValue=f=i(t.startScaleValue),t.endScaleValue=e=i(t.endScaleValue),e<f&&(o=e,n._allOptions.endScaleValue=f,n._allOptions.startScaleValue=o,n._allOptions.inverted=!0)},_createRange:function(){var t=this,n=t._allOptions;t._range={invertX:n.inverted,minX:n.startScaleValue,maxX:n.endScaleValue,minY:0,maxY:1}},_drawBullet:function(){var t=this,n=t._allOptions,i=n.startScaleValue!==n.endScaleValue,u=r(n.startScaleValue),f=r(n.endScaleValue),e=r(n.value),o=r(n.target);i&&f&&u&&o&&e&&(this._drawBarValue(),this._drawTarget(),this._drawZeroLevel(),this._prepareTooltipContainer())},_getTargetParams:function(){var i=this,n=i._allOptions,t=i._translator,e=t.translateY(u),o=t.translateY(f),r=t.translateX(n.target),s=[{x:r,y:e},{x:r,y:o}];return{points:s,stroke:n.targetColor,strokeWidth:n.targetWidth}},_getBarValueParams:function(){var o=this,r=o._allOptions,u=o._translator,f=r.startScaleValue,e=r.endScaleValue,i=r.value,s=u.translateY(h),l=u.translateY(c),n,t;return i>0?(n=f<=0?0:f,t=i>=e?e:i):(n=e>=0?0:e,t=i>=f?i:f),n=u.translateX(n),t=u.translateX(t),{points:[{x:n,y:l},{x:t,y:l},{x:t,y:s},{x:n,y:s}],fill:r.color}},_getZeroLevelParams:function(){var t=this,r=t._allOptions,n=t._translator,e=n.translateY(u),o=n.translateY(f),i=n.translateX(0);return{points:[{x:i,y:e},{x:i,y:o}],stroke:r.targetColor,strokeWidth:1}},_drawZeroLevel:function(){var n=this,t=n._allOptions,i;0>t.endScaleValue||0<t.startScaleValue||!t.showZeroLevel||(i=n._getZeroLevelParams(),n._zeroLevelPath.applySettings(i),n._zeroLevelPath.append(n._renderer.getRoot()))},_drawTarget:function(){var n=this,t=n._allOptions,i=t.target,u=t.startScaleValue,f=t.endScaleValue,r;i>f||i<u||!t.showTarget||(r=n._getTargetParams(),n._targetPath.applySettings(r),n._targetPath.append(n._renderer.getRoot()))},_drawBarValue:function(){var n=this,t=n._getBarValueParams();n._barValuePath.applySettings(t),n._barValuePath.append(n._renderer.getRoot())},_getTooltipData:function(){var f=this,n=f._allOptions,t=n.tooltip.format,i=n.tooltip.precision,h=n.valueField,r=n.value,u=n.target,e=s.format(r,t,i),o=s.format(u,t,i);return{originalValue:r,originalTarget:u,value:e,target:o}},_getDefaultTooltipText:function(n){return"Actual Value: "+n.value+"<br/>Target Value: "+n.target}})}(jQuery,DevExpress),function(n,t){var r=t.ui,u=t.viz;r.registerComponent("dxSparkline",u.sparklines.Sparkline)}(jQuery,DevExpress),function(n,t){var r=t.ui,u=t.viz;r.registerComponent("dxBullet",u.sparklines.Bullet)}(jQuery,DevExpress),DevExpress.MOD_VIZ_SPARKLINES=!0}