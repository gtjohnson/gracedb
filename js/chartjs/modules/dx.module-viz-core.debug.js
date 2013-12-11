/*! 
* DevExpress Visualization Core Library (part of ChartJS)
* Version: 13.2.5
* Build date: Dec 3, 2013
*
* Copyright (c) 2012 - 2013 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: http://chartjs.devexpress.com/EULA
*/

"use strict";
if (!DevExpress.MOD_VIZ_CORE) {
    if (!window.DevExpress)
        throw Error('Required module is not referenced: core');
    /*! Module viz-core, file namespaces.js */
    (function(DevExpress) {
        DevExpress.viz = {}
    })(DevExpress);
    /*! Module viz-core, file namespaces.js */
    (function(DevExpress) {
        DevExpress.viz.core = {}
    })(DevExpress);
    /*! Module viz-core, file tickProvider.js */
    (function($, DX, undefined) {
        var utils = DX.utils,
            math = Math,
            core = DX.viz.core;
        var TICKS_COUNT_LIMIT = 2000;
        core.outOfScreen = {
            x: -1000,
            y: -1000
        };
        core.tickIntervalCalculator = {
            _defaultNumberMultipliers: [1, 2, 3, 5],
            _defaultGridSpacingFactor: 30,
            _getCommonTickInterval: function(deltaCoef, numberMultipliers) {
                var factor,
                    result = 0,
                    hasResult = false,
                    i;
                for (factor = 1; !hasResult; factor *= 10)
                    for (i = 0; i < numberMultipliers.length; i++) {
                        result = numberMultipliers[i] * factor;
                        if (deltaCoef <= result) {
                            hasResult = true;
                            break
                        }
                    }
                return result
            },
            _getNumericTickInterval: function(deltaCoef, numberMultipliers) {
                var factor,
                    result = 0,
                    newResult,
                    hasResult = false,
                    i;
                if (deltaCoef > 1.0)
                    result = this._getCommonTickInterval(deltaCoef, numberMultipliers);
                else if (deltaCoef > 0) {
                    result = 1;
                    for (factor = 0.1; !hasResult; factor /= 10)
                        for (i = numberMultipliers.length - 1; i >= 0; i--) {
                            newResult = numberMultipliers[i] * factor;
                            if (deltaCoef > newResult) {
                                hasResult = true;
                                break
                            }
                            result = newResult
                        }
                }
                return utils.adjustValue(result)
            },
            _getLogarithmicTickInterval: function(deltaCoef, numberMultipliers) {
                var result = 0;
                if (deltaCoef !== 0)
                    result = this._getCommonTickInterval(deltaCoef, numberMultipliers);
                return utils.adjustValue(result)
            },
            _getDateTimeTickInterval: function(deltaCoef, numberMultipliers) {
                var dateTimeMultipliers = {
                        millisecond: [1, 2, 5, 10, 25, 100, 250, 300, 500],
                        second: [1, 2, 3, 5, 10, 15, 20, 30],
                        minute: [1, 2, 3, 5, 10, 15, 20, 30],
                        hour: [1, 2, 3, 4, 6, 8, 12],
                        day: [1, 2, 3, 5, 7, 10, 14],
                        month: [1, 2, 3, 6]
                    },
                    result = {},
                    factor,
                    key,
                    specificMultipliers,
                    yearsCount,
                    i;
                if (deltaCoef < 1.0)
                    return {milliseconds: 1};
                for (key in dateTimeMultipliers)
                    if (dateTimeMultipliers.hasOwnProperty(key)) {
                        specificMultipliers = dateTimeMultipliers[key];
                        for (i = 0; i < specificMultipliers.length; i++)
                            if (deltaCoef <= utils.convertDateUnitToMilliseconds(key, specificMultipliers[i])) {
                                result[key + 's'] = specificMultipliers[i];
                                return result
                            }
                    }
                for (factor = 1; ; factor *= 10)
                    for (i = 0; i < numberMultipliers.length; i++) {
                        yearsCount = factor * numberMultipliers[i];
                        if (deltaCoef <= utils.convertDateUnitToMilliseconds('year', yearsCount))
                            return {years: yearsCount}
                    }
                return null
            },
            getTickInterval: function(options) {
                var self = this,
                    gridSpacingFactor = options.gridSpacingFactor || self._defaultGridSpacingFactor,
                    numberMultipliers,
                    deltaCoef,
                    businessDelta = options.businessDelta;
                numberMultipliers = options.numberMultipliers || self._defaultNumberMultipliers;
                self._testNumberMultipliers = numberMultipliers;
                if (options.type === 'logarithmic')
                    businessDelta = Math.round(Math.abs(utils.getLog(options.max, options.base) - utils.getLog(options.min, options.base)));
                deltaCoef = options.screenDelta > 0 ? gridSpacingFactor * businessDelta / options.screenDelta : 0;
                switch (options.type) {
                    case'numeric':
                        return self._getNumericTickInterval(deltaCoef, numberMultipliers);
                        break;
                    case'datetime':
                        return self._getDateTimeTickInterval(deltaCoef, numberMultipliers);
                        break;
                    case'logarithmic':
                        return self._getLogarithmicTickInterval(deltaCoef, numberMultipliers);
                        break
                }
                return null
            }
        };
        core.minorTickIntervalCalculator = {
            _defaultNumberMultipliers: [2, 4, 5, 8, 10],
            _defaultGridSpacingFactor: 15,
            _getDateTimeTickInterval: function(businessDelta, deltaCoef, numberMultipliers) {
                var result,
                    i;
                for (i = numberMultipliers.length - 1; i >= 0; i--) {
                    this.testResultNumberMultiplier = numberMultipliers[i];
                    result = Math.floor(businessDelta / numberMultipliers[i]);
                    if (deltaCoef <= result)
                        return utils.convertMillisecondsToDateUnits(result)
                }
                return 0
            },
            _getNumericTickInterval: function(businessDelta, deltaCoef, numberMultipliers) {
                var result,
                    i;
                for (i = numberMultipliers.length - 1; i >= 0; i--) {
                    this.testResultNumberMultiplier = numberMultipliers[i];
                    result = businessDelta / numberMultipliers[i];
                    if (deltaCoef <= result)
                        return utils.adjustValue(result)
                }
                return 0
            },
            getTickInterval: function(type, businessDelta, screenDelta, gridSpacingFactor, numberMultipliers) {
                var self = this,
                    gridSpacingFactor = !utils.isDefined(gridSpacingFactor) ? self._defaultGridSpacingFactor : gridSpacingFactor,
                    numberMultipliers = numberMultipliers || self._defaultNumberMultipliers,
                    deltaCoef = gridSpacingFactor * businessDelta / screenDelta;
                switch (type) {
                    case'numeric':
                        return self._getNumericTickInterval(businessDelta, deltaCoef, numberMultipliers);
                    case'datetime':
                        return self._getDateTimeTickInterval(businessDelta, deltaCoef, numberMultipliers)
                }
                return 0
            }
        };
        core.tickProvider = {
            _appendFakeSVGElement: function(value, text, options) {
                var textOptions = $.extend({}, options.textOptions, {rotate: 0});
                return options.renderer.createText(text, core.outOfScreen.x + options.translator.translateX(value), core.outOfScreen.y, textOptions).append()
            },
            _getDistanceByAngle: function(elementHeight, rotationAngle) {
                return elementHeight / Math.abs(Math.sin(rotationAngle * (Math.PI / 180)))
            },
            _areDisplayValuesValid: function(value1, value2, options) {
                var self = this,
                    getText = self._getTextFunc(options),
                    rotationAngle = options.textOptions && utils.isNumber(options.textOptions.rotate) ? options.textOptions.rotate : 0,
                    svgElement1 = self._appendFakeSVGElement(value1, getText(value1), options),
                    svgElement2 = self._appendFakeSVGElement(value2, getText(value2), options),
                    bBox1 = svgElement1.getBBox(),
                    bBox2 = svgElement2.getBBox(),
                    result,
                    inverted = options.translator.businessRange.invertX;
                if (rotationAngle !== 0)
                    result = self._getDistanceByAngle(bBox1.height, rotationAngle) <= Math.abs(bBox2.x - bBox1.x);
                else
                    result = !inverted ? bBox1.x + bBox1.width < bBox2.x : bBox2.x + bBox2.width < bBox1.x;
                svgElement1.remove();
                svgElement2.remove();
                return result
            },
            _removeInvalidDatesWithUnitBegining: function(dates, options) {
                if (dates.length <= 1 || !options.setTicksAtUnitBeginning || !utils.isDate(options.min))
                    return;
                if (!this._areDisplayValuesValid(dates[0], dates[1], options))
                    dates.splice(1, 1)
            },
            _getMaxDisplayValue: function(values, options) {
                var maxDisplayValue = null,
                    getText = this._getTextFunc(options),
                    currentDisplayValue,
                    i;
                maxDisplayValue = getText(values[0]);
                if (!options.isRotate)
                    for (i = 1; i < values.length; i++) {
                        currentDisplayValue = getText(values[i]);
                        if (maxDisplayValue.length < currentDisplayValue.length)
                            maxDisplayValue = currentDisplayValue
                    }
                return maxDisplayValue
            },
            _getValueSize: function(values, options) {
                var self = this,
                    value,
                    rotationAngle = options.textOptions ? options.textOptions.rotate : 0,
                    svgElement,
                    bBox,
                    result;
                if (values.length === 0)
                    return 0;
                options.isRotate = utils.isNumber(rotationAngle) && rotationAngle !== 0;
                value = self._getMaxDisplayValue(values, options);
                svgElement = self._appendFakeSVGElement(value, value, options);
                bBox = svgElement.getBBox();
                if (options.isRotate)
                    result = self._getDistanceByAngle(bBox.height, rotationAngle);
                else
                    result = options.isHorizontal ? bBox.width : bBox.height;
                svgElement.remove();
                return Math.ceil(result)
            },
            _adjustNumericTickValue: function(value, interval, min) {
                return utils.isExponential(value) ? utils.adjustValue(value) : utils.applyPrecisionByMinDelta(min, interval, value)
            },
            _generateStartTick: function(tickInterval, options) {
                var self = this,
                    milliseconds = 0,
                    boundedRule = options.min - options.max < 0,
                    startTick = options.min,
                    isDate = utils.isDate(options.min),
                    currentTickInterval = isDate ? utils.convertDateTickIntervalToMilliseconds(tickInterval) : tickInterval,
                    nextTick;
                if (options.type === 'logarithmic')
                    startTick = utils.raiseTo(Math.floor(utils.adjustValue(utils.getLog(options.min, options.base)) / currentTickInterval * currentTickInterval), options.base);
                else {
                    startTick = Math.floor(options.min / currentTickInterval) * currentTickInterval;
                    startTick = isDate ? new Date(startTick) : startTick;
                    startTick = isDate ? new Date(startTick) : self._adjustNumericTickValue(startTick, currentTickInterval, options.min);
                    while (boundedRule === startTick - options.min < 0 && startTick !== options.min) {
                        nextTick = self._nextTick(startTick, tickInterval, options);
                        if (nextTick !== startTick)
                            startTick = nextTick;
                        else
                            return nextTick
                    }
                }
                return startTick
            },
            _nextTick: function(tick, tickInterval, options) {
                var nextTick,
                    lgPower,
                    self = this;
                if (options.type === 'logarithmic') {
                    lgPower = utils.addInterval(utils.adjustValue(utils.getLog(tick, options.base)), tickInterval, options.min > options.max);
                    nextTick = utils.raiseTo(lgPower, options.base)
                }
                else {
                    nextTick = utils.addInterval(tick, tickInterval, options.min > options.max);
                    if (options.type === 'numeric')
                        nextTick = utils.isExponential(nextTick) ? utils.adjustValue(nextTick) : utils.applyPrecisionByMinDelta(options.min, tickInterval, nextTick);
                    if (options.type === 'datetime' && options.setTicksAtUnitBeginning)
                        utils.correctDateWithUnitBeginning(nextTick, tickInterval)
                }
                return nextTick
            },
            _addMinorTicks: function(majorTick1, majorTick2, ticksInfo, options, isReverse) {
                var self = this,
                    i,
                    dataType = utils.isDate(majorTick1) ? 'datetime' : 'numeric',
                    businessDelta,
                    minorTicks = [],
                    interval = 0,
                    minorTickIntervalsCount = options.minorTickCount + 1,
                    intervalsCount,
                    tickInterval;
                options.min = majorTick1;
                options.max = majorTick2;
                if (!utils.isDefined(options.tickInterval)) {
                    businessDelta = Math.abs(options.max - options.min);
                    if (utils.isDefined(options.minorTickCount)) {
                        if (!ticksInfo.majorTicks.autoArrangementStep || ticksInfo.majorTicks.autoArrangementStep <= 1) {
                            intervalsCount = options.minorTickCount + 1;
                            interval = dataType === 'datetime' ? utils.convertDateTickIntervalToMilliseconds(ticksInfo.majorTickInterval) : ticksInfo.majorTickInterval;
                            minorTickIntervalsCount = Math.round(businessDelta / interval * intervalsCount) || 1
                        }
                        tickInterval = dataType === 'datetime' ? utils.convertMillisecondsToDateUnits(businessDelta / minorTickIntervalsCount) : businessDelta / minorTickIntervalsCount;
                        if ($.isNumeric(tickInterval))
                            tickInterval = utils.adjustValue(tickInterval)
                    }
                    else if (utils.isDate(majorTick1))
                        tickInterval = core.minorTickIntervalCalculator.getTickInterval(dataType, businessDelta, businessDelta * options.deltaCoef, options.gridSpacingFactor, options.numberMultipliers)
                }
                options = $.extend(true, {}, options, {tickInterval: tickInterval});
                minorTicks = self.getTicks(options);
                if (isReverse)
                    minorTicks.reverse();
                if (minorTicks.length > 0)
                    if (Math.ceil(Math.abs(majorTick2 - minorTicks[minorTicks.length - 1]) * options.deltaCoef) < 2)
                        minorTicks.pop();
                for (i = 0; i < minorTicks.length; i++) {
                    ticksInfo.minorTicks.push(minorTicks[i]);
                    ticksInfo.fullTicks.push(minorTicks[i])
                }
            },
            _addLeftBoudedTicks: function(ticksInfo, min, minorTicksOptions) {
                if (utils.isDefined(min) && ticksInfo.majorTicks[0].valueOf() !== min.valueOf()) {
                    minorTicksOptions.addMinMax.max = true;
                    this._addMinorTicks(ticksInfo.majorTicks[0], min, ticksInfo, minorTicksOptions, true);
                    minorTicksOptions.addMinMax.max = false;
                    if (minorTicksOptions.showCustomBoundaryTicks) {
                        if (ticksInfo.minorTicks.length > 0 && ticksInfo.minorTicks[0].valueOf() === min.valueOf())
                            ticksInfo.minorTicks.shift(min);
                        ticksInfo.customBoundaryTicks.push(min);
                        ticksInfo.fullTicks.unshift(min)
                    }
                }
            },
            _addRightBoudedTicks: function(ticksInfo, max, minorTicksOptions) {
                var lastMajorTick = ticksInfo.majorTicks[ticksInfo.majorTicks.length - 1];
                ticksInfo.fullTicks.push(lastMajorTick);
                if (utils.isDefined(max) && lastMajorTick.valueOf() !== max.valueOf()) {
                    minorTicksOptions.addMinMax.min = false;
                    minorTicksOptions.addMinMax.max = true;
                    this._addMinorTicks(lastMajorTick, max, ticksInfo, minorTicksOptions);
                    if (minorTicksOptions.showCustomBoundaryTicks) {
                        if (ticksInfo.minorTicks.length > 0 && ticksInfo.minorTicks[ticksInfo.minorTicks.length - 1].valueOf() === max.valueOf())
                            ticksInfo.minorTicks.pop(max);
                        ticksInfo.customBoundaryTicks.push(max);
                        ticksInfo.fullTicks.push(max)
                    }
                }
            },
            _correctBoundedTicks: function(min, max, ticks, addMinMax) {
                addMinMax = $.extend({}, {
                    min: true,
                    max: true
                }, addMinMax);
                if (ticks.length > 0) {
                    if (!addMinMax.min && ticks[0].valueOf() === min.valueOf())
                        ticks.shift();
                    if (!addMinMax.max || ticks[ticks.length - 1].valueOf() !== max.valueOf())
                        ticks.pop()
                }
            },
            _initializeMinorTicksOptions: function(dataType, min, max, screenDelta, ticksInfo, options) {
                var self = this,
                    businessDelta,
                    hasMinorsCount = utils.isDefined(options.minorTickCount);
                $.extend(true, options, {
                    addMinMax: {
                        min: false,
                        max: false
                    },
                    deltaCoef: self._getDeltaCoef(screenDelta, min, max)
                }, options);
                options.numberMultipliers = hasMinorsCount ? [options.minorTickCount + 1] : options.numberMultipliers;
                options.gridSpacingFactor = hasMinorsCount ? 0 : options.gridSpacingFactor;
                if (!hasMinorsCount && ticksInfo.majorTicks.length > 1) {
                    businessDelta = Math.abs(ticksInfo.majorTicks[0] - ticksInfo.majorTicks[1]);
                    if (self.needTickIntervalCalculation(businessDelta, ticksInfo.minorTickInterval, options.incidentOccured)) {
                        ticksInfo.minorTickInterval = core.minorTickIntervalCalculator.getTickInterval(dataType, businessDelta, businessDelta * options.deltaCoef, options.gridSpacingFactor, options.numberMultipliers);
                        if (utils.isNumber(min))
                            options.tickInterval = ticksInfo.minorTickInterval;
                        else
                            options.tickInterval = undefined
                    }
                }
            },
            _getDataType: function(value) {
                return utils.isDate(value) ? 'datetime' : 'numeric'
            },
            _getDeltaCoef: function(screenDelta, max, min) {
                return screenDelta / Math.abs(max - min)
            },
            _initializeMajorTicksOptions: function(dataType, min, max, screenDelta, ticksInfo, options) {
                var businessDelta;
                options.type = dataType;
                options.screenDelta = screenDelta;
                $.extend(true, options, {
                    min: min,
                    max: max,
                    screenDelta: screenDelta,
                    isHorizontal: true
                });
                if (utils.isDefined(min) && utils.isDefined(max)) {
                    businessDelta = Math.abs(max - min);
                    options.businessDelta = businessDelta;
                    if (this.needTickIntervalCalculation(businessDelta, ticksInfo.majorTickInterval, options.incidentOccured)) {
                        options.isStartTickGenerated = true;
                        ticksInfo.majorTickInterval = core.tickIntervalCalculator.getTickInterval(options);
                        options.tickInterval = ticksInfo.majorTickInterval
                    }
                }
            },
            _getTextFunc: function(options) {
                return options.getText || function(value) {
                        return value.toString()
                    }
            },
            _generateTicks: function(options) {
                var self = this,
                    ticks = [],
                    tick,
                    boundedRule = options.max - options.min > 0,
                    leftBound,
                    rightBound,
                    tickInterval,
                    isStartTickGenerated = options.isStartTickGenerated,
                    businessDelta,
                    useTicksAutoArrangement = options.useTicksAutoArrangement;
                options.type = utils.isDefined(options.type) && options.type !== 'continuous' ? options.type : self._getDataType(options.min);
                options.businessDelta = Math.abs(options.max - options.min);
                if (!utils.isDefined(options.min) || !utils.isDefined(options.max) || isNaN(options.min) || isNaN(options.max)) {
                    ticks = options.isHorizontal ? ['canvas_position_left', 'canvas_position_center', 'canvas_position_right'] : ['canvas_position_bottom', 'canvas_position_middle', 'canvas_position_top'];
                    useTicksAutoArrangement = false;
                    ticks.hideLabels = true
                }
                else {
                    tickInterval = $.isNumeric(options.min) && $.isNumeric(options.max) && !$.isNumeric(options.tickInterval) ? undefined : options.tickInterval;
                    businessDelta = options.type === 'logarithmic' ? Math.abs(utils.getLog(options.min, options.base) - utils.getLog(options.max, options.base)) : options.businessDelta;
                    if (this.needTickIntervalCalculation(businessDelta, tickInterval, options.incidentOccured)) {
                        isStartTickGenerated = utils.isDefined(isStartTickGenerated) ? isStartTickGenerated : true;
                        tickInterval = core.tickIntervalCalculator.getTickInterval(options)
                    }
                    ticks.tickInterval = tickInterval;
                    self.isTestStartTickGenerated = isStartTickGenerated;
                    self.isTestTickInterval = tickInterval;
                    self.testGridSpacingFactor = options.gridSpacingFactor;
                    if (tickInterval && tickInterval.valueOf() !== 0 && options.min.valueOf() !== options.max.valueOf()) {
                        tick = isStartTickGenerated ? self._generateStartTick(tickInterval, options) : options.min;
                        do {
                            ticks.push(tick);
                            tick = self._nextTick(tick, tickInterval, options);
                            if (ticks[ticks.length - 1].valueOf() === tick.valueOf())
                                break;
                            leftBound = tick - options.min > 0;
                            rightBound = options.max - tick > 0
                        } while (boundedRule === leftBound && boundedRule === rightBound);
                        ticks.push(tick);
                        self._correctBoundedTicks(options.min, options.max, ticks, options.addMinMax)
                    }
                }
                return ticks
            },
            _getAutoArrangementStep: function(ticks, options) {
                var self = this,
                    requiredValuesCount,
                    addedSpacing = options.isHorizontal ? options.textSpacing : 0;
                if (options.getCustomAutoArrangementStep)
                    return options.getCustomAutoArrangementStep(ticks, options);
                if (options.maxDisplayValueSize > 0) {
                    requiredValuesCount = Math.floor((options.screenDelta + options.textSpacing) / (options.maxDisplayValueSize + addedSpacing));
                    return Math.ceil((options.ticksCount || ticks.length) / requiredValuesCount)
                }
                return 1
            },
            _getAutoArrangementTicks: function(ticks, options, step) {
                var self = this,
                    resultTicks = ticks,
                    i;
                if (step > 1) {
                    resultTicks = [];
                    for (i = 0; i < ticks.length; i += step)
                        resultTicks.push(ticks[i])
                }
                return resultTicks
            },
            isOverlappedTicks: function(ticks, options) {
                var self = this;
                options.maxDisplayValueSize = self._getValueSize(ticks, options);
                return self._getAutoArrangementStep(ticks, options) > 1
            },
            needTickIntervalCalculation: function(businessDelta, tickInterval, incidentOccured) {
                var date;
                if (utils.isDefined(tickInterval)) {
                    if (!utils.isNumber(tickInterval)) {
                        date = new Date;
                        tickInterval = utils.addInterval(date, tickInterval) - date;
                        if (!tickInterval)
                            return true
                    }
                    if (utils.isNumber(tickInterval))
                        if (tickInterval > 0 && businessDelta / tickInterval > TICKS_COUNT_LIMIT) {
                            if (incidentOccured)
                                incidentOccured('Tick count is too big. So, the tick interval is specified automatically.')
                        }
                        else
                            return false
                }
                return true
            },
            getTickIntervals: function(min, max, screenDelta, majorTicksOptions, minorTicksOptions) {
                var self = this,
                    i,
                    businessDelta,
                    dataType = self._getDataType(min),
                    ticksInfo = {
                        majorTickInterval: majorTicksOptions.tickInterval,
                        minorTickInterval: minorTicksOptions.tickInterval,
                        majorTicks: []
                    };
                self._initializeMajorTicksOptions(dataType, min, max, screenDelta, ticksInfo, majorTicksOptions);
                if (utils.isDefined(min) && utils.isDefined(max)) {
                    ticksInfo.majorTicks.push(min);
                    ticksInfo.majorTicks.push(self._nextTick(min, ticksInfo.majorTickInterval, {
                        min: min,
                        max: max,
                        setTicksAtUnitBeginning: majorTicksOptions.setTicksAtUnitBeginning
                    }));
                    businessDelta = Math.abs(ticksInfo.majorTicks[0] - ticksInfo.majorTicks[1]);
                    self._initializeMinorTicksOptions(dataType, min, max, screenDelta, ticksInfo, minorTicksOptions)
                }
                return ticksInfo
            },
            getFullTicks: function(min, max, screenDelta, majorTicksOptions, minorTicksOptions) {
                var self = this,
                    i,
                    dataType = self._getDataType(min),
                    ticksInfo = {
                        customBoundaryTicks: [],
                        fullTicks: [],
                        majorTickInterval: majorTicksOptions.tickInterval,
                        majorTicks: [],
                        minorTickInterval: minorTicksOptions.tickInterval,
                        minorTicks: []
                    };
                self._initializeMajorTicksOptions(dataType, min, max, screenDelta, ticksInfo, majorTicksOptions);
                ticksInfo.majorTicks = self.getTicks(majorTicksOptions);
                if (utils.isDefined(min) && utils.isDefined(max) && ticksInfo.majorTicks.length > 0) {
                    if (ticksInfo.majorTicks.autoArrangementStep && ticksInfo.majorTicks.autoArrangementStep > 1 && !utils.isDefined(minorTicksOptions.tickInterval) && !utils.isDefined(minorTicksOptions.minorTickCount))
                        minorTicksOptions.tickInterval = ticksInfo.minorTickInterval = majorTicksOptions.tickInterval;
                    self._initializeMinorTicksOptions(dataType, min, max, screenDelta, ticksInfo, minorTicksOptions);
                    self._addLeftBoudedTicks(ticksInfo, min, minorTicksOptions);
                    for (i = 0; i < ticksInfo.majorTicks.length - 1; i++) {
                        ticksInfo.fullTicks.push(ticksInfo.majorTicks[i]);
                        self._addMinorTicks(ticksInfo.majorTicks[i], ticksInfo.majorTicks[i + 1], ticksInfo, minorTicksOptions)
                    }
                    self._addRightBoudedTicks(ticksInfo, max, minorTicksOptions)
                }
                return ticksInfo
            },
            getTicks: function(options) {
                var self = this,
                    step,
                    maxDisplayValue,
                    ticks = options.customTicks ? options.customTicks : self._generateTicks(options);
                if (options.useTicksAutoArrangement) {
                    options.maxDisplayValueSize = self._getValueSize(ticks, options);
                    step = self._getAutoArrangementStep(ticks, options);
                    if (step > 1) {
                        if (utils.isDefined(options.tickInterval) || utils.isDefined(options.customTicks))
                            ticks = self._getAutoArrangementTicks(ticks, options, step);
                        else
                            ticks = self._generateTicks($.extend({}, options, {gridSpacingFactor: options.maxDisplayValueSize}));
                        ticks.autoArrangementStep = step
                    }
                    self._removeInvalidDatesWithUnitBegining(ticks, options)
                }
                return ticks
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file numericTranslatorX.js */
    (function($, DX, undefined) {
        var Class = DX.Class,
            utils = DX.utils,
            math = Math;
        DX.viz.core.NumericTranslatorX = {
            zoomX: function(min, max) {
                var self = this,
                    businessRange = self.businessRange;
                businessRange.minVisibleX = min;
                businessRange.maxVisibleX = max;
                businessRange.applyEqualLimitsMargins();
                self.init()
            },
            translateX: function(bpX) {
                var self = this,
                    ranges = self.businessRange,
                    canvas = self.canvas,
                    result;
                var specialValue = self.translateSpecialCases(self, bpX, "X");
                if (utils.isDefined(specialValue))
                    return specialValue;
                if (bpX < ranges.minX)
                    return null;
                if (bpX > ranges.maxX)
                    return null;
                if (ranges.invertX)
                    result = canvas.left + (1 - (bpX - ranges.minVisibleX) / (ranges.maxVisibleX - ranges.minVisibleX)) * self.width;
                else
                    result = canvas.left + (bpX - ranges.minVisibleX) / (ranges.maxVisibleX - ranges.minVisibleX) * self.width;
                return math.round(result)
            },
            untranslateX: function(posX) {
                var self = this,
                    ranges = self.businessRange,
                    canvas = self.canvas;
                if (posX < canvas.left)
                    return null;
                if (posX > canvas.left + self.width)
                    return null;
                if (ranges.invertX)
                    return ranges.minVisibleX + (self.width - (posX - canvas.left)) * (ranges.maxVisibleX - ranges.minVisibleX) / self.width;
                else
                    return ranges.minVisibleX + (posX - canvas.left) * (ranges.maxVisibleX - ranges.minVisibleX) / self.width
            },
            getIntervalX: function() {
                var self = this,
                    result = 0;
                if (self.businessRange.intervalX !== undefined)
                    result = self.width * self.businessRange.intervalX / (self.businessRange.maxVisibleX - self.businessRange.minVisibleX);
                return Math.round(result)
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file numericTranslatorY.js */
    (function($, DX, undefined) {
        var Class = DX.Class,
            utils = DX.utils,
            math = Math;
        DX.viz.core.NumericTranslatorY = {
            zoomY: function(min, max) {
                var self = this,
                    businessRange = self.businessRange;
                businessRange.minVisibleY = min;
                businessRange.maxVisibleY = max;
                businessRange.applyEqualLimitsMargins();
                self.init()
            },
            translateY: function(bpY) {
                var self = this,
                    ranges = self.businessRange,
                    canvas = self.canvas,
                    result;
                var specialValue = self.translateSpecialCases(self, bpY, "Y");
                if (utils.isDefined(specialValue))
                    return specialValue;
                if (bpY < ranges.minY)
                    return null;
                if (bpY > ranges.maxY)
                    return null;
                if (ranges.invertY)
                    result = canvas.height - canvas.bottom - (1 - (bpY - ranges.minVisibleY) / (ranges.maxVisibleY - ranges.minVisibleY)) * self.height;
                else
                    result = canvas.height - canvas.bottom - (bpY - ranges.minVisibleY) / (ranges.maxVisibleY - ranges.minVisibleY) * self.height;
                return math.round(result)
            },
            untranslateY: function(posY) {
                var self = this,
                    ranges = self.businessRange,
                    canvas = self.canvas;
                if (posY < canvas.top)
                    return null;
                if (posY > canvas.top + self.height)
                    return null;
                if (ranges.invertY)
                    return ranges.maxVisibleY - (self.height - (posY - canvas.top)) * (ranges.maxVisibleY - ranges.minVisibleY) / self.height;
                else
                    return ranges.maxVisibleY - (posY - canvas.top) * (ranges.maxVisibleY - ranges.minVisibleY) / self.height
            },
            getIntervalY: function() {
                var self = this,
                    result = 0;
                if (self.businessRange.intervalY !== undefined)
                    result = self.height * self.businessRange.intervalY / (self.businessRange.maxVisibleY - self.businessRange.minVisibleY);
                return Math.round(result)
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file datetimeTranslatorX.js */
    (function($, DX, undefined) {
        var Class = DX.Class,
            utils = DX.utils,
            math = Math;
        DX.viz.core.DatetimeTranslatorX = {
            zoomX: function(min, max) {
                var self = this,
                    businessRange = self.businessRange;
                businessRange.minVisibleX = min;
                businessRange.maxVisibleX = max;
                businessRange.applyEqualLimitsMargins();
                self.init()
            },
            translateX: function(bpX) {
                var self = this,
                    ranges = self.businessRange,
                    canvas = self.canvas,
                    result;
                var specialValue = self.translateSpecialCases(self, bpX, "X");
                if (utils.isDefined(specialValue))
                    return specialValue;
                if (bpX < ranges.minX)
                    return null;
                if (bpX > ranges.maxX)
                    return null;
                if (ranges.invertX)
                    result = canvas.left + (1 - (bpX - ranges.minVisibleX) / (ranges.maxVisibleX - ranges.minVisibleX)) * self.width;
                else
                    result = canvas.left + (bpX - ranges.minVisibleX) / (ranges.maxVisibleX - ranges.minVisibleX) * self.width;
                return math.round(result)
            },
            untranslateX: function(posX) {
                var self = this,
                    ranges = self.businessRange,
                    canvas = self.canvas;
                if (posX < canvas.left)
                    return null;
                if (posX > canvas.left + self.width)
                    return null;
                if (ranges.invertX)
                    return new Date(ranges.minVisibleX.valueOf() + (self.width - (posX - canvas.left)) * (ranges.maxVisibleX - ranges.minVisibleX) / self.width);
                else
                    return new Date(ranges.minVisibleX.valueOf() + (posX - canvas.left) * (ranges.maxVisibleX - ranges.minVisibleX) / self.width)
            },
            getIntervalX: function() {
                var self = this,
                    result = 0;
                if (self.businessRange.intervalX !== undefined)
                    result = self.width * self.businessRange.intervalX / (self.businessRange.maxVisibleX - self.businessRange.minVisibleX);
                return Math.round(result)
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file datetimeTranslatorY.js */
    (function($, DX, undefined) {
        var Class = DX.Class,
            utils = DX.utils,
            math = Math;
        DX.viz.core.DatetimeTranslatorY = {
            zoomY: function(min, max) {
                var self = this,
                    businessRange = self.businessRange;
                businessRange.minVisibleY = min;
                businessRange.maxVisibleY = max;
                businessRange.applyEqualLimitsMargins();
                self.init()
            },
            translateY: function(bpY) {
                var self = this,
                    ranges = self.businessRange,
                    canvas = self.canvas,
                    result;
                var specialValue = self.translateSpecialCases(self, bpY, "Y");
                if (utils.isDefined(specialValue))
                    return specialValue;
                if (bpY < ranges.minY)
                    return null;
                if (bpY > ranges.maxY)
                    return null;
                if (ranges.invertY)
                    result = canvas.height - canvas.bottom - (1 - (bpY - ranges.minVisibleY) / (ranges.maxVisibleY - ranges.minVisibleY)) * self.height;
                else
                    result = canvas.height - canvas.bottom - (bpY - ranges.minVisibleY) / (ranges.maxVisibleY - ranges.minVisibleY) * self.height;
                return math.round(result)
            },
            untranslateY: function(posY) {
                var self = this,
                    ranges = self.businessRange,
                    canvas = self.canvas;
                if (posY < canvas.top)
                    return null;
                if (posY > canvas.top + self.height)
                    return null;
                if (ranges.invertY)
                    return new Date(ranges.maxVisibleY.valueOf() - (self.height - (posY - canvas.top)) * (ranges.maxVisibleY - ranges.minVisibleY) / self.height);
                else
                    return new Date(ranges.maxVisibleY.valueOf() - (posY - canvas.top) * (ranges.maxVisibleY - ranges.minVisibleY) / self.height)
            },
            getIntervalY: function() {
                var self = this,
                    result = 0;
                if (self.businessRange.intervalY !== undefined)
                    result = self.height * self.businessRange.intervalY / (self.businessRange.maxVisibleY - self.businessRange.minVisibleY);
                return Math.round(result)
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file categoryTranslatorX.js */
    (function($, DX, undefined) {
        var Class = DX.Class,
            utils = DX.utils,
            math = Math;
        DX.viz.core.CategoryTranslatorX = {
            translateX: function(category) {
                var self = this,
                    canvas = self.canvas,
                    categoryRecord,
                    stickX = self.businessRange.stickX,
                    result = 0;
                var specialValue = self.translateSpecialCases(self, category, "X");
                if (utils.isDefined(specialValue))
                    return specialValue;
                categoryRecord = self.categoriesXToPoints[category];
                if (!categoryRecord)
                    return 0;
                if (stickX)
                    result = canvas.left + self.horizontalInterval * categoryRecord.index;
                else
                    result = canvas.left + self.horizontalInterval * (categoryRecord.index + 0.5);
                return math.round(result)
            },
            untranslateX: function(posX) {
                var self = this,
                    ranges = self.businessRange,
                    canvas = self.canvas,
                    result = 0,
                    delta;
                if (posX < canvas.left)
                    return null;
                if (posX > canvas.left + self.width)
                    return null;
                if (ranges.stickX)
                    if (posX < canvas.left + self.horizontalInterval / 2)
                        result = 0;
                    else if (posX > canvas.left + canvas.width - self.horizontalInterval / 2)
                        result = self.categoriesXNumber - 1;
                    else
                        result = math.ceil((posX - canvas.left) / self.horizontalInterval);
                else if (posX === canvas.width - canvas.right)
                    result = math.floor((posX - canvas.left) / self.horizontalInterval) - 1;
                else
                    result = math.floor((posX - canvas.left) / self.horizontalInterval);
                if (ranges.invertX)
                    result = self.categoriesXNumber - result - 1;
                return self.categories[result]
            },
            zoomX: function(min, max) {
                var self = this,
                    businessRange = self.businessRange;
                businessRange.minVisibleX = min;
                businessRange.maxVisibleX = max;
                businessRange.applyEqualLimitsMargins();
                self.init()
            },
            getIntervalX: function() {
                var self = this;
                return self.horizontalInterval
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file categoryTranslatorY.js */
    (function($, DX, undefined) {
        var Class = DX.Class,
            utils = DX.utils,
            math = Math;
        DX.viz.core.CategoryTranslatorY = {
            translateY: function(category) {
                var self = this,
                    canvas = self.canvas,
                    categoryRecord,
                    stickY = self.businessRange.stickY,
                    result = 0;
                var specialValue = self.translateSpecialCases(self, category, "Y");
                if (utils.isDefined(specialValue))
                    return specialValue;
                categoryRecord = self.categoriesYToPoints[category];
                if (!categoryRecord)
                    return 0;
                if (stickY)
                    result = canvas.top + self.verticalInterval * categoryRecord.index;
                else
                    result = canvas.top + self.verticalInterval * (categoryRecord.index + 0.5);
                return math.round(result)
            },
            untranslateY: function(posY) {
                var self = this,
                    ranges = self.businessRange,
                    canvas = self.canvas,
                    result = 0;
                if (posY < canvas.top)
                    return null;
                if (posY > canvas.top + self.height)
                    return null;
                if (ranges.stickY)
                    if (posY < canvas.top + self.verticalInterval / 2)
                        result = 0;
                    else if (posY > canvas.top + canvas.height - self.verticalInterval / 2)
                        result = self.categoriesYNumber - 1;
                    else
                        result = math.ceil((posY - canvas.top) / self.verticalInterval);
                else
                    result = math.ceil((posY - canvas.top) / self.verticalInterval);
                if (ranges.invertY)
                    if (ranges.stickY)
                        result = self.categoriesYNumber - result - 1;
                    else
                        result = self.categoriesYNumber - result;
                return self.categories[result]
            },
            zoomY: function(min, max) {
                var self = this,
                    businessRange = self.businessRange;
                businessRange.minVisibleY = min;
                businessRange.maxVisibleY = max;
                businessRange.applyEqualLimitsMargins();
                self.init()
            },
            getIntervalY: function() {
                var self = this;
                return self.verticalInterval
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file logarithmicTranslatorX.js */
    (function($, DX, undefined) {
        var Class = DX.Class,
            utils = DX.utils,
            math = Math;
        DX.viz.core.LogarifmicTranslatorX = {
            translateX: function(bpX) {
                var self = this,
                    ranges = self.businessRange,
                    canvas = self.canvas,
                    result,
                    power,
                    coef,
                    delta,
                    basePower,
                    coord,
                    startPos;
                var specialValue = self.translateSpecialCases(self, bpX, "X");
                if (utils.isDefined(specialValue))
                    return specialValue;
                if (bpX < ranges.minX)
                    return null;
                if (bpX > ranges.maxX)
                    return null;
                if (utils.isExponential(bpX)) {
                    startPos = bpX.toString().indexOf('e') + 1;
                    basePower = parseInt(bpX.toString().substring(startPos))
                }
                else
                    basePower = math.floor(utils.getLog(bpX, ranges.baseX));
                coef = self.width / (utils.getLog(ranges.maxVisibleX, ranges.baseX) - utils.getLog(ranges.minVisibleX, ranges.baseX));
                delta = basePower - utils.getLog(ranges.minVisibleX, ranges.baseX);
                result = canvas.left + coef * delta + (bpX - utils.raiseTo(basePower, ranges.baseX)) / (utils.raiseTo(basePower + 1, ranges.baseX) - utils.raiseTo(basePower, ranges.baseX)) * coef;
                if (ranges.invertX)
                    return canvas.width - canvas.right - (math.round(result) - canvas.left);
                else
                    return math.round(result)
            },
            untranslateX: function(posX) {
                var self = this,
                    ranges = self.businessRange,
                    canvas = self.canvas,
                    coef,
                    a,
                    delta,
                    coord;
                if (posX < canvas.left)
                    return null;
                if (posX > canvas.left + self.width)
                    return null;
                if (ranges.invertX)
                    coord = canvas.width - canvas.right - posX;
                else
                    coord = posX - canvas.left;
                coef = self.width / (utils.getLog(ranges.maxVisibleX, ranges.baseX) - utils.getLog(ranges.minVisibleX, ranges.baseX));
                a = utils.raiseTo(utils.getLog(ranges.minVisibleX, ranges.baseX) + math.round(coord / coef - 0.01), ranges.baseX);
                delta = utils.raiseTo(utils.getLog(ranges.minVisibleX, ranges.baseX) + math.ceil(coord / coef - 0.01), ranges.baseX) - a;
                return a + (coord - math.round((utils.getLog(a, ranges.baseX) - utils.getLog(ranges.minVisibleX, ranges.baseX)) * coef)) * delta / coef
            },
            getIntervalX: function() {
                var self = this,
                    ranges = self.businessRange,
                    result = 0;
                result = self.width / utils.getLog(ranges.maxVisibleX / ranges.minVisibleX, ranges.baseX) * ((utils.raiseTo(ranges.intervalX, ranges.baseX) - 1) / (ranges.baseX - 1));
                return math.round(result)
            },
            zoomX: function(min, max) {
                var self = this,
                    ranges = self.businessRange,
                    businessRange = self.businessRange,
                    newMinX,
                    newMaxX,
                    coef,
                    delta,
                    basePower,
                    startPos;
                if (utils.isExponential(min)) {
                    startPos = min.toString().indexOf('e') + 1;
                    basePower = parseInt(min.toString().substring(startPos))
                }
                else
                    basePower = math.floor(utils.getLog(min, ranges.baseX));
                newMinX = utils.raiseTo(basePower, ranges.baseX);
                if (utils.isExponential(max)) {
                    startPos = max.toString().indexOf('e') + 1;
                    basePower = parseInt(max.toString().substring(startPos))
                }
                else
                    basePower = math.ceil(utils.getLog(max, ranges.baseX));
                newMaxX = utils.raiseTo(basePower, ranges.baseX);
                businessRange.minVisibleX = newMinX;
                businessRange.maxVisibleX = newMaxX;
                businessRange.applyEqualLimitsMargins();
                self.init()
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file logarithmicTranslatorY.js */
    (function($, DX, undefined) {
        var Class = DX.Class,
            utils = DX.utils,
            math = Math;
        DX.viz.core.LogarifmicTranslatorY = {
            translateY: function(bpY) {
                var self = this,
                    ranges = self.businessRange,
                    canvas = self.canvas,
                    result,
                    basePower,
                    coef,
                    delta,
                    startPos;
                var specialValue = self.translateSpecialCases(self, bpY, "Y");
                if (utils.isDefined(specialValue))
                    return specialValue;
                if (bpY < ranges.minY)
                    return null;
                if (bpY > ranges.maxY)
                    return null;
                if (utils.isExponential(bpY)) {
                    startPos = bpY.toString().indexOf('e') + 1;
                    basePower = parseInt(bpY.toString().substring(startPos))
                }
                else
                    basePower = math.floor(utils.getLog(bpY, ranges.baseY));
                coef = self.height / (utils.getLog(ranges.maxVisibleY, ranges.baseY) - utils.getLog(ranges.minVisibleY, ranges.baseY));
                delta = basePower - utils.getLog(ranges.minVisibleY, ranges.baseY);
                result = canvas.height - canvas.bottom - coef * delta - (bpY - utils.raiseTo(basePower, ranges.baseY)) / (utils.raiseTo(basePower + 1, ranges.baseY) - utils.raiseTo(basePower, ranges.baseY)) * coef;
                if (ranges.invertY)
                    return canvas.height + canvas.top - math.round(result) - canvas.bottom;
                else
                    return math.round(result)
            },
            untranslateY: function(posY) {
                var self = this,
                    ranges = self.businessRange,
                    canvas = self.canvas,
                    coef,
                    a,
                    delta,
                    coord;
                if (posY < canvas.top)
                    return null;
                if (posY > canvas.top + self.height)
                    return null;
                if (ranges.invertY)
                    coord = posY - canvas.top;
                else
                    coord = canvas.height - posY - canvas.bottom;
                coef = self.height / (utils.getLog(ranges.maxVisibleY, ranges.baseY) - utils.getLog(ranges.minVisibleY, ranges.baseY));
                a = utils.raiseTo(utils.getLog(ranges.minVisibleY, ranges.baseY) + math.round(coord / coef - 0.1), ranges.baseY);
                delta = utils.raiseTo(utils.getLog(ranges.minVisibleY, ranges.baseY) + math.ceil(coord / coef - 0.1), ranges.baseY) - a;
                return a + (coord - math.round((utils.getLog(a, ranges.baseY) - utils.getLog(ranges.minVisibleY, ranges.baseY)) * coef)) * delta / coef
            },
            getIntervalY: function(self) {
                var self = this,
                    ranges = self.businessRange,
                    result = 0;
                result = self.height / (utils.getLog(self.businessRange.maxVisibleY, ranges.baseY) - utils.getLog(self.businessRange.minVisibleY, ranges.baseY));
                return math.round(result)
            },
            zoomY: function(min, max) {
                var self = this,
                    ranges = self.businessRange,
                    businessRange = self.businessRange,
                    newMinY,
                    newMaxY,
                    coef,
                    delta,
                    basePower,
                    startPos;
                if (utils.isExponential(min)) {
                    startPos = min.toString().indexOf('e') + 1;
                    basePower = parseInt(min.toString().substring(startPos))
                }
                else
                    basePower = math.floor(utils.getLog(min, ranges.baseY));
                newMinY = utils.raiseTo(basePower, ranges.baseY);
                if (utils.isExponential(max)) {
                    startPos = max.toString().indexOf('e') + 1;
                    basePower = parseInt(max.toString().substring(startPos))
                }
                else
                    basePower = math.ceil(utils.getLog(max, ranges.baseY));
                newMaxY = utils.raiseTo(basePower, ranges.baseY);
                businessRange.minVisibleY = newMinY;
                businessRange.maxVisibleY = newMaxY;
                businessRange.applyEqualLimitsMargins();
                self.init()
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file translator1D.js */
    (function(DX, undefined) {
        var NaN = window.NaN,
            Number = window.Number;
        DX.viz.core.Translator1D = DX.Class.inherit({
            ctor: function(domainStart, domainEnd, codomainStart, codomainEnd) {
                DX.utils.debug.assertParam(domainStart, 'domainStart was not passed');
                DX.utils.debug.assertParam(domainEnd, 'domainEnd was not passed');
                DX.utils.debug.assertParam(codomainStart, 'codomainStart was not passed');
                DX.utils.debug.assertParam(codomainEnd, 'codomainEnd was not passed');
                this.setup({
                    domainStart: domainStart,
                    domainEnd: domainEnd,
                    codomainStart: codomainStart,
                    codomainEnd: codomainEnd
                })
            },
            setup: function(settings) {
                var self = this;
                settings = settings || {};
                self._domainStart = Number(settings.domainStart);
                self._domainEnd = Number(settings.domainEnd);
                self._codomainStart = Number(settings.codomainStart);
                self._codomainEnd = Number(settings.codomainEnd);
                self._domainDelta = self._domainEnd - self._domainStart;
                self._codomainDelta = self._codomainEnd - self._codomainStart;
                return self
            },
            getDomainStart: function() {
                return this._domainStart
            },
            getDomainEnd: function() {
                return this._domainEnd
            },
            getCodomainStart: function() {
                return this._codomainStart
            },
            getCodomainEnd: function() {
                return this._codomainEnd
            },
            getDomainRange: function() {
                return this._domainDelta
            },
            getCodomainRange: function() {
                return this._codomainDelta
            },
            translate: function(value) {
                var self = this,
                    ratio = (value - self._domainStart) / self._domainDelta;
                return 0 <= ratio && ratio <= 1 ? self._codomainStart + ratio * self._codomainDelta : NaN
            },
            adjust: function(value) {
                var self = this,
                    ratio = (value - self._domainStart) / self._domainDelta,
                    result = NaN;
                if (ratio < 0)
                    result = self._domainStart;
                else if (ratio > 1)
                    result = self._domainEnd;
                else if (0 <= ratio && ratio <= 1)
                    result = Number(value);
                return result
            }
        })
    })(DevExpress);
    /*! Module viz-core, file translator2D.js */
    (function($, DX, undefined) {
        var utils = DX.utils,
            core = DX.viz.core,
            CANVAS_PROP = ['width', 'height', 'left', 'top', 'bottom', 'right'];
        core.Translator2D = DX.Class.inherit(function() {
            var ctor = function(businessRanges, canvas) {
                    this.canvas = validateCanvas(canvas);
                    this.updateBusinessRange(businessRanges)
                };
            var validateCanvas = function(canvas) {
                    $.each(CANVAS_PROP, function(_, prop) {
                        var val = canvas[prop];
                        canvas[prop] = parseInt(val) || 0
                    });
                    return canvas
                };
            var dispose = function() {
                    var _this = this;
                    _this.canvas = null;
                    _this.businessRange.dispose();
                    _this.businessRange = null;
                    _this.categoriesXToPoints = null;
                    _this.categoriesYToPoints = null;
                    _this.categories = null
                };
            var init = function() {
                    var self = this,
                        canvas = self.canvas,
                        range = self.businessRange,
                        i,
                        category;
                    self.width = canvas.width - canvas.left - canvas.right;
                    self.height = canvas.height - canvas.top - canvas.bottom;
                    self.set('X');
                    self.set('Y')
                };
            var set = function(type) {
                    var self = this,
                        range = self.businessRange,
                        categories = self.businessRange['categories' + type],
                        script,
                        size,
                        position;
                    if (type === 'X') {
                        size = 'width';
                        position = 'horizontal'
                    }
                    else {
                        size = 'height';
                        position = 'vertical'
                    }
                    switch (range['axisType' + type]) {
                        case'logarithmic':
                            script = core['LogarifmicTranslator' + type];
                            break;
                        case'numeric':
                            script = core['NumericTranslator' + type];
                            break;
                        case'categories':
                            script = core['CategoryTranslator' + type];
                            self['categories' + type + 'Number'] = categories.length;
                            self.categories = categories;
                            if (range['stick' + type])
                                self[position + 'Interval'] = self[size] / (self['categories' + type + 'Number'] - 1);
                            else
                                self[position + 'Interval'] = self[size] / self['categories' + type + 'Number'];
                            self['categories' + type + 'ToPoints'] = makeCategoriesToPoints(categories, self.businessRange['invert' + type]);
                            break;
                        case'datetime':
                            script = core['DatetimeTranslator' + type];
                            break;
                        default:
                            if (categories) {
                                script = core['CategoryTranslator' + type];
                                self['categories' + type + 'Number'] = categories.length;
                                if (range['stick' + type])
                                    self[position + 'Interval'] = self[size] / (self['categories' + type + 'Number'] - 1);
                                else
                                    self[position + 'Interval'] = self[size] / self['categories' + type + 'Number'];
                                self['categories' + type + 'ToPoints'] = makeCategoriesToPoints(categories, self.businessRange['invert' + type]);
                                range['axisType' + type] = 'categories'
                            }
                            else if (utils.isNumber(range['min' + type])) {
                                script = core['NumericTranslator' + type];
                                range['axisType' + type] = 'numeric'
                            }
                            else if (utils.isDate(range['min' + type])) {
                                script = core['DatetimeTranslator' + type];
                                range['axisType' + type] = 'datetime'
                            }
                            break
                    }
                    if (script === undefined)
                        script = core['NumericTranslator' + type];
                    self['zoom' + type] = script['zoom' + type];
                    self['translate' + type] = script['translate' + type];
                    self['getInterval' + type] = script['getInterval' + type];
                    self['untranslate' + type] = script['untranslate' + type]
                };
            var updateBusinessRange = function(businessRange) {
                    this.businessRange = businessRange;
                    if (businessRange.minVisibleX === undefined)
                        businessRange.minVisibleX = businessRange.minX;
                    if (businessRange.maxVisibleX === undefined)
                        businessRange.maxVisibleX = businessRange.maxX;
                    if (businessRange.minVisibleY === undefined)
                        businessRange.minVisibleY = businessRange.minY;
                    if (businessRange.maxVisibleY === undefined)
                        businessRange.maxVisibleY = businessRange.maxY;
                    this.init()
                };
            var getBusinessRange = function() {
                    return this.businessRange
                };
            var getBusinessVisibleArea = function() {
                    var range = this.businessRange,
                        visibleArea = {};
                    visibleArea.minX = range.minVisibleX;
                    visibleArea.maxX = range.maxVisibleX;
                    visibleArea.minY = range.minVisibleY;
                    visibleArea.maxY = range.maxVisibleY;
                    visibleArea.axisTypeX = range.axisTypeX;
                    visibleArea.axisTypeY = range.axisTypeY;
                    if (visibleArea.axisTypeX === 'logarithmic')
                        visibleArea.baseX = range.baseX;
                    if (visibleArea.axisTypeY === 'logarithmic')
                        visibleArea.baseY = range.baseY;
                    if (range.categoriesX) {
                        visibleArea.categoriesX = range.categoriesX;
                        visibleArea.minCategoryXPos = 0;
                        visibleArea.maxCategoryXPos = visibleArea.minCategoryXPos + visibleArea.categoriesX.length - 1
                    }
                    if (range.categoriesY) {
                        visibleArea.categoriesY = range.categoriesY;
                        visibleArea.minCategoryYPos = 0;
                        visibleArea.maxCategoryYPos = visibleArea.minCategoryYPos + visibleArea.categoriesY.length - 1
                    }
                    return visibleArea
                };
            var getCanvasVisibleArea = function() {
                    var canvas = this.canvas;
                    return {
                            minX: canvas.left,
                            maxX: canvas.width - canvas.right,
                            minY: canvas.top,
                            maxY: canvas.height - canvas.bottom
                        }
                };
            var makeCategoriesToPoints = function(categories, invert) {
                    var categoriesToPoints = {},
                        category,
                        i;
                    if (invert)
                        for (i = categories.length - 1; i >= 0; i--) {
                            category = categories[categories.length - 1 - i];
                            categoriesToPoints[category] = {
                                name: category,
                                index: i
                            }
                        }
                    else
                        for (i = 0; i < categories.length; i++) {
                            category = categories[i];
                            categoriesToPoints[category] = {
                                name: category,
                                index: i
                            }
                        }
                    return categoriesToPoints
                };
            var translateSpecialCases = function(self, value, position) {
                    var parsedValue = (value + '').match(/canvas_position_(.*)/),
                        canvas = self.canvas,
                        categoryRecord,
                        range = self.businessRange;
                    if (parsedValue) {
                        value = parsedValue[1];
                        if (value === 'default') {
                            if (range['minVisible' + position] <= 0 && 0 <= range['maxVisible' + position])
                                return self['translate' + position](0);
                            if (position === 'X')
                                if (range.invertX)
                                    return canvas.left + self.width;
                                else
                                    return canvas.left;
                            else if (range.invertY)
                                return canvas.top;
                            else
                                return canvas.top + self.height
                        }
                        if (position === "X") {
                            if (value === 'left')
                                return canvas.left;
                            if (value === 'center')
                                return canvas.left + self.width / 2;
                            if (value === 'right')
                                return canvas.left + self.width
                        }
                        else {
                            if (value === 'bottom')
                                return canvas.top + self.height;
                            if (value === 'middle')
                                return canvas.top + self.height / 2;
                            if (value === 'top')
                                return canvas.top
                        }
                    }
                    return null
                };
            var prototypeObject = {
                    ctor: ctor,
                    dispose: dispose,
                    init: init,
                    makeCategoriesToPoints: makeCategoriesToPoints,
                    translateSpecialCases: translateSpecialCases,
                    getCanvasVisibleArea: getCanvasVisibleArea,
                    getBusinessVisibleArea: getBusinessVisibleArea,
                    updateBusinessRange: updateBusinessRange,
                    getBusinessRange: getBusinessRange
                };
            prototypeObject.set = set;
            return prototypeObject
        }())
    })(jQuery, DevExpress);
    /*! Module viz-core, file rectangle.js */
    (function(DX, undefined) {
        var isFinite = window.isFinite;
        DX.viz.core.Rectangle = DX.Class.inherit({
            ctor: function(options) {
                var self = this;
                options = options || {};
                self.left = Number(options.left) || 0;
                self.right = Number(options.right) || 0;
                self.top = Number(options.top) || 0;
                self.bottom = Number(options.bottom) || 0
            },
            width: function() {
                return this.right - this.left
            },
            height: function() {
                return this.bottom - this.top
            },
            horizontalMiddle: function() {
                return (this.left + this.right) / 2
            },
            verticalMiddle: function() {
                return (this.top + this.bottom) / 2
            },
            raw: function() {
                var self = this;
                return {
                        left: self.left,
                        top: self.top,
                        right: self.right,
                        bottom: self.bottom
                    }
            },
            clone: function() {
                return new this.constructor(this.raw())
            },
            move: function(dx, dy) {
                var result = this.clone();
                if (isFinite(dx) && isFinite(dy)) {
                    result.left += Number(dx);
                    result.right += Number(dx);
                    result.top += Number(dy);
                    result.bottom += Number(dy)
                }
                return result
            },
            inflate: function(dx, dy) {
                var result = this.clone();
                if (isFinite(dx) && isFinite(dy)) {
                    result.left -= Number(dx);
                    result.right += Number(dx);
                    result.top -= Number(dy);
                    result.bottom += Number(dy)
                }
                return result
            },
            scale: function(factor) {
                var self = this;
                if (factor > 0)
                    return self.inflate(self.width() * (factor - 1) / 2, self.height() * (factor - 1) / 2);
                return self.clone()
            }
        })
    })(DevExpress);
    /*! Module viz-core, file themes.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            core = viz.core;
        var currentThemeId = 0;
        var findThemeId = function(themeName) {
                var themeId,
                    themes = viz.themes;
                for (themeId = 0; themeId < themes.length; themeId++)
                    if (themes[themeId].name === themeName)
                        return themeId;
                return -1
            };
        core.findTheme = function(themeName) {
            var themeId = findThemeId(themeName),
                themes = viz.themes;
            if (themeId < 0)
                themeId = currentThemeId;
            return themes[themeId]
        };
        core.currentTheme = function(themeName, colorScheme) {
            var themeId = -1,
                themes = viz.themes;
            if (themeName === undefined)
                return themes[currentThemeId].name;
            else {
                if (colorScheme)
                    themeId = findThemeId(themeName + '-' + colorScheme);
                if (themeId < 0)
                    themeId = findThemeId(themeName);
                currentThemeId = themeId >= 0 ? themeId : 0
            }
        };
        core.registerTheme = function(theme, basedOnThemeName) {
            var baseTheme,
                extendedTheme,
                themes = viz.themes;
            if (!theme || !theme.name || !core.findTheme(theme.name))
                return;
            baseTheme = core.findTheme(basedOnThemeName);
            if (baseTheme) {
                extendedTheme = $.extend(true, {}, baseTheme, theme);
                themes.push(extendedTheme)
            }
            else
                themes.push(theme)
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file palette.js */
    (function($, DX, undefined) {
        var core = DX.viz.core;
        core.palettes = {
            'default': ['#5F8B95', '#BA4D51', '#AF8A53', '#955F71', '#859666', '#7E688C'],
            'harmony light': ['#FCB65E', '#679EC5', '#AD79CE', '#A6C567', '#E18E92', '#DDED6E', '#B7ABEA', '#A8E7E3'],
            'soft pastel': ['#7CBAB4', '#92C7E2', '#75B5D6', '#B78C9B', '#F2CA84', '#A7CA74'],
            pastel: ['#bb7862', '#a4d5c2', '#bb626a', '#057d85', '#a12135', '#f5e7c9', '#153459', '#b1d2c6'],
            bright: ['#70c92f', '#f8ca00', '#e97f02', '#bd1550', '#800969', '#7e4452', '#9ab57e', '#36a3a6'],
            soft: ['#ebdd8f', '#9ab57e', '#e55253', '#7e4452', '#e8c267', '#565077', '#6babac', '#7e4452'],
            ocean: ['#75c099', '#cff499', '#378a8a', '#a5dda5', '#064970', '#38c5d2', '#00a7c6', '#a2cefb'],
            vintage: ['#ebb192', '#f2d1b5', '#cb715e', '#eb9692', '#a85c4c', '#f2c0b5', '#f6ead7', '#dd956c'],
            'vintage_desktop-dark': ['#e4a58b', '#edc4a8', '#be7060', '#e48e8b', '#9d5f51', '#edb2a8', '#f3e3cb', '#dd956c'],
            violet: ['#d1a1d1', '#f5ccdb', '#7b5685', '#7e7cad', '#55263f', '#5b41ab', '#d9d3d9', '#689cc1']
        };
        core.findPalette = function(paletteName, theme) {
            paletteName = String(paletteName).toLowerCase();
            theme && (theme = String(theme).toLowerCase());
            var basePalette = core.palettes[paletteName];
            return core.palettes[paletteName + '_' + theme] || basePalette
        };
        core.registerPalette = function(paletteName, palette, theme) {
            paletteName = String(paletteName).toLowerCase();
            theme && (paletteName = paletteName + '_' + String(theme).toLowerCase());
            return core.palettes[paletteName] = palette
        };
        function RingBuf(buf) {
            var ind = 0;
            this.next = function() {
                var res = buf[ind++];
                if (ind == buf.length)
                    this.reset();
                return res
            };
            this.reset = function() {
                ind = 0
            }
        }
        core.Palette = DX.Class.inherit({
            ctor: function(palette, stepHighlight, theme) {
                var self = this;
                self.currentColor = 0;
                self.stepHighlight = stepHighlight || 0;
                if ($.isArray(palette))
                    self.originalPalette = palette;
                else {
                    self.originalPalette = core.findPalette(palette, theme);
                    if (!self.originalPalette)
                        self.originalPalette = core.palettes['default']
                }
                self.palette = self.originalPalette.slice(0);
                self.paletteActions = new RingBuf(['highlight', 'highlight', 'darken', 'darken'])
            },
            dispose: function() {
                this.originalPalette = null;
                this.palette = null;
                this.paletteActions = null
            },
            getNextColor: function() {
                var self = this,
                    palette = self.palette,
                    color = palette[self.currentColor],
                    action;
                self.currentColor++;
                if (self.currentColor >= palette.length) {
                    self.currentColor = 0;
                    if (self.stepHighlight) {
                        action = self.paletteActions.next();
                        for (var i = 0; i < palette.length; i++)
                            palette[i] = new DX.Color(palette[i])[action](self.stepHighlight)
                    }
                }
                return color
            },
            reset: function() {
                this.currentColor = 0;
                this.palette = this.originalPalette.slice(0);
                this.paletteActions.reset()
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file baseThemeManager.js */
    (function($, DX, undefined) {
        var core = DX.viz.core,
            IE8 = 'IE8';
        core.BaseThemeManager = DX.Class.inherit({
            ctor: function(userTheme, themeGroupName) {
                userTheme = userTheme || {};
                var _this = this,
                    themeName = typeof userTheme === 'string' ? userTheme : userTheme.name,
                    theme = core.findTheme(themeName);
                _this.themeName = theme.name;
                _this.font = $.extend(true, {}, theme.font, userTheme.font || {});
                if (themeGroupName && theme)
                    $.each(themeGroupName.split('.'), function() {
                        if (_this.isIE8)
                            theme[this + IE8] && $.extend(true, theme[this], theme[this + IE8]);
                        theme = theme[this]
                    });
                _this.theme = $.extend(true, {}, theme || {}, typeof userTheme === 'string' ? {} : userTheme)
            },
            dispose: function() {
                this.font = this.theme = this.themeName = null
            },
            initializeFont: function(fontOptions) {
                $.extend(fontOptions, this.font, $.extend({}, fontOptions))
            },
            applyTheme: function(theme, userOptions) {
                return $.extend(true, {}, theme, userOptions || {})
            },
            getTheme: function() {
                return this.theme
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file textCloud.js */
    (function(DX, undefined) {
        var min = Math.min;
        DX.viz.core.TextCloud = DX.Class.inherit(function() {
            var DEFAULT_OPTIONS = {
                    horMargin: 8,
                    verMargin: 4,
                    tailLength: 10
                };
            var COEFFICIENTS_MAP = {};
            COEFFICIENTS_MAP['right-bottom'] = COEFFICIENTS_MAP['rb'] = [0, -1, -1, 0, 0, 1, 1, 0];
            COEFFICIENTS_MAP['bottom-right'] = COEFFICIENTS_MAP['br'] = [-1, 0, 0, -1, 1, 0, 0, 1];
            COEFFICIENTS_MAP['left-bottom'] = COEFFICIENTS_MAP['lb'] = [0, -1, 1, 0, 0, 1, -1, 0];
            COEFFICIENTS_MAP['bottom-left'] = COEFFICIENTS_MAP['bl'] = [1, 0, 0, -1, -1, 0, 0, 1];
            COEFFICIENTS_MAP['left-top'] = COEFFICIENTS_MAP['lt'] = [0, 1, 1, 0, 0, -1, -1, 0];
            COEFFICIENTS_MAP['top-left'] = COEFFICIENTS_MAP['tl'] = [1, 0, 0, 1, -1, 0, 0, -1];
            COEFFICIENTS_MAP['right-top'] = COEFFICIENTS_MAP['rt'] = [0, 1, -1, 0, 0, -1, 1, 0];
            COEFFICIENTS_MAP['top-right'] = COEFFICIENTS_MAP['tr'] = [-1, 0, 0, 1, 1, 0, 0, -1];
            return {
                    setup: function(options) {
                        var self = this,
                            ops = $.extend({}, DEFAULT_OPTIONS, options),
                            x = ops.x,
                            y = ops.y,
                            type = COEFFICIENTS_MAP[ops.type],
                            cloudWidth = ops.textWidth + 2 * ops.horMargin,
                            cloudHeight = ops.textHeight + 2 * ops.verMargin,
                            tailWidth = ops.tailLength,
                            tailHeight = tailWidth,
                            cx = x,
                            cy = y;
                        if (type[0] & 1)
                            tailHeight = min(tailHeight, cloudHeight / 3);
                        else
                            tailWidth = min(tailWidth, cloudWidth / 3);
                        self._points = [x, y, x += type[0] * (cloudWidth + tailWidth), y += type[1] * (cloudHeight + tailHeight), x += type[2] * cloudWidth, y += type[3] * cloudHeight, x += type[4] * cloudWidth, y += type[5] * cloudHeight, x += type[6] * (cloudWidth - tailWidth), y += type[7] * (cloudHeight - tailHeight)];
                        self._cx = cx + type[0] * tailWidth + (type[0] + type[2]) * cloudWidth / 2;
                        self._cy = cy + type[1] * tailHeight + (type[1] + type[3]) * cloudHeight / 2;
                        self._cloudWidth = cloudWidth;
                        self._cloudHeight = cloudHeight;
                        self._tailLength = ops.tailLength;
                        return self
                    },
                    points: function() {
                        return this._points.slice(0)
                    },
                    cx: function() {
                        return this._cx
                    },
                    cy: function() {
                        return this._cy
                    },
                    width: function() {
                        return this._cloudWidth
                    },
                    height: function() {
                        return this._cloudHeight
                    },
                    tailLength: function() {
                        return this._tailLength
                    }
                }
        }())
    })(DevExpress);
    /*! Module viz-core, file parseUtils.js */
    (function($, DX) {
        var viz = DX.viz,
            core = viz.core,
            Class = DX.Class,
            isDefined = DX.utils.isDefined;
        var parseUtils = Class.inherit({
                ctor: function(options) {
                    options = options || {};
                    this._incidentOccured = $.isFunction(options.incidentOccured) ? options.incidentOccured : $.noop
                },
                correctValueType: function(type) {
                    return type === 'numeric' || type === 'datetime' || type === 'string' ? type : ''
                },
                _parsers: {
                    string: function(val) {
                        return isDefined(val) ? '' + val : val
                    },
                    numeric: function(val) {
                        if (!isDefined(val))
                            return val;
                        var parsedVal = Number(val);
                        if (isNaN(parsedVal))
                            parsedVal = undefined;
                        return parsedVal
                    },
                    datetime: function(val) {
                        if (!isDefined(val))
                            return val;
                        var parsedVal,
                            numVal = Number(val);
                        if (!isNaN(numVal))
                            parsedVal = new Date(numVal);
                        else
                            parsedVal = new Date(val);
                        if (isNaN(Number(parsedVal)))
                            parsedVal = undefined;
                        return parsedVal
                    }
                },
                getParser: function(valueType, entity) {
                    var self = this,
                        parser,
                        message = 'valueType is unknown.';
                    if (entity)
                        message = 'The type specified as the "valueType" field of the ' + entity + ' configuration object is unknown.';
                    valueType = self.correctValueType(valueType);
                    parser = self._parsers[valueType];
                    if (!parser)
                        this._incidentOccured.call(null, message);
                    return parser || $.noop
                }
            });
        core.ParseUtils = parseUtils
    })(jQuery, DevExpress);
    /*! Module viz-core, file loadIndicatorAPI.js */
    (function($, DX) {
        var viz = DX.viz,
            core = viz.core;
        var LoadIndicator = DX.Class.inherit({
                ctor: function(options, canvas) {
                    options = options || {};
                    this.$canvas = $(canvas);
                    this._updateContainer()
                },
                _updateRenderer: function() {
                    if (this._renderer)
                        this._renderer.recreateCanvas(this.canvasWidth, this.canvasHeight);
                    else if (this.image[0]) {
                        this._renderer = new viz.renderers.Renderer({
                            width: this.canvasWidth,
                            height: this.canvasHeight
                        });
                        this._renderer.draw(this.image[0])
                    }
                    return this._renderer
                },
                _draw: function(renderer) {
                    var baseLineSettings,
                        yellow = 0,
                        color;
                    if (!this._group && renderer) {
                        this._group = renderer.createGroup();
                        baseLineSettings = {
                            stroke: 'red',
                            strokeWidth: 3,
                            fill: 'red',
                            opacity: 1
                        };
                        for (var i = 0; i < 360; i += 20) {
                            color = 'rgb(255, ' + (yellow += i / 10) + ', 0)';
                            baseLineSettings.stroke = color;
                            baseLineSettings.fill = color;
                            baseLineSettings.rotate = -i;
                            renderer.createLine(0, -35, 0, -22, baseLineSettings).append(this._group)
                        }
                        this._group.append()
                    }
                    else if (this._group) {
                        this._group.move(this.canvasWidth / 2, this.canvasHeight / 2);
                        this._group.animate({rotate: {
                                angle: 360,
                                x: 0,
                                y: 0
                            }}, {
                            easing: 'linear',
                            repeatCount: Infinity
                        })
                    }
                },
                _updateContainer: function(width, height) {
                    var imageTop,
                        renderer;
                    width = width || this.$canvas.width();
                    height = height || this.$canvas.height();
                    this.container = this.container || $('<div>', {css: {position: 'relative'}}).appendTo(this.$canvas);
                    if (this.$canvas[0])
                        imageTop = this.$canvas.offset().top - this.container.offset().top;
                    else
                        imageTop = -height;
                    if (this.canvasWidth !== width || this.canvasHeight !== height) {
                        if (this.image)
                            this.image.css({
                                top: imageTop,
                                width: width,
                                height: height
                            });
                        else if (!this.image) {
                            this.container.hide();
                            this.image = $('<div>', {css: {
                                    position: 'absolute',
                                    left: 0,
                                    top: imageTop,
                                    width: width,
                                    height: height,
                                    backgroundColor: '#ffffff',
                                    opacity: 0.85
                                }}).appendTo(this.container)
                        }
                        this.canvasWidth = width;
                        this.canvasHeight = height;
                        renderer = this._updateRenderer()
                    }
                    this._draw(renderer)
                },
                show: function(width, height) {
                    this.container.show();
                    this._updateContainer(width, height)
                },
                hide: function() {
                    this.container.hide();
                    this._renderer && this._renderer.stopAllAnimations()
                }
            });
        core.loadIndicatorAPI = {
            base: {
                showLoadIndicator: function() {
                    var canvas = this.canvas || {};
                    this._loadIndicator = this._loadIndicator || new LoadIndicator({}, this._element()[0]);
                    this._loadIndicator.show(canvas.width, canvas.height)
                },
                hideLoadIndicator: function() {
                    this._loadIndicator && this._loadIndicator.hide()
                }
            },
            gauge: {
                showLoadIndicator: function() {
                    var canvas = this._getCanvas() || {};
                    this._loadIndicator = this._loadIndicator || new LoadIndicator({}, this._element()[0]);
                    this._loadIndicator.show(canvas.width, canvas.height)
                },
                hideLoadIndicator: function() {
                    this._loadIndicator && this._loadIndicator.hide()
                }
            }
        };
        core._LoadIndicator = LoadIndicator;
        core.__setMockLoadIndicator = function(mockLoadIndicator) {
            LoadIndicator = mockLoadIndicator
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file default.js */
    (function($, DX, undefined) {
        DX.viz.themes = DX.viz.themes || [];
        var fontFamilyDefault = "'Segoe UI', 'Helvetica Neue', 'Trebuchet MS', Verdana",
            fontFamilyLight = "'Segoe UI Light', 'Helvetica Neue Light', 'Segoe UI', 'Helvetica Neue', 'Trebuchet MS', Verdana";
        DX.viz.themes.push({
            name: 'desktop',
            font: {
                color: '#808080',
                opacity: 0.75,
                family: fontFamilyDefault,
                weight: 400,
                size: 12,
                cursor: 'default'
            },
            chart: {
                containerBackgroundColor: '#ffffff',
                defaultPalette: 'default',
                commonSeriesSettings: {
                    border: {
                        visible: false,
                        width: 2
                    },
                    hoverMode: 'excludePoints',
                    selectionMode: 'includePoints',
                    hoverStyle: {
                        hatching: {
                            direction: 'right',
                            width: 2,
                            step: 6,
                            opacity: 0.75
                        },
                        border: {
                            visible: false,
                            width: 3
                        }
                    },
                    selectionStyle: {
                        hatching: {
                            direction: 'right',
                            width: 2,
                            step: 6,
                            opacity: 0.5
                        },
                        border: {
                            visible: false,
                            width: 3
                        }
                    },
                    point: {
                        visible: true,
                        symbol: 'circle',
                        size: 6,
                        border: {
                            visible: false,
                            width: 1
                        },
                        hoverMode: 'onlyPoint',
                        selectionMode: 'onlyPoint',
                        hoverStyle: {
                            border: {
                                visible: true,
                                width: 4
                            },
                            size: 6
                        },
                        selectionStyle: {
                            border: {
                                visible: true,
                                width: 4
                            },
                            size: 6
                        }
                    },
                    label: {
                        font: {
                            color: '#ffffff',
                            opacity: 1
                        },
                        border: {
                            visible: false,
                            width: 1,
                            color: '#808080',
                            dashStyle: 'solid'
                        },
                        connector: {
                            visible: false,
                            width: 1
                        }
                    },
                    scatter: {},
                    line: {
                        width: 2,
                        dashStyle: 'solid',
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: 'none'}
                        },
                        selectionStyle: {width: 3}
                    },
                    stackedline: {
                        width: 2,
                        dashStyle: 'solid',
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: 'none'}
                        },
                        selectionStyle: {width: 3}
                    },
                    fullstackedline: {
                        width: 2,
                        dashStyle: 'solid',
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: 'none'}
                        },
                        selectionStyle: {width: 3}
                    },
                    stepline: {
                        width: 2,
                        dashStyle: 'solid',
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: 'none'}
                        },
                        selectionStyle: {width: 3}
                    },
                    area: {point: {visible: false}},
                    stackedarea: {point: {visible: false}},
                    fullstackedarea: {point: {visible: false}},
                    steparea: {
                        border: {
                            visible: true,
                            width: 2
                        },
                        point: {visible: false},
                        hoverStyle: {border: {
                                visible: true,
                                width: 3
                            }},
                        selectionStyle: {border: {
                                visible: true,
                                width: 3
                            }}
                    },
                    spline: {
                        width: 2,
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: 'none'}
                        },
                        selectionStyle: {width: 3}
                    },
                    splinearea: {point: {visible: false}},
                    bar: {
                        cornerRadius: 0,
                        point: {
                            hoverStyle: {border: {visible: false}},
                            selectionStyle: {border: {visible: false}}
                        }
                    },
                    stackedbar: {
                        cornerRadius: 0,
                        point: {
                            hoverStyle: {border: {visible: false}},
                            selectionStyle: {border: {visible: false}}
                        }
                    },
                    fullstackedbar: {
                        cornerRadius: 0,
                        point: {
                            hoverStyle: {border: {visible: false}},
                            selectionStyle: {border: {visible: false}}
                        }
                    },
                    rangebar: {
                        cornerRadius: 0,
                        point: {
                            hoverStyle: {border: {visible: false}},
                            selectionStyle: {border: {visible: false}}
                        }
                    },
                    rangearea: {point: {visible: false}},
                    rangesplinearea: {point: {visible: false}},
                    pie: {
                        border: {
                            visible: false,
                            width: 2,
                            color: '#ffffff'
                        },
                        hoverStyle: {
                            hatching: {
                                direction: 'right',
                                width: 4,
                                step: 10,
                                opacity: 0.75
                            },
                            border: {
                                visible: false,
                                width: 2
                            }
                        },
                        selectionStyle: {
                            hatching: {
                                direction: 'right',
                                width: 4,
                                step: 10,
                                opacity: 0.5
                            },
                            border: {
                                visible: false,
                                width: 2
                            }
                        }
                    },
                    doughnut: {innerRadius: 0.5},
                    bubble: {opacity: 0.5},
                    candlestick: {
                        width: 1,
                        innerColor: '#ffffff',
                        reduction: {color: '#ff0000'},
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: 'none'}
                        },
                        selectionStyle: {width: 3}
                    },
                    stock: {
                        width: 1,
                        reduction: {color: '#ff0000'},
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: 'none'}
                        },
                        selectionStyle: {width: 3}
                    }
                },
                legend: {
                    verticalAlignment: 'top',
                    horizontalAlignment: 'right',
                    position: 'outside',
                    font: {color: '#808080'},
                    visible: true,
                    customizeText: undefined,
                    itemTextPosition: undefined,
                    margin: 20,
                    equalColumnWidth: false,
                    markerSize: 12,
                    backgroundColor: undefined,
                    border: {
                        visible: false,
                        width: 1,
                        color: '#808080',
                        cornerRadius: 0,
                        opacity: 0.35,
                        dashStyle: 'solid'
                    },
                    paddingLeftRight: 20,
                    paddingTopBottom: 15,
                    columnCount: 0,
                    rowCount: 0,
                    columnItemSpacing: 20,
                    rowItemSpacing: 8
                },
                tooltip: {
                    enabled: false,
                    font: {
                        family: fontFamilyLight,
                        weight: 200,
                        size: 26,
                        color: '#ffffff'
                    },
                    shared: false,
                    arrowLength: 10,
                    paddingLeftRight: 22,
                    paddingTopBottom: 6,
                    format: '',
                    argumentFormat: '',
                    precision: 0,
                    argumentPrecision: 0,
                    percentPrecision: 0,
                    customizeText: undefined
                },
                title: {font: {
                        family: fontFamilyLight,
                        weight: 200,
                        color: '#232323',
                        size: 28,
                        opacity: 1
                    }},
                crosshair: {
                    enabled: false,
                    color: '#808080',
                    width: 1,
                    dashStyle: 'solid',
                    opacity: 0.45,
                    verticalLine: {visible: true},
                    horizontalLine: {visible: true}
                },
                commonAxisSettings: {
                    discreteAxisDivisionMode: 'betweenLabels',
                    visible: false,
                    color: '#808080',
                    opacity: 0.35,
                    width: 1,
                    multipleAxesSpacing: 5,
                    label: {
                        visible: true,
                        overlappingBehavior: {
                            mode: 'auto',
                            rotationAngle: 90,
                            staggeringSpacing: 5
                        },
                        precision: 0,
                        format: '',
                        customizeText: undefined,
                        indentFromAxis: 10
                    },
                    grid: {
                        visible: false,
                        color: '#808080',
                        opacity: 0.35,
                        width: 1
                    },
                    tick: {
                        visible: false,
                        color: '#808080',
                        opacity: 0.35
                    },
                    title: {
                        font: {size: 16},
                        margin: 10
                    },
                    stripStyle: {
                        paddingLeftRight: 10,
                        paddingTopBottom: 5
                    },
                    constantLineStyle: {
                        paddingLeftRight: 10,
                        paddingTopBottom: 10,
                        width: 1,
                        color: '#000000',
                        dashStyle: 'solid',
                        label: {
                            visible: true,
                            position: 'inside'
                        }
                    }
                },
                horizontalAxis: {
                    isHorizontal: true,
                    position: 'bottom',
                    axisDivisionFactor: 50,
                    label: {alignment: "center"},
                    stripStyle: {label: {
                            horizontalAlignment: 'center',
                            verticalAlignment: 'top'
                        }},
                    constantLineStyle: {label: {
                            horizontalAlignment: 'right',
                            verticalAlignment: 'top'
                        }},
                    constantLines: {}
                },
                verticalAxis: {
                    isHorizontal: false,
                    position: 'left',
                    axisDivisionFactor: 30,
                    label: {
                        alignment: 'right',
                        overlappingBehavior: {mode: 'enlargeTickInterval'}
                    },
                    stripStyle: {label: {
                            horizontalAlignment: 'left',
                            verticalAlignment: 'center'
                        }},
                    constantLineStyle: {label: {
                            horizontalAlignment: 'left',
                            verticalAlignment: 'top'
                        }},
                    constantLines: {}
                },
                argumentAxisStyle: {},
                valueAxisStyle: {grid: {visible: true}},
                commonPaneSettings: {border: {
                        color: '#808080',
                        opacity: 0.35,
                        width: 1
                    }},
                dataPrepareSettings: {
                    checkTypeForAllData: false,
                    convertToAxisDataType: true,
                    sortingMethod: true
                },
                useAggregation: false
            },
            chartIE8: {commonSeriesSettings: {pie: {
                        hoverStyle: {border: {
                                visible: true,
                                color: '#ffffff'
                            }},
                        selectionStyle: {border: {
                                visible: true,
                                color: '#ffffff'
                            }}
                    }}},
            gauge: {
                containerBackgroundColor: '#ffffff',
                scale: {
                    majorTick: {color: '#ffffff'},
                    minorTick: {color: '#ffffff'},
                    label: {font: {color: '#7f7f7f'}}
                },
                rangeContainer: {
                    backgroundColor: '#808080',
                    palette: ['#ad79ce', '#639ec6', '#a5c763', '#ffb65a', '#e78e94']
                },
                valueIndicator: {
                    _default: {color: '#c2c2c2'},
                    rangebar: {
                        color: '#ad79ce',
                        backgroundColor: 'none',
                        text: {font: {
                                size: 14,
                                color: null
                            }}
                    },
                    twocolorneedle: {secondColor: '#e18e92'},
                    twocolorrectangle: {secondColor: '#e18e92'}
                },
                subvalueIndicator: {
                    _default: {color: '#679ec5'},
                    textcloud: {text: {font: {
                                color: '#ffffff',
                                size: 18
                            }}}
                },
                title: {font: {
                        size: 18,
                        color: '#232323',
                        family: fontFamilyLight,
                        weight: 200
                    }},
                subtitle: {font: {
                        size: 14,
                        color: '#232323',
                        family: fontFamilyLight,
                        weight: 200
                    }},
                indicator: {text: {font: {
                            color: '#7f7f7f',
                            size: 18
                        }}},
                tooltip: {font: {
                        color: '#ffffff',
                        size: 26,
                        family: fontFamilyLight,
                        weight: 200
                    }}
            },
            barGauge: {
                valueIndicator: {
                    palette: ['#a6c567', '#679ec5', '#ad79ce', '#fcb65e', '#e18e92'],
                    backgroundColor: '#808080',
                    text: {font: {color: null}}
                },
                title: {font: {
                        size: 18,
                        color: '#232323',
                        family: fontFamilyLight,
                        weight: 200
                    }},
                subtitle: {font: {
                        size: 14,
                        color: '#232323',
                        family: fontFamilyLight,
                        weight: 200
                    }},
                tooltip: {font: {
                        color: '#ffffff',
                        size: 26,
                        family: fontFamilyLight,
                        weight: 200
                    }},
                indicator: {text: {font: {
                            color: '#7f7f7f',
                            size: 18
                        }}}
            },
            rangeSelector: {
                containerBackgroundColor: '#ffffff',
                scale: {
                    label: {
                        topIndent: 7,
                        font: {size: 11}
                    },
                    tick: {
                        width: 1,
                        color: '#000000',
                        opacity: 0.1
                    },
                    marker: {
                        separatorHeight: 33,
                        topIndent: 10,
                        textLeftIndent: 7,
                        textTopIndent: 11
                    }
                },
                sliderMarker: {
                    padding: 7,
                    pointerSize: 6,
                    color: '#9b9b9b',
                    invalidRangeColor: '#ff0000',
                    font: {
                        color: '#ffffff',
                        size: 11
                    }
                },
                sliderHandle: {
                    width: 1,
                    color: '#000000',
                    opacity: 0.1
                },
                shutter: {
                    color: undefined,
                    opacity: 0.75
                },
                background: {color: "#c0bae1"},
                chart: {
                    containerBackgroundColor: undefined,
                    defaultPalette: 'default',
                    commonSeriesSettings: {
                        border: {
                            visible: false,
                            width: 1
                        },
                        hoverStyle: {border: {}},
                        selectionStyle: {border: {}},
                        point: {
                            visible: false,
                            symbol: 'circle',
                            border: {
                                visible: false,
                                width: 1
                            },
                            size: 6,
                            hoverStyle: {border: {}},
                            selectionStyle: {border: {}}
                        },
                        line: {width: 2},
                        stackedline: {width: 2},
                        fullstackedline: {width: 2},
                        area: {},
                        stackedarea: {},
                        fullstackedarea: {},
                        spline: {width: 2},
                        splinearea: {},
                        bar: {cornerRadius: 0},
                        stackedbar: {cornerRadius: 0},
                        fullstackedbar: {cornerRadius: 0},
                        rangebar: {cornerRadius: 0},
                        rangearea: {},
                        rangesplinearea: {},
                        pie: {},
                        candlestick: {
                            width: 1,
                            innerColor: '#ffffff',
                            reduction: {color: '#ff0000'}
                        },
                        stock: {
                            width: 1,
                            reduction: {color: '#ff0000'}
                        }
                    },
                    dataPrepareSettings: {
                        checkTypeForAllData: false,
                        convertToAxisDataType: true,
                        sortingMethod: true
                    },
                    useAggregation: false
                }
            },
            map: {
                background: {
                    borderWidth: 1,
                    borderColor: '#cacaca',
                    color: '#ffffff'
                },
                area: {
                    borderWidth: 1,
                    borderColor: '#ffffff',
                    color: '#d2d2d2',
                    hoveredBorderWidth: 1,
                    hoveredBorderColor: '#303030',
                    selectedBorderWidth: 2,
                    selectedBorderColor: '#303030',
                    hoveredClass: 'dxm-area-hovered',
                    selectedClass: 'dxm-area-selected'
                },
                marker: {
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    color: '#ba4d51',
                    size: 4,
                    extraSize: 13,
                    font: {
                        color: '#2b2b2b',
                        opacity: null,
                        size: 12
                    },
                    hoveredClass: 'dxm-marker-hovered',
                    selectedClass: 'dxm-marker-selected',
                    extraColor: '#ffffff',
                    extraOpacity: 0.32
                },
                controlBar: {
                    borderColor: '#5d5d5d',
                    borderWidth: 3,
                    color: '#ffffff'
                },
                tooltip: {
                    borderWidth: 1,
                    borderColor: '#d7d7d7',
                    color: '#ffffff',
                    font: {
                        color: '#2b2b2b',
                        opacity: null,
                        size: 14
                    }
                },
                legend: {
                    horizontalIndent: 10,
                    verticalIndent: 10,
                    horizontalPadding: 16,
                    verticalPadding: 12,
                    maxWidth: 400,
                    maxHeight: 400,
                    textIndent: 8,
                    itemSpacing: 4,
                    itemSize: 12,
                    borderWidth: 1,
                    borderColor: '#cacaca',
                    opacity: 0.65,
                    color: '#ffffff',
                    font: {
                        color: '#2b2b2b',
                        opacity: null,
                        size: 12
                    }
                }
            },
            sparkline: {
                lineColor: '#666666',
                lineWidth: 2,
                areaOpacity: 0.2,
                minColor: '#e8c267',
                maxColor: '#e55253',
                barPositiveColor: '#a9a9a9',
                barNegativeColor: '#d7d7d7',
                winColor: '#a9a9a9',
                lossColor: '#d7d7d7',
                firstLastColor: '#666666',
                pointSymbol: 'circle',
                pointColor: '#ffffff',
                pointSize: 2,
                tooltip: {
                    enabled: true,
                    allowContainerResizing: true,
                    verticalAlignment: 'top',
                    horizontalAlignment: 'center',
                    format: '',
                    paddingLeftRight: 14,
                    paddingTopBottom: 10,
                    arrowLength: 10,
                    precision: 0,
                    color: '#666666',
                    opacity: 0.9,
                    font: {
                        color: '#ffffff',
                        family: 'Segoe UI',
                        opacity: 1,
                        size: 12,
                        weight: 200
                    }
                }
            },
            bullet: {
                color: '#e8c267',
                targetColor: '#666666',
                targetWidth: 4,
                showTarget: true,
                showZeroLevel: true,
                tooltip: {
                    enabled: true,
                    allowContainerResizing: true,
                    verticalAlignment: 'top',
                    horizontalAlignment: 'center',
                    format: '',
                    precision: 0,
                    paddingLeftRight: 14,
                    paddingTopBottom: 10,
                    arrowLength: 10,
                    color: '#666666',
                    opacity: 0.9,
                    font: {
                        color: '#ffffff',
                        family: 'Segoe UI',
                        opacity: 1,
                        size: 12,
                        weight: 200
                    }
                }
            }
        });
        DX.viz.core.registerTheme({
            name: 'desktop-dark',
            rangeSelector: {
                shutter: {
                    color: '#2b2b2b',
                    opacity: 0.9
                },
                sliderMarker: {
                    color: '#b5b5b5',
                    font: {
                        color: '#303030',
                        opacity: 1
                    }
                },
                sliderHandles: {
                    color: '#ffffff',
                    opacity: 0.35
                },
                scale: {
                    label: {font: {
                            color: '#6f6f6f',
                            opacity: 1,
                            size: 11
                        }},
                    tick: {
                        color: '#ffffff',
                        opacity: 0.05
                    }
                }
            },
            gauge: {
                valueIndicator: {
                    _default: {color: '#b5b5b5'},
                    twocolorneedle: {secondColor: '#ba544d'},
                    twocolorrectangle: {secondColor: '#ba544d'}
                },
                subvalueIndicator: {_default: {color: '#ba544d'}},
                containerBackgroundColor: '#303030',
                scale: {
                    majorTick: {color: '#303030'},
                    minorTick: {color: '#303030'},
                    label: {font: {
                            color: '#6f6f6f',
                            opacity: 1,
                            weight: 'Normal'
                        }}
                },
                rangeContainer: {backgroundColor: '#b5b5b5'},
                title: {font: {
                        color: '#b5b5b5',
                        opacity: 1
                    }}
            },
            sparkline: {
                lineColor: '#c7c7c7',
                firstLastColor: '#c7c7c7',
                barPositiveColor: '#b8b8b8',
                barNegativeColor: '#8e8e8e',
                winColor: '#b8b8b8',
                lossColor: '#8e8e8e',
                pointColor: '#303030',
                tooltip: {
                    color: '#c7c7c7',
                    font: {color: '#303030'}
                }
            },
            bullet: {
                targetColor: '#8e8e8e',
                tooltip: {
                    color: '#c7c7c7',
                    font: {color: '#303030'}
                }
            },
            map: {
                background: {
                    borderColor: '#3f3f3f',
                    color: '#303030'
                },
                area: {
                    borderColor: '#303030',
                    color: '#686868',
                    hoveredBorderColor: '#ffffff',
                    selectedBorderColor: '#ffffff'
                },
                marker: {font: {color: '#ffffff'}},
                controlBar: {
                    borderColor: '#c7c7c7',
                    color: '#303030'
                },
                legend: {
                    borderColor: '#3f3f3f',
                    color: '#303030',
                    font: {color: '#ffffff'}
                }
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file android.js */
    (function($, DX, undefined) {
        DX.viz.core.registerTheme({
            name: 'android',
            chart: {
                title: {font: {color: '#ffffff'}},
                commonAxisSettings: {
                    title: {font: {color: '#6f6f6f'}},
                    label: {font: {
                            color: '#ffffff',
                            size: 11,
                            opacity: 1
                        }},
                    grid: {
                        color: '#4c4c4c',
                        opacity: 1
                    }
                },
                legend: {font: {
                        color: '#ffffff',
                        opacity: 1,
                        size: 11
                    }}
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file ios.js */
    (function($, DX, undefined) {
        DX.viz.core.registerTheme({
            name: 'ios',
            chart: {
                title: {font: {color: '#808080'}},
                commonAxisSettings: {
                    title: {font: {color: '#6f6f6f'}},
                    label: {font: {
                            color: '#000000',
                            size: 11,
                            opacity: 1
                        }},
                    grid: {
                        color: '#808080',
                        opacity: 0.35
                    }
                },
                legend: {font: {
                        color: '#000000',
                        opacity: 1,
                        size: 11
                    }}
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file win8.js */
    (function($, DX) {
        DX.viz.core.registerTheme({
            name: 'win8',
            chart: {
                title: {font: {color: '#ffffff'}},
                commonAxisSettings: {
                    title: {font: {color: '#6f6f6f'}},
                    label: {font: {
                            color: '#ffffff',
                            size: 11,
                            opacity: 1
                        }},
                    grid: {
                        color: '#4c4c4c',
                        opacity: 0.9
                    }
                },
                legend: {font: {
                        color: '#ffffff',
                        opacity: 1,
                        size: 11
                    }}
            }
        });
        DX.viz.core.registerTheme({
            name: 'win8-white',
            chart: {
                title: {font: {color: '#808080'}},
                commonAxisSettings: {
                    title: {font: {color: '#6f6f6f'}},
                    label: {font: {
                            color: '#000000',
                            size: 11,
                            opacity: 0.75
                        }},
                    grid: {
                        color: '#808080',
                        opacity: 0.35
                    }
                },
                legend: {font: {
                        color: '#000000',
                        opacity: 1,
                        size: 11
                    }}
            }
        }, 'win8')
    })(jQuery, DevExpress);
    /*! Module viz-core, file namespaces.js */
    (function(DevExpress) {
        DevExpress.viz.renderers = {}
    })(DevExpress);
    /*! Module viz-core, file svgRenderer.js */
    (function($, DX) {
        var renderers = DX.viz.renderers,
            utils = DX.utils,
            Class = DX.Class,
            doc = document,
            MAX_PIXEL_COUNT = 10000000000;
        function createElement(name) {
            return doc.createElementNS('http://www.w3.org/2000/svg', name)
        }
        var BaseSvgElement = Class.inherit({
                ctor: function baseSvgElementCtor(renderer, name, params) {
                    this.renderer = renderer;
                    this.element = this.createElement(name);
                    this.$element = $(this.element);
                    this.applySettings($.extend({}, this.defaultSettings(), params));
                    this.__passedParams = params
                },
                defaultSettings: $.noop,
                createElement: function(nodeName) {
                    this._nodeName = nodeName;
                    return createElement(nodeName)
                },
                dispose: function() {
                    this.off();
                    this.remove();
                    this.renderer = null;
                    this.element = null;
                    this.settings = null;
                    this.$element = null;
                    this.transformation = null;
                    this.__passedParams = null;
                    this.__appliedSettings = null;
                    this.__appliedStyle = null
                },
                append: function(svgElement) {
                    var toElement = svgElement || this.renderer.getRoot();
                    toElement.element.appendChild(this.element);
                    return this
                },
                insertBefore: function(target) {
                    target.element.parentNode.insertBefore(this.element, target.element);
                    return this
                },
                toBackground: function() {
                    this.element.parentNode && this.element.parentNode.insertBefore(this.element, this.element.parentNode.firstChild);
                    return this
                },
                toForeground: function() {
                    this.element.parentNode && this.element.parentNode.appendChild(this.element);
                    return this
                },
                addClass: function(className) {
                    var classAttribute = this.$element.attr('class'),
                        classNameIndex,
                        classNames;
                    if (className) {
                        if (classAttribute) {
                            classNames = classAttribute.split(' ');
                            classNameIndex = $.inArray(className, classNames);
                            if (classNameIndex === -1)
                                classAttribute += ' ' + className
                        }
                        else
                            classAttribute = className;
                        this.$element.attr('class', classAttribute)
                    }
                    return this.$element
                },
                removeClass: function(className) {
                    var classAttribute = this.$element.attr('class'),
                        classNames,
                        indexDeleteElement,
                        resultClassNames = '',
                        i;
                    if (classAttribute && className) {
                        classNames = classAttribute.split(' ');
                        indexDeleteElement = $.inArray(className, classNames);
                        if (indexDeleteElement !== -1) {
                            for (i = 0; i < classNames.length; i++)
                                if (i !== indexDeleteElement)
                                    resultClassNames += classNames[i] + ' ';
                            this.$element.attr('class', resultClassNames.replace(/ $/, ''))
                        }
                    }
                    return this.$element
                },
                applySettings: function(settings) {
                    var normalized;
                    this.settings = $.extend(this.settings || {}, settings || {});
                    this.adjustSettings();
                    normalized = this._normalizeSettings(this.settings);
                    this.applyStyle(this._style);
                    this._applyAttributes(normalized);
                    return this
                },
                _applyAttributes: function(settings) {
                    this.$element.attr(settings);
                    this.__appliedSettings = settings
                },
                adjustSettings: function(){},
                applyStyle: function(style) {
                    this.$element.css(style || {});
                    this.__appliedStyle = style || {};
                    return this
                },
                trigger: function(event, data) {
                    this.$element.trigger(event, data)
                },
                on: function(events, data, handler) {
                    this.$element.on.apply(this.$element, arguments);
                    return this
                },
                data: function(data) {
                    this.$element.data(data);
                    return this
                },
                removeData: function() {
                    this.$element.removeData();
                    return this
                },
                off: function(events) {
                    this.$element.off(events);
                    return this
                },
                getBBox: function() {
                    var self = this,
                        bBox,
                        element = this.element,
                        transformation = self.transformation,
                        rotateAngle = transformation.rotateAngle || 0,
                        rotateX = transformation.rotateX || 0,
                        rotateY = transformation.rotateY || 0,
                        mabs = Math.abs,
                        mmin = Math.min;
                    function bBox(el) {
                        var ret = {};
                        try {
                            if (!$.isFunction(el.getBBox))
                                throw{};
                            else
                                ret = el.getBBox()
                        }
                        catch(e) {
                            ret = {
                                x: 0,
                                y: 0,
                                width: el.offsetWidth || 0,
                                height: el.offsetHeight || 0
                            }
                        }
                        return ret
                    }
                    bBox = $.extend({}, bBox(element));
                    if (rotateAngle) {
                        var cossin = utils.getCosAndSin(rotateAngle),
                            sin = cossin.sin.toFixed(3),
                            cos = cossin.cos.toFixed(3),
                            ltx = bBox.x - rotateX,
                            lty = bBox.y - rotateY,
                            rtx = bBox.x + bBox.width - rotateX,
                            rty = bBox.y - rotateY,
                            lbx = bBox.x - rotateX,
                            lby = bBox.y + bBox.height - rotateY,
                            rbx = bBox.x + bBox.width - rotateX,
                            rby = bBox.y + bBox.height - rotateY,
                            w,
                            h;
                        w = mabs(bBox.height * sin) + mabs(bBox.width * cos);
                        h = mabs(bBox.height * cos) + mabs(bBox.width * sin);
                        bBox.x = mmin(ltx * cos - lty * sin + rotateX, rtx * cos - rty * sin + rotateX, lbx * cos - lby * sin + rotateX, rbx * cos - rby * sin + rotateX);
                        bBox.y = mmin(ltx * sin + lty * cos + rotateY, rtx * sin + rty * cos + rotateY, lbx * sin + lby * cos + rotateY, rbx * sin + rby * cos + rotateY);
                        bBox.width = w;
                        bBox.height = h
                    }
                    return self._normalizeBBox(bBox)
                },
                _normalizeBBox: function(bBox) {
                    var ceil = Math.ceil,
                        floor = Math.floor,
                        $isNumeric = $.isNumeric,
                        rxl = floor(bBox.x),
                        ryt = floor(bBox.y),
                        rxr = ceil(bBox.width + bBox.x),
                        ryb = ceil(bBox.height + bBox.y),
                        width,
                        height;
                    bBox.x = $isNumeric(rxl) && rxl < MAX_PIXEL_COUNT && rxl > -MAX_PIXEL_COUNT ? rxl : 0;
                    bBox.y = $isNumeric(ryt) && ryt < MAX_PIXEL_COUNT && ryt > -MAX_PIXEL_COUNT ? ryt : 0;
                    width = rxr - rxl;
                    height = ryb - ryt;
                    bBox.width = $isNumeric(width) && width < MAX_PIXEL_COUNT && width > -MAX_PIXEL_COUNT ? width : 0;
                    bBox.height = $isNumeric(height) && height < MAX_PIXEL_COUNT && height > -MAX_PIXEL_COUNT ? height : 0;
                    bBox.isEmpty = !bBox.x && !bBox.y && !bBox.width && !bBox.height;
                    return bBox
                },
                clear: function(selector) {
                    selector ? this.$element.find(selector).remove() : this.$element.empty()
                },
                detach: function() {
                    this.$element.detach()
                },
                animate: function(params, options, complete) {
                    options = options || {};
                    var _this = this,
                        animationParams = {};
                    if (complete)
                        $.extend(options, {complete: complete});
                    if (this.renderer.animOptions.enabled) {
                        $.each(params, function(name, to) {
                            switch (name) {
                                case'scale':
                                    animationParams['transform'] = animationParams['transform'] || {};
                                    var scale = _this.transformation.scale || {};
                                    animationParams['transform'].scale = {
                                        x: {
                                            from: utils.isDefined(scale.x) ? scale.x : 1,
                                            to: utils.isDefined(to.x) ? to.x : 1
                                        },
                                        y: {
                                            from: utils.isDefined(scale.y) ? scale.y : 1,
                                            to: utils.isDefined(to.y) ? to.y : 1
                                        }
                                    };
                                    break;
                                case'rotate':
                                    animationParams['transform'] = animationParams['transform'] || {};
                                    animationParams['transform'].rotate = {
                                        angle: {
                                            from: _this.transformation.rotateAngle || 0,
                                            to: to.angle
                                        },
                                        y: to.y || 0,
                                        x: to.x || 0
                                    };
                                    break;
                                case'translate':
                                    animationParams['transform'] = animationParams['transform'] || {};
                                    animationParams['transform'].translate = {
                                        x: {
                                            from: _this.transformation.translateX || 0,
                                            to: to.x || 0
                                        },
                                        y: {
                                            from: _this.transformation.translateY || 0,
                                            to: to.y || 0
                                        }
                                    };
                                    break;
                                case'points':
                                    animationParams[name] = to;
                                    break;
                                default:
                                    animationParams[name] = {
                                        from: _this.settings[name] || 0,
                                        to: to
                                    }
                            }
                        });
                        _this.renderer.animateElement(_this, animationParams, $.extend({}, this.renderer.animOptions, options))
                    }
                    else {
                        if (params.translate) {
                            if ('x' in params.translate)
                                params.translateX = params.translate.x;
                            if ('y' in params.translate)
                                params.translateY = params.translate.y;
                            delete params.translate
                        }
                        if (options) {
                            options.step && options.step.call(_this, 1, 1);
                            options.complete && options.complete.call(_this)
                        }
                        this.applySettings(params)
                    }
                },
                stopAnimation: function() {
                    var self = this;
                    self.animation && self.animation.stop(true);
                    return self
                },
                move: function(x, y, animate, animOptions) {
                    x = x || 0,
                    y = y || 0;
                    animOptions = animOptions || {};
                    if (!animate)
                        this.applySettings({
                            translateX: x,
                            translateY: y
                        });
                    else
                        this.animate({translate: {
                                x: x,
                                y: y
                            }}, animOptions);
                    return this
                },
                rotate: function(angle, x, y, animate, animOptions) {
                    angle = angle || 0;
                    x = x || 0;
                    y = y || 0;
                    animOptions = animOptions || {};
                    if (!animate)
                        this.applySettings({rotate: [angle, x, y]});
                    else
                        this.animate({rotate: {
                                angle: angle,
                                x: x,
                                y: y
                            }}, animOptions)
                },
                remove: function() {
                    this.$element.remove()
                },
                _normalizeSettings: function(settings) {
                    var key,
                        style,
                        firstChar,
                        styleName,
                        prop,
                        value,
                        normalized = {},
                        fontSetting;
                    for (key in settings) {
                        prop = key,
                        value = settings[prop];
                        if (prop === 'align') {
                            prop = 'text-anchor';
                            value = {
                                left: 'start',
                                center: 'middle',
                                right: 'end'
                            }[value]
                        }
                        else if (prop === 'font') {
                            style = this['_style'] = this['_style'] || {};
                            if (!$.isPlainObject(value))
                                continue;
                            $.each(value, function(fontSetting) {
                                switch (fontSetting) {
                                    case'color':
                                        styleName = 'fill';
                                        break;
                                    case'opacity':
                                        styleName = 'fillOpacity';
                                        break;
                                    case'cursor':
                                        styleName = fontSetting;
                                        break;
                                    default:
                                        firstChar = fontSetting.charAt(0);
                                        styleName = 'font' + fontSetting.replace(firstChar, firstChar.toUpperCase())
                                }
                                style[styleName] = value[fontSetting]
                            });
                            continue
                        }
                        else if (prop === 'dashStyle') {
                            prop = 'stroke-dasharray';
                            value = value.toLowerCase();
                            value = value === 'solid' ? 'none' : value.replace(/longdash/g, '8,3,').replace(/dash/g, '4,3,').replace(/dot/g, '1,3,').replace(/,$/, '').split(',');
                            if (value !== 'none')
                                value = $.map(value, function(p) {
                                    return +p * (settings.strokeWidth || 1)
                                }).join(',')
                        }
                        else if (/^(linecap|linejoin)$/i.test(prop))
                            prop = 'stroke-' + prop;
                        else if (/^(translateX|translateY|rotate|scale)$/i.test(prop)) {
                            this['_' + prop] = value;
                            continue
                        }
                        else if (prop === 'clipId') {
                            prop = 'clip-path';
                            value = 'url(#' + value + ')'
                        }
                        else if (prop === 'style') {
                            this['_style'] = this['_style'] || {};
                            $.extend(true, this['_style'], value);
                            continue
                        }
                        else if (prop === 'text')
                            continue;
                        else if (prop === 'segments')
                            continue;
                        else
                            prop = DX.inflector.dasherize(prop);
                        normalized[prop] = value
                    }
                    return this._applyTransformation(normalized)
                },
                _applyTransformation: function(settings) {
                    this.transformation = {
                        translateX: this._translateX,
                        translateY: this._translateY,
                        rotateAngle: 0,
                        rotateX: 0,
                        rotateY: 0
                    };
                    var tr = this.transformation,
                        rotate = this._rotate,
                        scale = this._scale,
                        transformations = [];
                    if (utils.isDefined(tr.translateX) || utils.isDefined(tr.translateY))
                        transformations.push('translate(' + (tr.translateX || 0) + ',' + (tr.translateY || 0) + ')');
                    if (utils.isDefined(rotate)) {
                        if (utils.isNumber(rotate)) {
                            tr.rotateAngle = rotate;
                            tr.rotateX = settings.x || 0;
                            tr.rotateY = settings.y || 0
                        }
                        else if ($.isArray(rotate)) {
                            tr.rotateAngle = rotate[0] || 0;
                            tr.rotateX = rotate[1] || 0;
                            tr.rotateY = rotate[2] || 0
                        }
                        else if (utils.isObject(rotate)) {
                            tr.rotateAngle = rotate.angle || 0;
                            tr.rotateX = rotate.x || 0;
                            tr.rotateY = rotate.y || 0
                        }
                        transformations.push('rotate(' + tr.rotateAngle + ',' + tr.rotateX + ',' + tr.rotateY + ')')
                    }
                    if (utils.isNumber(scale)) {
                        var value = utils.isDefined(scale) ? scale : 1;
                        transformations.push('scale(' + value + ',' + value + ')');
                        tr.scale = {
                            x: value,
                            y: value
                        }
                    }
                    else if (utils.isObject(scale)) {
                        var valueX = utils.isDefined(scale.x) ? scale.x : 1;
                        var valueY = utils.isDefined(scale.y) ? scale.y : 1;
                        transformations.push('scale(' + valueX + ',' + valueY + ')');
                        tr.scale = {
                            x: valueX,
                            y: valueY
                        }
                    }
                    if (transformations.length)
                        settings.transform = transformations.join(' ');
                    return settings
                }
            });
        var RootSvgElement = BaseSvgElement.inherit({
                defaultSettings: function() {
                    return {
                            width: 0,
                            height: 0,
                            style: {'-webkit-tap-highlight-color': 'rgba(0, 0, 0, 0)'},
                            xmlns: 'http://www.w3.org/2000/svg',
                            'xmlns:xlink': 'http://www.w3.org/1999/xlink',
                            version: '1.1',
                            stroke: 'none',
                            strokeWidth: 0,
                            fill: 'none'
                        }
                },
                ctor: function(renderer, params) {
                    this.callBase(renderer, 'svg', params)
                }
            });
        var RectSvgBaseElement = {
                defaultSettings: function() {
                    return {
                            x: 0,
                            y: 0,
                            width: 0,
                            height: 0
                        }
                },
                adjustSettings: function() {
                    if (!utils.isDefined(this.settings.sharpEdges) || this.settings.sharpEdges) {
                        this.sharpEdges();
                        delete this.settings.sharpEdges
                    }
                },
                prepareSettings: function(settings) {
                    var prevStrokeWidth = this.settings ? Number(this.settings.strokeWidth) || 0 : 0,
                        newStrokeWidth,
                        maxStrokeWidth,
                        strokeWidthChanged = false;
                    if (utils.isDefined(settings.width))
                        this._realWidth = Number(settings.width);
                    if (utils.isDefined(settings.height))
                        this._realHeight = Number(settings.height);
                    if (utils.isDefined(settings.x))
                        this._realX = Number(settings.x);
                    if (utils.isDefined(settings.y))
                        this._realY = Number(settings.y);
                    if (utils.isDefined(settings.strokeWidth))
                        this._realStrokeWidth = Number(settings.strokeWidth);
                    this._realStrokeWidth = this._realStrokeWidth || this.defaultSettings().strokeWidth || 0;
                    maxStrokeWidth = ~~((this._realWidth < this._realHeight ? this._realWidth : this._realHeight) / 2);
                    newStrokeWidth = this._realStrokeWidth < maxStrokeWidth ? this._realStrokeWidth : maxStrokeWidth;
                    if (newStrokeWidth !== prevStrokeWidth) {
                        strokeWidthChanged = true;
                        settings.sharpEdges = true;
                        newStrokeWidth > 0 && (settings.strokeWidth = newStrokeWidth)
                    }
                    (utils.isDefined(settings.x) || strokeWidthChanged) && (settings.x = this._realX + newStrokeWidth / 2);
                    (utils.isDefined(settings.y) || strokeWidthChanged) && (settings.y = this._realY + newStrokeWidth / 2);
                    (utils.isDefined(settings.width) || strokeWidthChanged) && (settings.width = this._realWidth - newStrokeWidth);
                    (utils.isDefined(settings.height) || strokeWidthChanged) && (settings.height = this._realHeight - newStrokeWidth)
                },
                applySettings: function(settings) {
                    var settings = $.extend(true, {}, settings);
                    this.prepareSettings(settings);
                    this.callBase(settings)
                },
                sharpEdges: function() {
                    var strokeWidth = Math.round(this.settings.strokeWidth || 0),
                        correction = strokeWidth % 2 / 2;
                    this.settings.x = Math.floor(this.settings.x - correction || 0) + correction;
                    this.settings.y = Math.floor(this.settings.y - correction || 0) + correction;
                    this.settings.width = Math.floor(this.settings.width || 0);
                    this.settings.height = Math.floor(this.settings.height || 0);
                    this.settings.strokeWidth > 0 && (this.settings.strokeWidth = strokeWidth)
                }
            };
        var ImageSvgElement = BaseSvgElement.inherit(RectSvgBaseElement).inherit({
                ctor: function(renderer, params, href, location) {
                    var locationToPreserveAspectRatioMap = {
                            full: 'none',
                            lefttop: 'xMinYMin',
                            leftcenter: 'xMinYMid',
                            leftbottom: 'xMinYMax',
                            centertop: 'xMidYMin',
                            center: 'xMidYMid',
                            centerbottom: 'xMidYMax',
                            righttop: 'xMaxYMin',
                            rightcenter: 'xMaxYMid',
                            rightbottom: 'xMaxYMax'
                        };
                    this.href = utils.isDefined(href) ? href : '';
                    this.preserveAspectRatio = locationToPreserveAspectRatioMap[(location || '').toLowerCase()];
                    this.preserveAspectRatio = this.preserveAspectRatio || 'none';
                    this.callBase(renderer, 'image', params)
                },
                adjustSettings: function() {
                    this.callBase();
                    this.element.setAttributeNS('http://www.w3.org/1999/xlink', 'href', this.href);
                    if (this.preserveAspectRatio)
                        this.element.setAttribute('preserveAspectRatio', this.preserveAspectRatio)
                }
            });
        var RectSvgElement = BaseSvgElement.inherit(RectSvgBaseElement).inherit({
                defaultSettings: function() {
                    return {
                            x: 0,
                            y: 0,
                            width: 0,
                            height: 0,
                            rx: 0,
                            ry: 0
                        }
                },
                ctor: function(renderer, params) {
                    this.callBase(renderer, 'rect', params)
                }
            });
        var PathSvgElement = BaseSvgElement.inherit({
                defaultSettings: function() {
                    return {points: {
                                x: 0,
                                y: 0
                            }}
                },
                getNodeName: function() {
                    return 'path'
                },
                getPathAttributeName: function() {
                    return 'd'
                },
                ctor: function(renderer, params) {
                    this.callBase(renderer, this.getNodeName(), params)
                },
                dispose: function() {
                    this.segments = null;
                    this.fromSegments = null;
                    this.callBase()
                },
                adjustSettings: function() {
                    this.prepareSegments(this.settings)
                },
                applySettings: function(settings) {
                    var settings = settings || {};
                    if (this.settings && settings.strokeWidth && this.settings.strokeWidth !== settings.strokeWidth)
                        settings.sharpEdges = true;
                    this.callBase(settings)
                },
                prepareSegments: function(params) {
                    if ('points' in params) {
                        var points = params.points,
                            firstElem = points[0],
                            close = this.closePath || params.closePath,
                            segments = [],
                            i;
                        if (utils.isObject(firstElem))
                            segments = $.map(points, function(pt, i) {
                                if (!pt)
                                    return null;
                                if (!i)
                                    return [['M', pt.x, pt.y]];
                                return [['L', pt.x, pt.y]]
                            });
                        else if (utils.isNumber(firstElem))
                            for (i = 0; i < points.length; i += 2) {
                                if (!i) {
                                    segments = [['M', points[i] || 0, points[i + 1] || 0]];
                                    continue
                                }
                                segments.push(['L', points[i] || 0, points[i + 1] || 0])
                            }
                        else
                            segments = [['M', 0, 0]];
                        if (close)
                            segments.push(['Z']);
                        this.segments = segments;
                        delete params.points;
                        delete params.closePath;
                        params.sharpEdges = true
                    }
                    if (params.sharpEdges) {
                        this.sharpEdges();
                        this.combinePathParams(params);
                        delete params.sharpEdges
                    }
                },
                customizeSegments: function(segments) {
                    return segments
                },
                combinePathParams: function(params) {
                    var path;
                    this.segments = this.customizeSegments(this.segments);
                    if (this.segments) {
                        path = $.map(this.segments, function(seg, i) {
                            return seg.join(' ')
                        });
                        path = path.join(' ');
                        params[this.getPathAttributeName()] = path
                    }
                },
                animate: function(params, options, complete) {
                    var _this = this;
                    if (!('points' in params) || !this.renderer.animOptions.enabled)
                        return this.callBase(params, options, complete);
                    var fromPath = _this.segments;
                    _this.prepareSegments(params);
                    delete params.d;
                    if (fromPath.length === _this.segments.length)
                        params.points = {
                            from: fromPath,
                            to: _this.segments
                        };
                    _this.callBase(params, options, complete)
                },
                sharpEdges: function() {
                    var self = this,
                        segLength = self.segments.length,
                        i = 0,
                        curSeg,
                        nextSeg,
                        curX,
                        curY,
                        nextX,
                        nextY,
                        curXIdx,
                        curYIdx,
                        nextXIdx,
                        nextYIdx,
                        strokeWidth = Math.round(self.settings.strokeWidth || 0),
                        correction = strokeWidth % 2 / 2;
                    for (i; i < segLength - 1; i++) {
                        curSeg = self.segments[i];
                        nextSeg = self.segments[i + 1];
                        if (nextSeg[0] === 'Z' && i)
                            nextSeg = self.segments[0];
                        switch (curSeg[0]) {
                            case'M':
                            case'L':
                                curXIdx = 1;
                                curYIdx = 2;
                                break;
                            case'C':
                                curXIdx = 5;
                                curYIdx = 6;
                                break;
                            case'A':
                                curXIdx = 6;
                                curYIdx = 7;
                                break;
                            case'Z':
                                continue
                        }
                        switch (nextSeg[0]) {
                            case'M':
                            case'L':
                                nextXIdx = 1;
                                nextYIdx = 2;
                                break;
                            case'C':
                                nextXIdx = 5;
                                nextYIdx = 6;
                                break;
                            case'A':
                                nextXIdx = 6;
                                nextYIdx = 7;
                                break;
                            case'Z':
                                continue
                        }
                        curX = Math.floor(curSeg[curXIdx]);
                        curY = Math.floor(curSeg[curYIdx]);
                        nextX = nextSeg[nextXIdx] = Math.floor(nextSeg[nextXIdx]);
                        nextY = nextSeg[nextYIdx] = Math.floor(nextSeg[nextYIdx]);
                        curSeg[curXIdx] = i == 0 ? curX : curSeg[curXIdx];
                        curSeg[curYIdx] = i == 0 ? curY : curSeg[curYIdx];
                        if (curX == nextX) {
                            curSeg[curXIdx] = curX + correction;
                            nextSeg[nextXIdx] = nextX + correction
                        }
                        if (curY == nextY) {
                            curSeg[curYIdx] = curY + correction;
                            nextSeg[nextYIdx] = nextY + correction
                        }
                    }
                }
            });
        var SegmentRectSvgElement = PathSvgElement.inherit(RectSvgBaseElement).inherit({
                defaultSettings: function() {
                    return $.extend(true, {}, this.callBase(), {segments: {
                                top: true,
                                bottom: true,
                                left: true,
                                right: true
                            }})
                },
                prepareSegments: function() {
                    var self = this,
                        settings = self.settings,
                        left = settings.x,
                        right = left + settings.width,
                        top = settings.y,
                        bottom = top + settings.height,
                        segments = [],
                        segmentSequence,
                        visiblyOpt = 0,
                        prevSegmentVisibility = 0;
                    var allSegment = {
                            top: [['M', left, top], ['L', right, top]],
                            right: [['M', right, top], ['L', right, bottom]],
                            bottom: [['M', right, bottom], ['L', left, bottom]],
                            left: [['M', left, bottom], ['L', left, top]]
                        };
                    $.each(allSegment, function(seg, _) {
                        var visibility = !!self.settings.segments[seg];
                        visiblyOpt = visiblyOpt * 2 + ~~visibility
                    });
                    switch (visiblyOpt) {
                        case(13):
                        case(9):
                            segmentSequence = ['left', 'top', 'right', 'bottom'];
                            break;
                        case(11):
                            segmentSequence = ['bottom', 'left', 'top', 'right'];
                            break;
                        default:
                            segmentSequence = ['top', 'right', 'bottom', 'left']
                    }
                    $.each(segmentSequence, function(_, seg) {
                        var segmentVisibility = !!self.settings.segments[seg];
                        if (segmentVisibility)
                            $.each(allSegment[seg].slice(prevSegmentVisibility), function(_, segment) {
                                segments.push(segment)
                            });
                        prevSegmentVisibility = ~~segmentVisibility
                    });
                    visiblyOpt == 15 && segments.push(['Z']);
                    this.segments = segments.length ? segments : [['M', 0, 0], ['Z']];
                    this.combinePathParams(settings)
                },
                adjustSettings: function() {
                    this.callBase();
                    this.prepareSegments()
                },
                applySettings: function(settings) {
                    var segments = this.settings && this.settings.segments || this.defaultSettings().segments;
                    settings.segments = $.extend(true, {}, segments || {}, settings.segments);
                    this.callBase(settings)
                }
            });
        var AreaSvgElement = PathSvgElement.inherit({
                defaultSettings: function() {
                    return {points: {
                                x: 0,
                                y: 0
                            }}
                },
                ctor: function(renderer, params) {
                    this.closePath = true;
                    this.callBase(renderer, params)
                }
            });
        var BezierSvgElement = PathSvgElement.inherit({
                defaultSettings: function() {
                    return {points: {
                                x: 0,
                                y: 0
                            }}
                },
                prepareSegments: function(params) {
                    if (!('points' in params))
                        return;
                    var points = params.points,
                        firstElem = points[0],
                        close = this.closePath || params.closePath,
                        segments = [],
                        seg = [],
                        i,
                        x,
                        y;
                    var cnt = 0;
                    if (utils.isObject(firstElem)) {
                        for (i = 0; i < points.length; i++) {
                            x = points[i].x;
                            y = points[i].y;
                            if (!i) {
                                segments = [['M', x, y]];
                                continue
                            }
                            if ((i - 1) % 3 == 0) {
                                if (seg.length > 0)
                                    segments.push(seg);
                                seg = ['C', x, y];
                                continue
                            }
                            seg.push(x);
                            seg.push(y)
                        }
                        if (seg.length > 0)
                            segments.push(seg)
                    }
                    else if (utils.isNumber(firstElem)) {
                        for (i = 0; i < points.length; i += 2) {
                            x = points[i];
                            y = points[i + 1];
                            if (!i) {
                                segments = [['M', x, y || 0]];
                                continue
                            }
                            if ((i - 2) % 6 == 0) {
                                if (seg.length > 0)
                                    segments.push(seg);
                                seg = ['C', x, y || 0];
                                continue
                            }
                            seg.push(x);
                            seg.push(y || 0)
                        }
                        if (seg.length > 0)
                            segments.push(seg)
                    }
                    else
                        segments = [['M', 0, 0]];
                    if (close)
                        segments.push(['Z']);
                    this.segments = segments;
                    delete params.points;
                    delete params.closePath;
                    this.combinePathParams(params)
                }
            });
        var BezierAreaSvgElement = BezierSvgElement.inherit({
                defaultSettings: function() {
                    return {points: {
                                x: 0,
                                y: 0
                            }}
                },
                ctor: function(renderer, params) {
                    this.closePath = true;
                    this.callBase(renderer, params)
                }
            });
        var ArcSvgElement = PathSvgElement.inherit({
                defaultSettings: function() {
                    return {
                            x: 0,
                            y: 0,
                            linejoin: 'round'
                        }
                },
                createArcSegments: function(x, y, innerR, outerR, startAngle, endAngle, isCircle) {
                    var longFlag = Math.abs(endAngle - startAngle) > Math.PI ? '1' : '0',
                        xOuterStart = x + outerR * Math.cos(startAngle),
                        yOuterStart = y - outerR * Math.sin(startAngle),
                        xOuterEnd = x + outerR * Math.cos(endAngle),
                        yOuterEnd = y - outerR * Math.sin(endAngle),
                        xInnerStart = x + innerR * Math.cos(endAngle),
                        yInnerStart = y - innerR * Math.sin(endAngle),
                        xInnerEnd = x + innerR * Math.cos(startAngle),
                        yInnerEnd = y - innerR * Math.sin(startAngle);
                    return [['M', xOuterStart, yOuterStart], ['A', outerR, outerR, 0, longFlag, 0, xOuterEnd, yOuterEnd], [isCircle ? 'M' : 'L', xInnerStart, yInnerStart], ['A', innerR, innerR, 0, longFlag, 1, xInnerEnd, yInnerEnd], ['Z']]
                },
                prepareSegments: function(params) {
                    if (!('x' in params) && !('y' in params) && !('outerRadius' in params) && !('innerRadius' in params) && !('startAngle' in params) && !('endAngle' in params))
                        return;
                    var x = utils.isNumber(params.x) ? Number(params.x) : 0,
                        y = utils.isNumber(params.y) ? Number(params.y) : 0,
                        outerR = utils.isNumber(params.outerRadius) ? Number(params.outerRadius) : 0,
                        innerR = utils.isNumber(params.innerRadius) ? Number(params.innerRadius) : 0,
                        startAngle = utils.isNumber(params.startAngle) ? Number(params.startAngle) : 0,
                        endAngle = utils.isNumber(params.endAngle) ? Number(params.endAngle) : 360,
                        isCircle;
                    this.segments = [['M', 0, 0], ['Z']];
                    if (outerR || innerR) {
                        var tmp = Math.min(outerR, innerR);
                        outerR = Math.max(outerR, innerR);
                        innerR = tmp;
                        if (Math.round(startAngle) != Math.round(endAngle)) {
                            if (Math.abs(endAngle - startAngle) % 360 == 0) {
                                startAngle = 0;
                                endAngle = 360;
                                isCircle = true;
                                endAngle -= 0.0001
                            }
                            if (startAngle > 360)
                                startAngle = startAngle % 360;
                            if (endAngle > 360)
                                endAngle = endAngle % 360;
                            if (startAngle > endAngle)
                                startAngle -= 360;
                            startAngle = startAngle * Math.PI / 180;
                            endAngle = endAngle * Math.PI / 180;
                            this.segments = this.createArcSegments(x, y, innerR, outerR, startAngle, endAngle, isCircle)
                        }
                    }
                    delete params.x;
                    delete params.y;
                    delete params.outerRadius;
                    delete params.innerRadius;
                    delete params.startAngle;
                    delete params.endAngle;
                    this.combinePathParams(params)
                }
            });
        var CircleSvgElement = BaseSvgElement.inherit({
                defaultSettings: function() {
                    return {
                            cx: 0,
                            cy: 0,
                            r: 0
                        }
                },
                ctor: function(renderer, params) {
                    this.callBase(renderer, 'circle', params)
                }
            });
        var TextSvgElement = BaseSvgElement.inherit({
                defaultSettings: function() {
                    return {
                            x: 0,
                            y: 0
                        }
                },
                ctor: function(renderer, params) {
                    this.tspans = [];
                    this.callBase(renderer, 'text', params)
                },
                dispose: function() {
                    this.tspans = null;
                    this.callBase()
                },
                updateText: function(text) {
                    if (!utils.isDefined(text))
                        text = '';
                    this.applySettings({text: text})
                },
                adjustSettings: function() {
                    if (!('text' in this.settings)) {
                        this.changeX();
                        return
                    }
                    this._createElementWithText(this.settings.text)
                },
                changeX: function() {
                    for (var i = 0; i < this.tspans.length; i++)
                        if (this.tspans[i].settings.x != undefined)
                            this.tspans[i].applySettings({x: this.settings.x})
                },
                _createElementWithText: function(text) {
                    var div,
                        i;
                    this.clear();
                    text = text.toString().replace(/\r/g, "");
                    text = text.replace(/\n/g, "<br/>");
                    div = doc.createElement("div");
                    div.innerHTML = text;
                    div.params = {style: {}};
                    this._orderText(div)
                },
                clear: function() {
                    this.callBase();
                    this.tspans = []
                },
                _orderText: function(node) {
                    var textArray = [],
                        defaultFontSize = (this.settings.font ? this.settings.font.size : 12) || 12;
                    var order = function(strCount, node, textArray) {
                            var params = {style: {}},
                                textArray = textArray || [];
                            node.params = node.params || {};
                            if (node.parentNode && node.nodeName != "#text")
                                if (node.parentNode.params)
                                    for (var i in node.parentNode.params)
                                        node.params[i] = node.parentNode.params[i];
                            switch (node.tagName) {
                                case"B" || "STRONG":
                                    node.params.fontWeight = "bold";
                                    break;
                                case"I" || "EM":
                                    node.params.fontStyle = "italic";
                                    break;
                                case"U":
                                    node.params.textDecoration = "underline";
                                    break;
                                case"BR":
                                    strCount++;
                                    break
                            }
                            if (node.style) {
                                if (node.style.fontSize)
                                    node.params.fontSize = node.style.fontSize.split('p')[0] || node.params.fontSize;
                                node.params.fill = node.style.color || node.params.fill;
                                node.params.fontStyle = node.style.fontStyle || node.params.fontStyle;
                                node.params.fontWeight = node.style.fontWeight || node.params.fontWeight;
                                node.params.textDecoration = node.style.textDecoration || node.params.textDecoration
                            }
                            var childnum = node.childNodes.length;
                            var count = 0;
                            while (count != childnum)
                                strCount = order(strCount, node.childNodes[count++], textArray);
                            if (node.wholeText != undefined) {
                                params.fill = node.parentNode.params.fill;
                                params.text = node.wholeText,
                                node.parentNode.params.fontSize && (params.style.fontSize = node.parentNode.params.fontSize);
                                node.parentNode.params.fontStyle && (params.style.fontStyle = node.parentNode.params.fontStyle);
                                node.parentNode.params.fontWeight && (params.style.fontWeight = node.parentNode.params.fontWeight);
                                node.parentNode.params.textDecoration && (params.style.textDecoration = node.parentNode.params.textDecoration);
                                textArray.push({
                                    params: params,
                                    line: strCount
                                })
                            }
                            return strCount
                        };
                    order(0, node, textArray);
                    for (var txt = 0; txt < textArray.length; txt++) {
                        if (txt != 0)
                            if (textArray[txt].line != textArray[txt - 1].line) {
                                textArray[txt].params.dy = textArray[txt].params.fontSize || defaultFontSize;
                                textArray[txt].params.x = this.settings.x
                            }
                            else {
                                textArray[txt].params.dy = 0;
                                textArray[txt].params.dx = 0
                            }
                        else {
                            textArray[txt].params.x = this.settings.x;
                            textArray[txt].params.dy = 0
                        }
                        var tspan = new TspanSvgElement(this.renderer, textArray[txt].params);
                        tspan.append(this);
                        this.tspans.push(tspan)
                    }
                }
            });
        var TspanSvgElement = BaseSvgElement.inherit({ctor: function(renderer, params) {
                    var text = params.text || '';
                    delete params.text;
                    this.callBase(renderer, 'tspan', params);
                    this.element.appendChild(doc.createTextNode(text))
                }});
        var GroupSvgElement = BaseSvgElement.inherit({
                ctor: function(renderer, params) {
                    this.callBase(renderer, 'g', params)
                },
                update: $.noop
            });
        var PatternSvgElement = BaseSvgElement.inherit({
                ctor: function(renderer, params) {
                    this.__patternParams = $.extend({}, params);
                    var id = utils.getNextPatternId(),
                        color = params.color,
                        hatching = params.hatching,
                        opacity = hatching.opacity,
                        width = hatching.width || 1,
                        step = hatching.step || 6,
                        direction = hatching.direction,
                        options = {
                            strokeWidth: width,
                            stroke: color
                        };
                    this.callBase(renderer, 'pattern', {
                        id: id,
                        width: step,
                        height: step
                    });
                    this.element.setAttribute('patternUnits', 'userSpaceOnUse');
                    this._rect = renderer.createRect(0, 0, step, step, 0, {
                        fill: color,
                        opacity: opacity
                    }).append(this);
                    this._path = renderer.createPath(0, options).append(this);
                    if (direction === 'right')
                        this._path.applySettings({d: "M " + step / 2 + " " + -step / 2 + " L " + -step / 2 + " " + step / 2 + "M 0 " + step + " L " + step + " 0 M " + step * 1.5 + " " + step / 2 + " L " + step / 2 + " " + step * 1.5});
                    else if (direction === 'left')
                        this._path.applySettings({d: "M 0 0 L " + step + ' ' + step + " M " + -step / 2 + " " + step / 2 + " L " + step / 2 + " " + step * 1.5 + " M " + step / 2 + -step / 2 + " L " + step * 1.5 + " " + step / 2});
                    this.id = 'url(#' + id + ')'
                },
                append: function() {
                    return this.callBase(this.renderer.defsSvg)
                },
                clear: function() {
                    this.callBase();
                    this._path = null
                },
                dispose: function() {
                    this._path = null;
                    this.callBase()
                }
            });
        var ClipRectSvgElement = BaseSvgElement.inherit({
                ctor: function(renderer, params) {
                    this.__clipRectParams = $.extend({}, params);
                    var x = params.x,
                        y = params.y,
                        w = params.w,
                        h = params.h,
                        id = utils.getNextClipId();
                    delete params.x;
                    delete params.y;
                    delete params.w;
                    delete params.h;
                    this.callBase(renderer, 'clipPath', {id: id});
                    this.id = id;
                    this._rect = renderer.createRect(x, y, w, h, 0, params);
                    this._rect.append(this)
                },
                append: function() {
                    return this.callBase(this.renderer.defsSvg)
                },
                updateRectangle: function(settings) {
                    this._rect.applySettings(settings)
                },
                dispose: function() {
                    this._rect = null;
                    this.callBase()
                }
            });
        var ShadowFilterSvgElement = BaseSvgElement.inherit({
                ctor: function(renderer) {
                    this.applySettings = $.noop;
                    this.callBase(renderer, 'filter');
                    delete this.applySettings;
                    this.ref = null;
                    this._create()
                },
                append: function() {
                    return this.callBase(this.renderer.defsSvg)
                },
                dispose: function() {
                    while (this.element.firstChild)
                        this.element.removeChild(this.element.firstChild);
                    this.callBase();
                    return this
                },
                applySettings: function(settings) {
                    settings = settings || {};
                    this.$element.attr({
                        id: settings.id || null,
                        x: settings.x || null,
                        y: settings.y || null,
                        width: settings.width || null,
                        height: settings.height || null
                    });
                    this.ref = settings.id ? 'url(#' + settings.id + ')' : null;
                    this._update(settings);
                    return this
                },
                _create: function() {
                    var gaussianBlur = this._gaussianBlur = createElement('feGaussianBlur'),
                        offset = this._offset = createElement('feOffset'),
                        colorMatrix = this._colorMatrix = createElement('feColorMatrix'),
                        blend = createElement('feBlend');
                    gaussianBlur.setAttribute('in', 'SourceGraphic');
                    gaussianBlur.setAttribute('result', 'result');
                    offset.setAttribute('in', 'result');
                    offset.setAttribute('result', 'result');
                    colorMatrix.setAttribute('in', 'result');
                    colorMatrix.setAttribute('result', 'result');
                    colorMatrix.setAttribute('type', 'matrix');
                    blend.setAttribute('in', 'SourceGraphic');
                    blend.setAttribute('in2', 'result');
                    blend.setAttribute('mode', 'normal');
                    this.element.appendChild(gaussianBlur);
                    this.element.appendChild(offset);
                    this.element.appendChild(colorMatrix);
                    this.element.appendChild(blend)
                },
                _update: function(settings) {
                    this._gaussianBlur.setAttribute('stdDeviation', settings.blur || 0);
                    this._offset.setAttribute('dx', settings.dx || 0);
                    this._offset.setAttribute('dy', settings.dy || 0);
                    this._colorMatrix.setAttribute('values', buildColorMatrixValues(settings.color, settings.opacity))
                }
            });
        function buildColorMatrixValues(color, opacity) {
            var c = new DX.Color(color || '#000000');
            return '0 0 0 ' + Number((c.r / 255).toFixed(2)) + ' 0 0 0 0 ' + Number((c.g / 255).toFixed(2)) + ' 0 0 0 0 ' + Number((c.b / 255).toFixed(2)) + ' 0 0 0 0 ' + (opacity || 1) + ' 0'
        }
        renderers.SvgRenderer = Class.inherit({
            ctor: function(options) {
                options = options || {};
                this._setAnimationOptions(options.animation || {});
                this.animationController = new renderers.AnimationController;
                this.cssClass = options.cssClass || '';
                this.recreateCanvas(options.width, options.height)
            },
            dispose: function() {
                this.killContainer();
                this.animationController.dispose();
                this.animOptions = null;
                this.animationController = null
            },
            _setAnimationOptions: function(options) {
                this.animOptions = {
                    enabled: true,
                    duration: 1000,
                    easing: 'easeOutCubic'
                };
                if ('enabled' in options)
                    this.animOptions.enabled = options.enabled;
                if ('duration' in options)
                    this.animOptions.duration = options.duration;
                if ('easing' in options && renderers.easingFunctions[options.easing])
                    this.animOptions.easing = options.easing
            },
            animationEnabled: function() {
                return !!this.animOptions.enabled
            },
            updateAnimationOptions: function(newOptions) {
                this._setAnimationOptions($.extend(this.animOptions || {}, newOptions))
            },
            stopAllAnimations: function() {
                this.animationController.stop()
            },
            killContainer: function() {
                this.svgRoot && (this.svgRoot.remove(), this.svgRoot = null);
                this.defsSvg && (this.defsSvg.remove(), this.defsSvg = null);
                this.drawn = null
            },
            recreateCanvas: function(width, height, cssClass) {
                if (width > 0 && height > 0) {
                    if (!this.svgRoot) {
                        this.cssClass = cssClass || this.cssClass;
                        this.svgRoot = new RootSvgElement(this, {
                            width: width,
                            height: height,
                            'class': this.cssClass
                        });
                        this.animationController.element = this.svgRoot.element
                    }
                    else
                        this.svgRoot.applySettings({
                            width: width,
                            height: height
                        });
                    this.defsSvg && this.defsSvg.clear("pattern")
                }
            },
            resize: function(width, height) {
                var root = this.getRoot();
                root && width > 0 && height > 0 && root.applySettings({
                    width: width,
                    height: height
                })
            },
            getRoot: function() {
                return this.svgRoot
            },
            isInitialized: function() {
                return !!this.svgRoot
            },
            draw: function(container) {
                if (!container || this.drawn)
                    return;
                container.appendChild(this.getRoot().element);
                this.drawn = true
            },
            updateParams: function(params, options) {
                if (options && options.strokeWidth)
                    params.strokeWidth = options.strokeWidth
            },
            animateElement: function(element, params, options) {
                this.animationController.animateElement(element, params, options)
            },
            createRect: function(x, y, w, h, r, options) {
                var params = {
                        x: x,
                        y: y,
                        width: w,
                        height: h,
                        rx: r,
                        ry: r
                    };
                if (options && !options.inh)
                    $.extend(params, options);
                this.updateParams(params, options);
                return new RectSvgElement(this, params)
            },
            createSegmentRect: function(x, y, w, h, r, segments, options) {
                var params = $.extend({}, options || {}, {
                        x: x,
                        y: y,
                        width: w,
                        height: h,
                        rx: r,
                        ry: r,
                        segments: segments
                    });
                return new SegmentRectSvgElement(this, params)
            },
            createClipRect: function(x, y, w, h) {
                var attr = {
                        x: x,
                        y: y,
                        w: w,
                        h: h,
                        fill: 'none',
                        stroke: 'none',
                        strokeWidth: 0
                    };
                if (!this.defsSvg) {
                    this.defsSvg = new BaseSvgElement(this, 'defs');
                    this.defsSvg.append()
                }
                return new ClipRectSvgElement(this, attr)
            },
            createPattern: function(color, hatching) {
                hatching = hatching || {};
                hatching.direction = (hatching.direction || '').toLowerCase();
                if (hatching.direction !== 'right' && hatching.direction !== 'left')
                    return {
                            id: color,
                            append: function() {
                                return this
                            },
                            clear: function(){},
                            dispose: function(){}
                        };
                if (!this.defsSvg) {
                    this.defsSvg = new BaseSvgElement(this, 'defs');
                    this.defsSvg.append()
                }
                return new PatternSvgElement(this, {
                        hatching: hatching,
                        color: color
                    })
            },
            createImage: function(x, y, w, h, href, options) {
                var params = $.extend({}, options || {}, {
                        x: x,
                        y: y,
                        width: w,
                        height: h
                    });
                return new ImageSvgElement(this, params, href, params.location)
            },
            createLine: function(x1, y1, x2, y2, options) {
                var params = {points: [x1, y1, x2, y2]};
                if (options && !options.inh)
                    $.extend(params, options);
                this.updateParams(params, options);
                return new PathSvgElement(this, params)
            },
            createPath: function(points, options) {
                var params = {points: points};
                if (options && !options.inh)
                    $.extend(params, options);
                this.updateParams(params, options);
                return new PathSvgElement(this, params)
            },
            createSimplePath: function(options) {
                return new BaseSvgElement(this, 'path', options)
            },
            createBezierPath: function(points, options) {
                var params = {points: points};
                if (options && !options.inh)
                    $.extend(params, options);
                this.updateParams(params, options);
                return new BezierSvgElement(this, params)
            },
            createArea: function(points, options) {
                var params = {points: points};
                if (options && !options.inh)
                    $.extend(params, options);
                this.updateParams(params, options);
                return new AreaSvgElement(this, params)
            },
            createBezierArea: function(points, options) {
                var params = {points: points};
                if (options && !options.inh)
                    $.extend(params, options);
                this.updateParams(params, options);
                return new BezierAreaSvgElement(this, params)
            },
            createCircle: function(x, y, r, options) {
                var params = {
                        cx: x,
                        cy: y,
                        r: r
                    };
                if (options && !options.inh)
                    $.extend(params, options);
                return new CircleSvgElement(this, params)
            },
            createArc: function(x, y, outerRadius, innerRadius, startAngle, endAngle, options) {
                var params = {
                        x: x,
                        y: y,
                        outerRadius: outerRadius,
                        innerRadius: innerRadius,
                        startAngle: startAngle,
                        endAngle: endAngle
                    };
                if (options && !options.inh)
                    $.extend(params, options);
                this.updateParams(params, options);
                return new ArcSvgElement(this, params)
            },
            createText: function(text, x, y, options) {
                var params = {
                        x: x,
                        y: y,
                        text: text
                    };
                if (options && !options.inh)
                    $.extend(params, options);
                return new TextSvgElement(this, params)
            },
            createGroup: function(options) {
                return new GroupSvgElement(this, options)
            },
            createFilter: function(type) {
                var filterType = type === 'shadow' ? ShadowFilterSvgElement : null;
                if (filterType) {
                    this.defsSvg = this.defSvg || new BaseSvgElement(this, 'defs').append();
                    return new filterType(this)
                }
                return null
            }
        });
        function buildPath(points) {
            var i = 0,
                ii = points.length,
                list = [];
            for (; i < ii; )
                list.push('L', points[i++].toFixed(2), points[i++].toFixed(2));
            if (ii) {
                list[0] = 'M';
                list.push('Z');
                list = list.join(' ')
            }
            else
                list = '';
            return list
        }
        renderers._svgBuildPath = buildPath;
        renderers._svgRendererInternals = {
            BaseSvgElement: BaseSvgElement,
            RootSvgElement: RootSvgElement,
            RectSvgElement: RectSvgElement,
            ImageSvgElement: ImageSvgElement,
            PathSvgElement: PathSvgElement,
            AreaSvgElement: AreaSvgElement,
            BezierSvgElement: BezierSvgElement,
            BezierAreaSvgElement: BezierAreaSvgElement,
            CircleSvgElement: CircleSvgElement,
            TextSvgElement: TextSvgElement,
            TspanSvgElement: TspanSvgElement,
            GroupSvgElement: GroupSvgElement,
            ArcSvgElement: ArcSvgElement,
            RectSvgBaseElement: RectSvgBaseElement,
            SegmentRectSvgElement: SegmentRectSvgElement,
            ClipRectSvgElement: ClipRectSvgElement,
            PatternSvgElement: PatternSvgElement,
            ShadowFilterSvgElement: ShadowFilterSvgElement
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file vmlRenderer.js */
    (function($, DX) {
        var renderers = DX.viz.renderers,
            utils = DX.utils,
            doc = document,
            svgRendererInternals = renderers._svgRendererInternals;
        var appendTimerID;
        var vmlElementsToAppend = [];
        var CSS_PROPERTIES = ['position', 'display', 'visibility', 'filter', 'margin', 'marginTop', 'marginLeft', 'marginRight', 'marginBottom', 'whiteSpace', 'clip', 'overflow'];
        var INHERITABLE_PROPERTIES = ['stroke', 'fill', 'opacity', 'strokeWidth', 'align'];
        var defaultVmlSettings = {
                x: 0,
                y: 0,
                width: 1,
                height: 1,
                position: 'absolute'
            };
        var extendDefaultVmlOptions = function(customOptions, baseOptions) {
                return $.extend(true, baseOptions || {}, defaultVmlSettings, customOptions)
            };
        var parseRotateParameter = function(rotate, defaultX, defaultY) {
                var rotateObject;
                if (utils.isDefined(rotate))
                    if (utils.isNumber(rotate))
                        rotateObject = {
                            angle: rotate,
                            x: defaultX || 0,
                            y: defaultY || 0
                        };
                    else if ($.isArray(rotate))
                        rotateObject = {
                            angle: rotate[0] || 0,
                            x: rotate[1] || 0,
                            y: rotate[2] || 0
                        };
                    else if (utils.isObject(rotate))
                        rotateObject = {
                            angle: rotate.angle || 0,
                            x: rotate.x || 0,
                            y: rotate.y || 0
                        };
                return rotateObject
            };
        var applySubElementAttribute = function(vmlElement, params, name) {
                var element = vmlElement.element,
                    subElement,
                    value = params[name];
                if (name === 'opacity' || name === 'fillOpacity')
                    if (element.fill)
                        element.fill.opacity = value >= 0.002 ? value : 0.002;
                    else {
                        subElement = doc.createElement('vml:fill');
                        element.appendChild(subElement);
                        subElement.opacity = value >= 0.002 ? value : 0.002;
                        subElement.className = 'vml';
                        if (params.fillcolor)
                            subElement.color = params.fillcolor
                    }
                if (name === 'joinStyle')
                    if (element.stroke)
                        element.stroke.joinStyle = value;
                    else {
                        subElement = doc.createElement('vml:stroke');
                        vmlElement.element.appendChild(subElement);
                        subElement.className = 'vml';
                        subElement.joinStyle = value
                    }
                if (name === 'opacity' || name === 'strokeOpacity')
                    if (element.stroke)
                        element.stroke.opacity = value >= 0.002 ? value : 0.002;
                    else {
                        subElement = doc.createElement('vml:stroke');
                        vmlElement.element.appendChild(subElement);
                        subElement.className = 'vml';
                        subElement.opacity = value >= 0.002 ? value : 0.002;
                        if (params.strokecolor)
                            subElement.color = params.strokecolor
                    }
                if (name === 'dashstyle')
                    if (element.stroke)
                        element.stroke.dashstyle = value;
                    else {
                        subElement = doc.createElement('vml:stroke');
                        vmlElement.element.appendChild(subElement);
                        subElement.className = 'vml';
                        subElement.dashstyle = value
                    }
            };
        var getBoundingClientRect = function(element) {
                var i,
                    resultRect,
                    rect,
                    tagName = element.tagName.toLowerCase(),
                    points,
                    value,
                    halfStrokeWidth;
                if (tagName === 'div') {
                    if (element.childNodes.length > 0) {
                        resultRect = {};
                        for (i = 0; i < element.childNodes.length; i++) {
                            rect = getBoundingClientRect(element.childNodes[i]);
                            if (!rect)
                                continue;
                            resultRect.left = resultRect.left === undefined || rect.left < resultRect.left ? rect.left : resultRect.left;
                            resultRect.top = resultRect.top === undefined || rect.top < resultRect.top ? rect.top : resultRect.top;
                            resultRect.right = resultRect.right === undefined || rect.right > resultRect.right ? rect.right : resultRect.right;
                            resultRect.bottom = resultRect.bottom === undefined || rect.bottom > resultRect.bottom ? rect.bottom : resultRect.bottom
                        }
                    }
                }
                else if (tagName === 'shape' || tagName === 'vml:shape') {
                    points = (element.path.value || element.path).match(/[-0-9]+/g);
                    resultRect = {};
                    rect = element.getBoundingClientRect();
                    for (i = 0; i < points.length; i++) {
                        value = parseInt(points[i]);
                        if (i % 2) {
                            resultRect.top = resultRect.top === undefined || value < resultRect.top ? value : resultRect.top;
                            resultRect.bottom = resultRect.bottom === undefined || value > resultRect.bottom ? value : resultRect.bottom
                        }
                        else {
                            resultRect.left = resultRect.left === undefined || value < resultRect.left ? value : resultRect.left;
                            resultRect.right = resultRect.right === undefined || value > resultRect.right ? value : resultRect.right
                        }
                    }
                    resultRect.left = resultRect.left || 0;
                    resultRect.top = resultRect.top || 0;
                    resultRect.right = resultRect.right || 0;
                    resultRect.bottom = resultRect.bottom || 0;
                    if (rect.right - rect.left <= 1 && rect.top - rect.bottom <= 1) {
                        resultRect.right = resultRect.right + rect.left;
                        resultRect.bottom = resultRect.bottom + rect.top;
                        resultRect.left = resultRect.left + rect.left;
                        resultRect.top = resultRect.top + rect.top
                    }
                    else {
                        resultRect.right = resultRect.right - resultRect.left + rect.left;
                        resultRect.bottom = resultRect.bottom - resultRect.top + rect.top;
                        resultRect.left = rect.left;
                        resultRect.top = rect.top
                    }
                    halfStrokeWidth = Math.ceil(parseFloat(element.strokeweight) / 2);
                    if (halfStrokeWidth && halfStrokeWidth > 1) {
                        resultRect.left -= halfStrokeWidth;
                        resultRect.top -= halfStrokeWidth;
                        resultRect.right += halfStrokeWidth;
                        resultRect.bottom += halfStrokeWidth
                    }
                }
                else
                    resultRect = element.getBoundingClientRect();
                return resultRect
            };
        var BaseVmlElement = {
                isVml: function() {
                    return true
                },
                dispose: function() {
                    this.childElements = null;
                    this._style = null;
                    this._fullSettings = null;
                    this.callBase()
                },
                defaultSettings: function(customOptions) {
                    return extendDefaultVmlOptions(customOptions, this.callBase ? this.callBase() : {})
                },
                createElement: function(nodeName) {
                    this._nodeName = nodeName;
                    this.childElements = [];
                    this._fullSettings = {};
                    if (this.isVml()) {
                        var result = doc.createElement('vml:' + nodeName);
                        result.className = 'vml';
                        return result
                    }
                    else
                        return doc.createElement(nodeName)
                },
                detach: function() {
                    this.callBase();
                    var parent = this.parentElement,
                        index;
                    this._delayAttributes(['opacity']);
                    if (parent) {
                        index = $.inArray(this, parent.childElements);
                        if (index >= 0)
                            parent.childElements.splice(index, 1);
                        this.parentElement = null
                    }
                },
                clear: function() {
                    this.callBase();
                    this.childElements = []
                },
                applyStyle: function(style) {
                    this.callBase(style);
                    if (style.opacity)
                        this.element.style.opacity = style.opacity
                },
                _fillAttributesFromParentAndCurrentStyle: function(attributes) {
                    var element = this.element,
                        parent = this.parentElement,
                        i,
                        settingToStyleMap = {strokeWidth: 'stroke-width'},
                        propertyName,
                        styleName,
                        settingsToApply = {};
                    if (parent)
                        for (i = 0; i < INHERITABLE_PROPERTIES.length; i++) {
                            propertyName = INHERITABLE_PROPERTIES[i];
                            if (!this.settings[propertyName] && parent._fullSettings[propertyName])
                                settingsToApply[propertyName] = parent._fullSettings[propertyName]
                        }
                    if (element.style && element.currentStyle)
                        for (i = 0; i < INHERITABLE_PROPERTIES.length; i++) {
                            propertyName = INHERITABLE_PROPERTIES[i];
                            styleName = settingToStyleMap[propertyName] || propertyName;
                            if (element.currentStyle[styleName])
                                settingsToApply[propertyName] = element.currentStyle[styleName]
                        }
                    $.extend(this._fullSettings, this.settings, settingsToApply);
                    if (this.isVml())
                        $.extend(attributes, this._normalizeSettings(settingsToApply))
                },
                _applyAttributes: function(params) {
                    var name,
                        value;
                    if (params && params.arcsize !== undefined) {
                        try {
                            this.element.setAttribute('arcsize', params.arcsize)
                        }
                        catch(e) {}
                        this.__appliedSettings = {arcsize: params.arcsize};
                        delete params.arcsize
                    }
                    if (params && params['class']) {
                        this.element.className = (this.isVml() ? 'vml ' : '') + params['class'];
                        delete params['class']
                    }
                    if (!this._isAppended)
                        this._delayedAttributes = params;
                    else {
                        params = params || this._delayedAttributes;
                        if (params) {
                            this._fillAttributesFromParentAndCurrentStyle(params);
                            if (this.isVml())
                                for (name in params) {
                                    value = params[name];
                                    if (name === 'opacity' || name === 'fillOpacity' || name === 'strokeOpacity' || name === 'dashstyle' || name === 'joinStyle')
                                        applySubElementAttribute(this, params, name);
                                    else
                                        this.element[name] = value
                                }
                            this.__appliedSettings = this.isVml() ? params : {};
                            delete this._delayedAttributes
                        }
                    }
                },
                appendComplete: function() {
                    if (this.renderer.isElementAppendedToPage(this)) {
                        this._isAppended = true;
                        this._applyAttributes();
                        $.each(this.childElements, function(_, child) {
                            child.appendComplete()
                        })
                    }
                    else {
                        vmlElementsToAppend.push(this);
                        $(this.element).data('vmlNeedAppendComplete', true);
                        if (appendTimerID === undefined)
                            appendTimerID = setTimeout(function() {
                                appendTimerID = undefined;
                                var vmlElements = vmlElementsToAppend;
                                vmlElementsToAppend = [];
                                $.each(vmlElements, function() {
                                    if ($(this.element).data('vmlNeedAppendComplete') && !this._isAppended)
                                        this.appendComplete()
                                })
                            }, 200)
                    }
                },
                append: function(element) {
                    var self = this,
                        root = self.renderer.getRoot(),
                        toElement = element || root;
                    if (toElement) {
                        toElement.element.appendChild(self.element);
                        toElement.childElements.push(self);
                        self.parentElement = toElement
                    }
                    if (toElement === root || toElement._isAppended)
                        this.appendComplete();
                    return self
                },
                insertBefore: function(target) {
                    var parent = target.parentElement;
                    parent.element.insertBefore(this.element, target.element);
                    this.parentElement = parent;
                    parent.childElements.splice($.inArray(target, parent.childElements), 0, this);
                    parent._isAppended && this.appendComplete();
                    return this
                },
                _delayAttributes: function(attributes) {
                    var attr,
                        val,
                        i,
                        settings = this.settings || {};
                    attributes = attributes || [];
                    this._delayedAttributes = this._delayedAttributes || {};
                    for (i = 0; i < attributes.length; i++) {
                        attr = attributes[i];
                        val = settings[attr];
                        if (val)
                            this._delayedAttributes[attr] = val
                    }
                    $.each(this.childElements || [], function(_, child) {
                        child._delayAttributes(attributes)
                    })
                },
                _normalizeSettings: function(settings) {
                    var key,
                        style = {},
                        normalized = {},
                        clipRect,
                        pos,
                        prop,
                        value;
                    for (key in settings) {
                        prop = key;
                        value = settings[prop];
                        if (prop === 'x' || prop === 'translateX') {
                            pos = settings.x || 0;
                            if (settings.translateX)
                                pos += settings.translateX;
                            style.left = pos + 'px'
                        }
                        else if (prop === 'y' || prop === 'translateY') {
                            pos = settings.y || 0;
                            if (settings.translateY)
                                pos += settings.translateY;
                            style.top = pos + 'px'
                        }
                        else if (prop === 'width')
                            style.width = value + 'px';
                        else if (prop === 'height')
                            style.height = value + 'px';
                        else if (prop === 'align')
                            continue;
                        else if (prop === 'scale')
                            continue;
                        else if ($.inArray(prop, CSS_PROPERTIES) != -1)
                            style[prop] = value;
                        else if (prop === 'font') {
                            if (!$.isPlainObject(value))
                                continue;
                            $.each(value, function(fontSetting) {
                                var styleName,
                                    firstChar;
                                switch (fontSetting) {
                                    case'color':
                                    case'opacity':
                                        break;
                                    case'cursor':
                                        styleName = fontSetting;
                                        break;
                                    default:
                                        firstChar = fontSetting.charAt(0);
                                        styleName = 'font' + fontSetting.replace(firstChar, firstChar.toUpperCase())
                                }
                                if (styleName)
                                    style[styleName] = value[fontSetting]
                            })
                        }
                        else if (prop === 'style')
                            $.extend(true, style, value);
                        else if (prop === 'rotate')
                            this['_rotate'] = value;
                        else if (prop === 'clipId') {
                            clipRect = this.renderer.getClipRect(value, this);
                            if (clipRect) {
                                var width = clipRect.width,
                                    height = clipRect.height,
                                    x = clipRect.x,
                                    y = clipRect.y,
                                    clipWidth = width + x,
                                    clipHeight = height + y;
                                style.width = clipRect.cSize.width;
                                style.height = clipRect.cSize.height;
                                style.clip = "rect(" + y + "px, " + clipWidth + "px, " + clipHeight + "px, " + x + "px)"
                            }
                        }
                        else if (prop === 'segments')
                            continue;
                        else if (prop === 'fill') {
                            normalized.filled = value === 'none' ? 'f' : 't';
                            normalized.fillcolor = value === 'grey' ? '#808080' : value
                        }
                        else if (prop === 'opacity')
                            normalized.opacity = value < 0.002 ? value : value;
                        else if (prop === 'stroke') {
                            normalized.stroked = value === 'none' ? 'f' : 't';
                            normalized.strokecolor = value
                        }
                        else if (prop === 'strokeWidth')
                            normalized.strokeweight = value + 'px';
                        else if (prop === 'lineJoin')
                            normalized.joinStyle = value;
                        else if (prop === 'dashStyle') {
                            value = value.toLowerCase();
                            if (value !== 'solid')
                                normalized.dashstyle = value
                        }
                        else
                            normalized[prop] = value
                    }
                    this['_style'] = style;
                    return normalized
                },
                _getBBox: function() {
                    var width,
                        height,
                        rect,
                        parentRect,
                        x = 0,
                        y = 0,
                        element = this.element,
                        parent;
                    try {
                        rect = getBoundingClientRect(element);
                        width = rect.right - rect.left;
                        height = rect.bottom - rect.top;
                        parent = this.element.parentNode || this.renderer.getRoot().element;
                        parentRect = parent.getBoundingClientRect();
                        x = rect.left - parentRect.left;
                        y = rect.top - parentRect.top;
                        if (element.tagName.toLowerCase() === 'div') {
                            x = x - (parseInt(element.style.left, 10) || 0);
                            y = y - (parseInt(element.style.top, 10) || 0)
                        }
                    }
                    catch(e) {
                        width = element.offsetWidth || 0;
                        height = element.offsetHeight || 0
                    }
                    return {
                            x: x,
                            y: y,
                            width: width,
                            height: height,
                            isEmpty: !x && !y && !width && !height
                        }
                },
                getBBox: function() {
                    return this._getBBox()
                },
                sharpEdges: function(){}
            };
        var convertSvgPathCommandToVml = function(command) {
                switch (command) {
                    case'M':
                        return 'm';
                    case'L':
                        return 'l';
                    case'Z':
                        return 'x e'
                }
                return command
            };
        var BasePathVmlElement = {
                defaultSettings: function() {
                    return $.extend(this.callBase(), {coordsize: '1,1'})
                },
                getNodeName: function() {
                    return 'shape'
                },
                getPathAttributeName: function() {
                    return 'path'
                },
                customizeSegments: function(segments) {
                    var result = segments;
                    if (segments)
                        result = $.map(segments, function(s, i) {
                            var pos,
                                segmentArray = [],
                                command = convertSvgPathCommandToVml(s[0]);
                            segmentArray.push(command);
                            for (pos = 1; pos < s.length; pos++)
                                segmentArray.push(Math.floor(s[pos]));
                            return [segmentArray]
                        });
                    return result
                }
            };
        var RootVmlElement = svgRendererInternals.BaseSvgElement.inherit(BaseVmlElement).inherit({
                isVml: function() {
                    return false
                },
                defaultSettings: function() {
                    return {
                            width: 0,
                            height: 0,
                            position: 'relative',
                            display: 'inline-block',
                            overflow: 'hidden',
                            stroke: 'none',
                            strokeWidth: 0,
                            fill: 'none'
                        }
                },
                ctor: function(renderer, params) {
                    this.callBase(renderer, 'div', params)
                }
            });
        var ImageVmlElement = svgRendererInternals.BaseSvgElement.inherit(svgRendererInternals.RectSvgBaseElement).inherit(BaseVmlElement).inherit({
                ctor: function(renderer, params) {
                    this.callBase(renderer, 'image', params)
                },
                defaultSettings: function() {
                    return $.extend(this.callBase(), {strokeWidth: 0})
                },
                adjustSettings: function() {
                    this.callBase();
                    if (this.settings.href) {
                        this.settings.src = this.settings.href;
                        delete this.settings.href
                    }
                }
            });
        var RectVmlElement = svgRendererInternals.BaseSvgElement.inherit(svgRendererInternals.RectSvgBaseElement).inherit(BaseVmlElement).inherit({
                defaultSettings: function() {
                    return extendDefaultVmlOptions({
                            stroked: 'f',
                            strokeWidth: 0,
                            rx: 0,
                            ry: 0
                        })
                },
                recreateElement: function(name) {
                    this._nodeName = name;
                    var parent = this.$element.parent()[0];
                    if (parent) {
                        var $oldElement = this.$element;
                        this.element = this.createElement(name);
                        this.$element = $(this.element);
                        this.$element.insertBefore($oldElement);
                        $oldElement.remove()
                    }
                    else {
                        this.element = this.createElement(name);
                        this.$element = $(this.element)
                    }
                    this.applySettings()
                },
                _adjustArcSize: function() {
                    var settings = this.settings;
                    var rx = settings.rx || 0,
                        ry = settings.ry || 0,
                        width = settings.width,
                        height = settings.height,
                        r,
                        halfsize,
                        arcsize;
                    if (settings.rx !== undefined || settings.ry !== undefined) {
                        r = Math.max(rx, ry);
                        halfsize = Math.max(width, height) / 2;
                        arcsize = r / halfsize;
                        settings.arcsize = arcsize;
                        if ($.isNumeric(arcsize) && arcsize != 0)
                            this._nodeName !== 'roundrect' && this.recreateElement('roundrect');
                        else
                            this._nodeName === 'roundrect' && this.recreateElement('rect');
                        delete settings.rx;
                        delete settings.ry
                    }
                },
                _adjustRotation: function() {
                    var settings = this.settings;
                    var rotate = this.settings.rotate,
                        rotateAngle,
                        radianAngle,
                        cos,
                        sin,
                        rotateX,
                        rotateY,
                        marginTop,
                        marginLeft,
                        cx,
                        cy,
                        rotateObject;
                    rotateObject = parseRotateParameter(rotate, settings.x, settings.y);
                    if (rotateObject) {
                        rotateAngle = rotateObject.angle;
                        rotateX = rotateObject.x;
                        rotateY = rotateObject.y;
                        radianAngle = rotateAngle * Math.PI / 180.0;
                        cos = Math.cos(radianAngle);
                        sin = Math.sin(radianAngle);
                        cx = settings.x + (settings.translateX || 0) + settings.width / 2;
                        cy = settings.y + (settings.translateY || 0) + settings.height / 2;
                        marginLeft = (cx - rotateX) * cos - (cy - rotateY) * sin + rotateX - cx;
                        marginTop = (cx - rotateX) * sin + (cy - rotateY) * cos + rotateY - cy;
                        this.settings.marginLeft = Math.round(marginLeft) + 'px';
                        this.settings.marginTop = Math.round(marginTop) + 'px';
                        this.settings.rotation = rotateAngle
                    }
                },
                adjustSettings: function() {
                    this.callBase();
                    this._adjustArcSize();
                    this._adjustRotation()
                },
                ctor: function(renderer, params) {
                    this.callBase(renderer, 'rect', params)
                }
            });
        var PathVmlElement = svgRendererInternals.PathSvgElement.inherit(BaseVmlElement).inherit(BasePathVmlElement).inherit({prepareSegments: function(settings) {
                    var self = this,
                        rotate = settings.rotate,
                        rotateAngle,
                        rotateX,
                        rotateY,
                        oldSegments,
                        radianAngle,
                        cos,
                        sin,
                        x,
                        y,
                        rotatedX,
                        rotatedY,
                        rotateObject;
                    this.callBase(settings);
                    oldSegments = self.segments;
                    rotateObject = parseRotateParameter(rotate, settings.x, settings.y);
                    if (rotateObject) {
                        rotateAngle = rotateObject.angle;
                        rotateX = rotateObject.x;
                        rotateY = rotateObject.y;
                        if (self.segments) {
                            radianAngle = rotateAngle * Math.PI / 180.0;
                            cos = Math.cos(radianAngle);
                            sin = Math.sin(radianAngle);
                            self.segments = $.map(self.segments, function(s, i) {
                                if (s.length === 3) {
                                    x = s[1],
                                    y = s[2];
                                    rotatedX = (x - rotateX) * cos - (y - rotateY) * sin + rotateX;
                                    rotatedY = (x - rotateX) * sin + (y - rotateY) * cos + rotateY;
                                    return [[s[0], Math.floor(rotatedX), Math.floor(rotatedY)]]
                                }
                                else
                                    return [s]
                            });
                            self.combinePathParams(settings);
                            self.segments = oldSegments
                        }
                    }
                }});
        var SimplePathVmlElement = svgRendererInternals.BaseSvgElement.inherit(BaseVmlElement).inherit({
                ctor: function(renderer, options) {
                    this.callBase(renderer, 'shape', options)
                },
                defaultSettings: function() {
                    return extendDefaultVmlOptions({coordsize: '1,1'})
                },
                adjustSettings: function() {
                    var settings = this.settings;
                    if (settings.d !== undefined) {
                        settings.path = settings.d;
                        delete settings.d
                    }
                }
            });
        var AreaVmlElement = PathVmlElement.inherit({
                defaultSettings: function() {
                    var baseOptions = this.callBase();
                    return extendDefaultVmlOptions({points: {
                                x: 0,
                                y: 0
                            }}, baseOptions)
                },
                ctor: function(renderer, params) {
                    this.closePath = true;
                    this.callBase(renderer, params)
                }
            });
        var SegmentRectVmlElement = svgRendererInternals.SegmentRectSvgElement.inherit(BaseVmlElement).inherit(BasePathVmlElement).inherit({
                defaultSettings: function() {
                    var settings = this.callBase();
                    settings.lineJoin = 'miter';
                    delete settings.fill;
                    delete settings.stroke;
                    delete settings.strokecolor;
                    delete settings.stroked;
                    return settings
                },
                prepareSegments: function() {
                    this.callBase();
                    this.segments = this.customizeSegments(this.segments);
                    this.settings.x = 0;
                    this.settings.y = 0;
                    this.settings.width = 1;
                    this.settings.height = 1
                },
                applySettings: function(settings) {
                    var x = settings.x,
                        y = settings.y,
                        w = settings.width,
                        h = settings.height;
                    this.callBase(settings);
                    this.settings.x = x;
                    this.settings.y = y;
                    this.settings.width = w;
                    this.settings.height = h
                }
            });
        var BezierVmlElement = svgRendererInternals.BezierSvgElement.inherit(BaseVmlElement).inherit(BasePathVmlElement);
        var BezierAreaVmlElement = BezierVmlElement.inherit({
                defaultSettings: function() {
                    var baseOptions = this.callBase();
                    return extendDefaultVmlOptions({points: {
                                x: 0,
                                y: 0
                            }}, baseOptions)
                },
                ctor: function(renderer, params) {
                    this.closePath = true;
                    this.callBase(renderer, params)
                }
            });
        var ArcVmlElement = svgRendererInternals.ArcSvgElement.inherit(BaseVmlElement).inherit(BasePathVmlElement).inherit({createArcSegments: function(x, y, innerR, outerR, startAngle, endAngle, isCircle) {
                    var xOuterStart = x + outerR * Math.cos(startAngle),
                        yOuterStart = y - outerR * Math.sin(startAngle),
                        xOuterEnd = x + outerR * Math.cos(endAngle),
                        yOuterEnd = y - outerR * Math.sin(endAngle),
                        xInnerStart = x + innerR * Math.cos(endAngle),
                        yInnerStart = y - innerR * Math.sin(endAngle),
                        xInnerEnd = x + innerR * Math.cos(startAngle),
                        yInnerEnd = y - innerR * Math.sin(startAngle);
                    return [['wr', x - innerR, y - innerR, x + innerR, y + innerR, xInnerStart, yInnerStart, xInnerEnd, yInnerEnd], [isCircle ? 'wr' : 'at', x - outerR, y - outerR, x + outerR, y + outerR, xOuterStart, yOuterStart, xOuterEnd, yOuterEnd], ['x e']]
                }});
        var CircleVmlElement = svgRendererInternals.BaseSvgElement.inherit(BaseVmlElement).inherit({
                defaultSettings: function() {
                    return extendDefaultVmlOptions({
                            cx: 0,
                            cy: 0,
                            r: 0
                        })
                },
                applySettings: function(settings) {
                    settings.cx = settings.cx || settings.x;
                    settings.cy = settings.cy || settings.y;
                    return this.callBase(settings)
                },
                adjustSettings: function() {
                    var r,
                        cx,
                        cy;
                    if (this.settings.cx !== undefined || this.settings.cy !== undefined || this.settings.r !== undefined) {
                        r = 'r' in this.settings ? this.settings.r : this.settings.width / 2;
                        cx = 'cx' in this.settings ? this.settings.cx : this.settings.x + this.settings.width / 2;
                        cy = 'cy' in this.settings ? this.settings.cy : this.settings.y + this.settings.width / 2;
                        this.settings.x = cx - r;
                        this.settings.y = cy - r;
                        this.settings.width = this.settings.height = r * 2;
                        delete this.settings.cx;
                        delete this.settings.cy;
                        delete this.settings.r
                    }
                },
                ctor: function(renderer, params) {
                    this.callBase(renderer, 'oval', params)
                }
            });
        var TextVmlElement = svgRendererInternals.BaseSvgElement.inherit(BaseVmlElement).inherit({
                isVml: function() {
                    return false
                },
                defaultSettings: function() {
                    return {
                            x: 0,
                            y: 0,
                            position: 'absolute',
                            whiteSpace: 'nowrap'
                        }
                },
                ctor: function(renderer, params) {
                    this.callBase(renderer, 'span', params)
                },
                adjustSettings: function() {
                    var text,
                        settings = this.settings;
                    if (settings.font) {
                        settings.fill = settings.fill || settings.font.color;
                        settings.opacity = settings.opacity || settings.font.opacity
                    }
                    if ('text' in settings) {
                        text = utils.isDefined(settings.text) ? settings.text : '';
                        text = text.toString().replace(/\r/g, "");
                        text = text.replace(/\n/g, "<br/>");
                        $(this.element).html(text);
                        delete settings.text
                    }
                },
                updateText: function(text) {
                    this.applySettings({text: utils.isDefined(text) ? text : ''})
                },
                _applyAttributes: function(settings) {
                    this.callBase(settings);
                    settings = this._fullSettings;
                    var rotate = settings.rotate,
                        rotateAngle = 0,
                        rotateX,
                        rotateY,
                        cos = 1,
                        sin = 0,
                        osin = 0,
                        ocos = 1,
                        angle,
                        otg,
                        rad,
                        y = settings.y + (settings.translateY || 0),
                        x = settings.x + (settings.translateX || 0),
                        align = settings.align,
                        bBox = this.getBBox(),
                        style = this._style || {},
                        marginLeft = 0,
                        marginTop = 0,
                        fontHeightOffset,
                        alignMultiplier,
                        rotateObject,
                        textWidth,
                        textHeight;
                    if (this._oldRotate && !bBox.isEmpty) {
                        rad = this._oldRotate.angle * Math.PI / 180.0;
                        osin = Math.sin(rad);
                        ocos = Math.cos(rad);
                        if ((this._oldRotate.angle | 0) % 90 !== 0)
                            if ((this._oldRotate.angle | 0) % 45 === 0)
                                textWidth = bBox.width,
                                textHeight = bBox.height;
                            else {
                                otg = Math.abs(Math.tan(rad));
                                var b = (bBox.width - bBox.height * otg) / (1 - otg * otg);
                                var a = bBox.width - b;
                                textHeight = Math.abs(a / osin);
                                textWidth = Math.abs(b / ocos)
                            }
                        else {
                            textHeight = Math.abs(bBox.height * ocos - bBox.width * osin);
                            textWidth = Math.abs(bBox.width * ocos - bBox.height * osin)
                        }
                    }
                    else
                        textWidth = bBox.width,
                        textHeight = bBox.height;
                    this.__textWidth = textWidth;
                    this.__textHeight = textHeight;
                    if (textHeight || textWidth) {
                        rotateObject = parseRotateParameter(rotate, x, y);
                        this._oldRotate = rotateObject;
                        if (rotateObject) {
                            rotateAngle = rotateObject.angle;
                            rotateX = rotateObject.x;
                            rotateY = rotateObject.y;
                            if (Math.abs(rotateAngle) > 360)
                                rotateAngle = rotateAngle % 360;
                            if (rotateAngle < 0)
                                rotateAngle = rotateAngle + 360;
                            if (rotateAngle) {
                                rad = rotateAngle * Math.PI / 180.0;
                                cos = Math.cos(rad);
                                sin = Math.sin(rad);
                                style.filter = 'progid:DXImageTransform.Microsoft.Matrix(sizingMethod="auto expand", M11 = ' + cos.toFixed(5) + ', M12 = ' + (-sin).toFixed(5) + ', M21 = ' + sin.toFixed(5) + ', M22 = ' + cos.toFixed(5) + ')'
                            }
                            else {
                                style.filter = '';
                                this._oldRotate = null
                            }
                            marginLeft = (x - rotateX) * (cos - 1) - (y - rotateY) * sin;
                            marginTop = (x - rotateX) * sin + (y - rotateY) * (cos - 1)
                        }
                        fontHeightOffset = textHeight * (0.55 + 0.45 / 2);
                        if (rotateAngle < 90) {
                            marginTop -= fontHeightOffset * cos;
                            marginLeft -= (textHeight - fontHeightOffset) * sin
                        }
                        else if (rotateAngle < 180) {
                            marginTop += (textHeight - fontHeightOffset) * cos;
                            marginLeft += textWidth * cos - (textHeight - fontHeightOffset) * sin
                        }
                        else if (rotateAngle < 270) {
                            marginTop += (textHeight - fontHeightOffset) * cos + textWidth * sin;
                            marginLeft += textWidth * cos + fontHeightOffset * sin
                        }
                        else {
                            marginTop += textWidth * sin - fontHeightOffset * cos;
                            marginLeft += fontHeightOffset * sin
                        }
                        alignMultiplier = {
                            center: 0.5,
                            right: 1
                        }[align];
                        if (alignMultiplier) {
                            marginLeft -= textWidth * alignMultiplier * cos;
                            marginTop -= textWidth * alignMultiplier * sin
                        }
                        style.marginLeft = Math.round(marginLeft) + 'px';
                        style.marginTop = Math.round(marginTop) + 'px'
                    }
                    if (settings.fill && settings.fill !== 'none')
                        style.color = settings.fill;
                    if (settings.opacity)
                        this.element.style.filter = 'alpha(opacity=' + settings.opacity * 100 + ')';
                    this.applyStyle(style)
                }
            });
        var GroupVmlElement = svgRendererInternals.BaseSvgElement.inherit(BaseVmlElement).inherit({
                isVml: function() {
                    return false
                },
                defaultSettings: function() {
                    return {
                            x: 0,
                            y: 0,
                            position: 'absolute'
                        }
                },
                ctor: function(renderer, params) {
                    this.callBase(renderer, 'div', params)
                },
                applySettings: function(settings) {
                    var callBase = this.callBase,
                        rotate;
                    settings = settings || {};
                    rotate = settings.rotate;
                    if (rotate) {
                        if (utils.isNumber(rotate))
                            rotate = [rotate, settings.x || 0, settings.y || 0];
                        $.each(this.childElements, function(_, child) {
                            child.applySettings({rotate: rotate})
                        })
                    }
                    delete settings.rotate;
                    delete settings.x;
                    delete settings.y;
                    this.callBase = callBase;
                    return this.callBase(settings)
                },
                getBBox: function() {
                    return this._getBBox()
                },
                update: function() {
                    if (this.settings.clipId) {
                        var bbox = this.getBBox();
                        this.applyStyle({
                            left: bbox.x + (this.settings.translateX || 0),
                            right: bbox.y + (this.settings.translateY || 0),
                            width: bbox.width,
                            height: bbox.height
                        })
                    }
                }
            });
        renderers.VmlRenderer = renderers.SvgRenderer.inherit({
            ctor: function(options) {
                options = options || {};
                options.animation = {enabled: false};
                if (document.namespaces && !document.namespaces.vml) {
                    document.namespaces.add('vml', 'urn:schemas-microsoft-com:vml');
                    document.createStyleSheet().addRule('.vml', 'behavior: url(#default#VML); display: inline-block;')
                }
                this._clipRects = {};
                this.cssClass = options.cssClass || '';
                this.callBase(options)
            },
            dispose: function() {
                this.callBase();
                this._clipRects = null;
                this._size = null
            },
            updateAnimationOptions: $.noop,
            draw: function(container) {
                var root = this.getRoot();
                this.callBase(container);
                if (root)
                    root.appendComplete()
            },
            recreateCanvas: function(width, height, cssClass) {
                if (width > 0 && height > 0) {
                    this._size = {
                        width: width,
                        height: height
                    };
                    if (!this.svgRoot) {
                        this.cssClass = cssClass || this.cssClass;
                        this.svgRoot = new RootVmlElement(this, {
                            width: width,
                            height: height,
                            'class': this.cssClass
                        })
                    }
                    else
                        this.svgRoot.applySettings({
                            width: width,
                            height: height
                        });
                    this.defsSvg && this.defsSvg.clear()
                }
            },
            _getSize: function() {
                return this._size || {}
            },
            isElementAppendedToPage: function(element) {
                return $(element.element).closest(document.documentElement).length
            },
            createRect: function(x, y, w, h, r, options) {
                var params = $.extend(true, {}, options || {}, {
                        x: x,
                        y: y,
                        width: w,
                        height: h,
                        rx: r,
                        ry: r
                    });
                return new RectVmlElement(this, params)
            },
            createSegmentRect: function(x, y, w, h, r, segments, options) {
                var params = $.extend({}, options || {}, {
                        x: x,
                        y: y,
                        width: w,
                        height: h,
                        rx: r,
                        ry: r,
                        segments: segments
                    });
                return new SegmentRectVmlElement(this, params)
            },
            createClipRect: function(x, y, width, height) {
                var clipId = utils.getNextClipId(),
                    elements = [],
                    clipRect = {
                        id: clipId,
                        x: x,
                        y: y,
                        width: width,
                        height: height,
                        cSize: this._getSize(),
                        addElement: function(element) {
                            var hasElement = false;
                            $.each(elements, function() {
                                if (this === element) {
                                    hasElement = true;
                                    return false
                                }
                            });
                            if (!hasElement)
                                elements.push(element)
                        },
                        append: function() {
                            return this
                        },
                        remove: function(){},
                        dispose: function(){},
                        updateRectangle: function(settings) {
                            if ('x' in settings)
                                this.x = settings.x;
                            if ('translateX' in settings)
                                this.x += settings.translateX;
                            if ('y' in settings)
                                this.y = settings.y;
                            if ('translateY' in settings)
                                this.y += settings.translateY;
                            if ('width' in settings)
                                this.width = settings.width;
                            if ('height' in settings)
                                this.height = settings.height;
                            $.each(elements, function() {
                                this.applySettings({clipId: clipId})
                            });
                            return this
                        }
                    };
                this._clipRects[clipId] = clipRect;
                return clipRect
            },
            getClipRect: function(clipId, element) {
                var clipRect = this._clipRects[clipId];
                if (clipRect && element)
                    clipRect.addElement(element);
                return this._clipRects[clipId]
            },
            createImage: function(x, y, w, h, href, options) {
                var params = $.extend(true, {}, options && !options.inh ? options : {}, {
                        x: x,
                        y: y,
                        width: w,
                        height: h,
                        href: href
                    });
                return new ImageVmlElement(this, params)
            },
            createLine: function(x1, y1, x2, y2, options) {
                var params = $.extend(true, {}, options && !options.inh ? options : {}, {points: [x1, y1, x2, y2]});
                return new PathVmlElement(this, params)
            },
            createPath: function(points, options) {
                var params = $.extend(true, {}, options && !options.inh ? options : {}, {points: points});
                return new PathVmlElement(this, params)
            },
            createSimplePath: function(options) {
                return new SimplePathVmlElement(this, options)
            },
            createBezierPath: function(points, options) {
                var params = $.extend(true, {}, options && !options.inh ? options : {}, {points: points});
                return new BezierVmlElement(this, params)
            },
            createArea: function(points, options) {
                var params = $.extend(true, {}, options && !options.inh ? options : {}, {points: points});
                return new AreaVmlElement(this, params)
            },
            createBezierArea: function(points, options) {
                var params = $.extend(true, {}, options && !options.inh ? options : {}, {points: points});
                return new BezierAreaVmlElement(this, params)
            },
            createCircle: function(x, y, r, options) {
                var params = $.extend(true, {}, options && !options.inh ? options : {}, {
                        cx: x,
                        cy: y,
                        r: r
                    });
                return new CircleVmlElement(this, params)
            },
            createArc: function(x, y, outerRadius, innerRadius, startAngle, endAngle, options) {
                var params = $.extend(true, {}, options && !options.inh ? options : {}, {
                        x: x,
                        y: y,
                        outerRadius: outerRadius,
                        innerRadius: innerRadius,
                        startAngle: startAngle,
                        endAngle: endAngle
                    });
                return new ArcVmlElement(this, params)
            },
            createText: function(text, x, y, options) {
                var params = $.extend(true, {}, options && !options.inh ? options : {}, {
                        x: x,
                        y: y,
                        text: text
                    });
                return new TextVmlElement(this, params)
            },
            createGroup: function(options) {
                return new GroupVmlElement(this, options)
            },
            createPattern: function(color, hatching) {
                return {
                        id: color,
                        append: function() {
                            return this
                        },
                        clear: function(){},
                        dispose: function(){}
                    }
            },
            createFilter: function(type) {
                if (type === 'shadow')
                    return {
                            ref: null,
                            append: function() {
                                return this
                            },
                            dispose: function() {
                                return this
                            },
                            applySettings: function() {
                                return this
                            }
                        };
                return null
            }
        });
        function buildPath(points) {
            var i = 0,
                ii = points.length,
                list = [];
            for (; i < ii; )
                list.push('l', points[i++].toFixed(0), points[i++].toFixed(0));
            if (ii) {
                list[0] = 'm';
                list.push('x e');
                list = list.join(' ')
            }
            else
                list = '';
            return list
        }
        renderers._vmlBuildPath = buildPath;
        renderers.__vmlRendererInternals = {
            RootVmlElement: RootVmlElement,
            RectVmlElement: RectVmlElement,
            ImageVmlElement: ImageVmlElement,
            PathVmlElement: PathVmlElement,
            AreaVmlElement: AreaVmlElement,
            BezierVmlElement: BezierVmlElement,
            BezierAreaVmlElement: BezierAreaVmlElement,
            SimplePathVmlElement: SimplePathVmlElement,
            CircleVmlElement: CircleVmlElement,
            TextVmlElement: TextVmlElement,
            GroupVmlElement: GroupVmlElement,
            ArcVmlElement: ArcVmlElement,
            SegmentRectVmlElement: SegmentRectVmlElement
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file renderer.js */
    (function($, DX) {
        function supportSVG() {
            return !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', "svg").createSVGRect
        }
        var renderers = DX.viz.renderers,
            browser = DX.browser;
        if (browser.msie && browser.version < 9 && !supportSVG()) {
            renderers.Renderer = renderers.VmlRenderer;
            renderers.buildPath = renderers._vmlBuildPath
        }
        else {
            renderers.Renderer = renderers.SvgRenderer;
            renderers.buildPath = renderers._svgBuildPath
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file animation.js */
    (function(DX) {
        var renderers = DX.viz.renderers,
            Class = DX.Class,
            easingFunctions,
            noop = function(){};
        easingFunctions = {
            easeOutCubic: function(pos, start, end) {
                return pos === 1 ? end : (1 - Math.pow(1 - pos, 3)) * (end - start) + +start
            },
            linear: function(pos, start, end) {
                return pos === 1 ? end : pos * (end - start) + +start
            }
        };
        renderers.easingFunctions = easingFunctions;
        renderers.animationSvgStep = {
            points: function(elem, params, progress, easing, currentParams) {
                var from = params.from,
                    to = params.to,
                    path = [],
                    i,
                    j,
                    seg;
                for (i = 0; i < from.length; i++) {
                    seg = [from[i][0]];
                    if (from[i].length > 1)
                        for (j = 1; j < from[i].length; j++)
                            seg.push(easing(progress, from[i][j], to[i][j]));
                    path[i] = seg.join(' ')
                }
                currentParams.d = path.join(' ');
                elem.element.setAttribute('d', currentParams.d)
            },
            transform: function(elem, params, progress, easing, currentParams) {
                var translate = params.translate,
                    rotate = params.rotate,
                    scale = params.scale,
                    transformations = [],
                    elemSettings = elem.settings;
                if (translate) {
                    currentParams.translateX = easing(progress, translate.x.from, translate.x.to);
                    currentParams.translateY = easing(progress, translate.y.from, translate.y.to);
                    transformations.push('translate(' + currentParams.translateX + ',' + currentParams.translateY + ')')
                }
                else if (elemSettings.translateX || elemSettings.translateY)
                    transformations.push('translate(' + (elemSettings.translateX || 0) + ',' + (elemSettings.translateY || 0) + ')');
                if (rotate) {
                    currentParams.rotate = {
                        rotateAngle: easing(progress, rotate.angle.from, rotate.angle.to),
                        rotateX: rotate.x,
                        rotateY: rotate.y
                    };
                    transformations.push('rotate(' + currentParams.rotate.rotateAngle + ',' + rotate.x + ',' + rotate.y + ')')
                }
                else if (elemSettings.rotate)
                    transformations.push('rotate(' + elemSettings.rotate.angle + ',' + (elemSettings.rotate.x || 0) + ',' + (elemSettings.rotate.y || 0) + ')');
                if (scale) {
                    currentParams.scale = {
                        x: easing(progress, scale.x.from, scale.x.to),
                        y: easing(progress, scale.y.from, scale.y.to)
                    };
                    transformations.push('scale(' + currentParams.scale.x + ',' + currentParams.scale.y + ')')
                }
                else if (elemSettings.scale)
                    transformations.push('scale(' + elemSettings.scale.x + ',' + elemSettings.scale.y + ')');
                elem.element.setAttribute('transform', transformations.join())
            },
            base: function(elem, params, progress, easing, currentParams, attributeName) {
                currentParams[attributeName] = easing(progress, params.from, params.to);
                elem.element.setAttribute(attributeName, currentParams[attributeName])
            },
            _: noop,
            complete: function(element, currentSettings) {
                element.applySettings(currentSettings)
            }
        };
        var Animation = Class.inherit({
                ctor: function(element, params, options) {
                    var _this = this;
                    _this._progress = 0;
                    _this.element = element;
                    _this.params = params;
                    _this.options = options;
                    _this.duration = options.partitionDuration ? options.duration * options.partitionDuration : options.duration;
                    _this._animateStep = options.animateStep || renderers.animationSvgStep;
                    _this._easing = easingFunctions[options.easing || 'easeOutCubic'];
                    _this._currentParams = {};
                    _this.tick = _this._start
                },
                _calcProgress: function(now) {
                    return Math.min(1, (now - this._startTime) / this.duration)
                },
                _step: function(now) {
                    var _this = this,
                        animateStep = _this._animateStep,
                        attrName;
                    _this._progress = _this._calcProgress(now);
                    for (attrName in _this.params) {
                        if (!_this.params.hasOwnProperty(attrName))
                            continue;
                        var anim = animateStep[attrName] || animateStep.base;
                        anim(_this.element, _this.params[attrName], _this._progress, _this._easing, _this._currentParams, attrName)
                    }
                    _this.options.step && _this.options.step(_this._easing(_this._progress, 0, 1), _this._progress);
                    if (_this._progress === 1)
                        return _this.stop();
                    return true
                },
                _start: function(now) {
                    this._startTime = now;
                    this.tick = this._step;
                    return true
                },
                _end: function() {
                    var _this = this;
                    _this.stop = noop;
                    _this.tick = noop;
                    _this.options.complete && _this.options.complete();
                    _this._animateStep.complete && _this._animateStep.complete(_this.element, _this._currentParams)
                },
                tick: function(now) {
                    return true
                },
                stop: function(breakAnimation) {
                    var options = this.options;
                    if (!breakAnimation && options.repeatCount && --options.repeatCount > 0) {
                        this.tick = this._start;
                        return true
                    }
                    else
                        this._end()
                }
            });
        renderers.AnimationController = Class.inherit(function() {
            var FPS = 1000 / 60,
                requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
                    setTimeout(callback, FPS)
                };
            return {
                    ctor: function() {
                        var _this = this;
                        _this.requestAnimationFrame = requestAnimationFrame;
                        _this._animationCount = 0;
                        _this._timerId = null;
                        _this._animations = {}
                    },
                    _loop: function() {
                        var _this = this,
                            animations = _this._animations,
                            activeAnimation = 0,
                            now = (new Date).getTime(),
                            an;
                        for (an in animations) {
                            if (!animations.hasOwnProperty(an))
                                continue;
                            if (!animations[an].tick(now))
                                delete animations[an];
                            activeAnimation++
                        }
                        if (activeAnimation === 0) {
                            _this.stop();
                            return
                        }
                        _this._timerId = _this.requestAnimationFrame.call(null, function() {
                            _this._loop()
                        }, _this.element)
                    },
                    addAnimation: function(animation) {
                        var _this = this;
                        _this._animations[_this._animationCount++] = animation;
                        if (!_this._timerId) {
                            clearTimeout(_this._startDelay);
                            _this._startDelay = setTimeout(function() {
                                _this._timerId = 1;
                                _this._loop()
                            }, 0)
                        }
                    },
                    animateElement: function(elem, params, options) {
                        if (elem && params && options) {
                            elem.animation && elem.animation.stop(true);
                            this.addAnimation(elem.animation = new Animation(elem, params, options))
                        }
                    },
                    dispose: function() {
                        this.stop();
                        this.element = null
                    },
                    stop: function() {
                        this._animations = {};
                        this._animationCount = 0;
                        clearTimeout(this._startDelay);
                        this._timerId = null
                    }
                }
        }());
        renderers.Animation = Animation;
        renderers.noop = noop
    })(DevExpress);
    /*! Module viz-core, file namespaces.js */
    (function(DevExpress) {
        DevExpress.viz.charts = {series: {}}
    })(DevExpress);
    /*! Module viz-core, file range.js */
    (function($, DX, undefined) {
        var isDefinedUtils = DX.utils.isDefined,
            isDateUtils = DX.utils.isDate,
            utils = DX.utils;
        var NUMBER_EQUALITY_CORRECTION = 1,
            DATETIME_EQUALITY_CORRECTION = 60000;
        DX.viz.charts.Range = DX.Class.inherit(function() {
            var ctor = function(range) {
                    range && $.extend(this, range)
                };
            var dispose = function() {
                    this.categoriesY = null;
                    this.categoriesX = null
                };
            var otherLessThan = function(thisValue, otherValue) {
                    return otherValue < thisValue
                };
            var otherGreaterThan = function(thisValue, otherValue) {
                    return otherValue > thisValue
                };
            var compareAndReplace = function(thisValue, otherValue, setValue, compare) {
                    var thisValueDefined = thisValue !== undefined,
                        otherValueDefined = otherValue !== undefined;
                    if (thisValueDefined) {
                        if (otherValueDefined && compare(thisValue, otherValue))
                            setValue(otherValue)
                    }
                    else if (otherValueDefined)
                        setValue(otherValue)
                };
            var getBoundRange = function(otherRange) {
                    getBoundRangeX.call(this, otherRange);
                    getBoundRangeY.call(this, otherRange);
                    return this
                };
            var getBoundRangeY = function(otherRange) {
                    var self = this,
                        categoriesY = self.categoriesY,
                        otherCategoriesY = otherRange.categoriesY,
                        i;
                    var setIndentByPriority = function(prefix) {
                            var priorityRelation = (self[prefix + 'Priority'] || 0) - (otherRange[prefix + 'Priority'] || 0);
                            if ((self[prefix] || 0) < otherRange[prefix] && priorityRelation === 0 || priorityRelation < 0) {
                                self[prefix] = otherRange[prefix];
                                self[prefix + 'Priority'] = otherRange[prefix + 'Priority']
                            }
                        };
                    self.invertY = self.invertY || otherRange.invertY;
                    self.stickY = self.stickY || otherRange.stickY;
                    self.axisTypeY = self.axisTypeY || otherRange.axisTypeY;
                    if (self.axisTypeY === 'logarithmic')
                        self.baseY = self.baseY || otherRange.baseY;
                    else
                        self.baseY = undefined;
                    self.keepValueMarginsY = self.keepValueMarginsY || otherRange.keepValueMarginsY;
                    compareAndReplace(self.minY, otherRange.minY, function(value) {
                        self.minY = value
                    }, otherLessThan);
                    compareAndReplace(self.intervalY, otherRange.intervalY, function(value) {
                        self.intervalY = value
                    }, otherLessThan);
                    compareAndReplace(self.maxY, otherRange.maxY, function(value) {
                        self.maxY = value
                    }, otherGreaterThan);
                    compareAndReplace(self.minVisibleY, otherRange.minVisibleY, function(value) {
                        self.minVisibleY = value
                    }, otherLessThan);
                    compareAndReplace(self.maxVisibleY, otherRange.maxVisibleY, function(value) {
                        self.maxVisibleY = value
                    }, otherGreaterThan);
                    setIndentByPriority('minValueMarginY');
                    setIndentByPriority('maxValueMarginY');
                    if (categoriesY === undefined)
                        self.categoriesY = otherCategoriesY;
                    else if (otherCategoriesY && otherCategoriesY.length)
                        for (i = 0; i < otherCategoriesY.length; i++)
                            if ($.inArray(otherCategoriesY[i], categoriesY) === -1)
                                categoriesY.push(otherCategoriesY[i]);
                    return this
                };
            var getBoundRangeX = function(otherRange) {
                    var self = this,
                        categoriesX = self.categoriesX,
                        otherCategoriesX = otherRange.categoriesX,
                        i;
                    var setIndentByPriority = function(prefix) {
                            var priorityRelation = (self[prefix + 'Priority'] || 0) - (otherRange[prefix + 'Priority'] || 0);
                            if ((self[prefix] || 0) < otherRange[prefix] && priorityRelation === 0 || priorityRelation < 0) {
                                self[prefix] = otherRange[prefix];
                                self[prefix + 'Priority'] = otherRange[prefix + 'Priority']
                            }
                        };
                    self.invertX = self.invertX || otherRange.invertX;
                    self.stickX = self.stickX || otherRange.stickX;
                    self.axisTypeX = self.axisTypeX || otherRange.axisTypeX;
                    if (self.axisTypeX === 'logarithmic')
                        self.baseX = self.baseX || otherRange.baseX;
                    else
                        self.baseX = undefined;
                    self.keepValueMarginsX = self.keepValueMarginsX || otherRange.keepValueMarginsX;
                    compareAndReplace(self.minX, otherRange.minX, function(value) {
                        self.minX = value
                    }, otherLessThan);
                    compareAndReplace(self.intervalX, otherRange.intervalX, function(value) {
                        self.intervalX = value
                    }, otherLessThan);
                    compareAndReplace(self.maxX, otherRange.maxX, function(value) {
                        self.maxX = value
                    }, otherGreaterThan);
                    compareAndReplace(self.minVisibleX, otherRange.minVisibleX, function(value) {
                        self.minVisibleX = value
                    }, otherLessThan);
                    compareAndReplace(self.maxVisibleX, otherRange.maxVisibleX, function(value) {
                        self.maxVisibleX = value
                    }, otherGreaterThan);
                    setIndentByPriority('minValueMarginX');
                    setIndentByPriority('maxValueMarginX');
                    if (categoriesX === undefined)
                        self.categoriesX = otherCategoriesX;
                    else if (otherCategoriesX && otherCategoriesX.length)
                        for (i = 0; i < otherCategoriesX.length; i++)
                            if ($.inArray(otherCategoriesX[i], categoriesX) === -1)
                                categoriesX.push(otherCategoriesX[i]);
                    return this
                };
            var isDefined = function() {
                    return isDefinedX.call(this) || isDefinedY.call(this)
                };
            var isDefinedX = function() {
                    return isDefinedUtils(this.minX) && isDefinedUtils(this.maxX) || isDefinedUtils(this.categoriesX)
                };
            var isDefinedY = function() {
                    return isDefinedUtils(this.minY) && isDefinedUtils(this.maxY) || isDefinedUtils(this.categoriesY)
                };
            var setStubData = function(dataType) {
                    setStubDataX.call(this, dataType);
                    setStubDataY.call(this, dataType)
                };
            var setStubDataX = function(dataType) {
                    var year = (new Date).getYear() - 1;
                    var STUB_RANGE_MIN = dataType === 'datetime' ? new Date(year, 0, 1) : 0,
                        STUB_RANGE_MAX = dataType === 'datetime' ? new Date(year, 11, 31) : 10;
                    $.extend(this, {
                        minX: STUB_RANGE_MIN,
                        maxX: STUB_RANGE_MAX,
                        stubDataX: true
                    })
                };
            var setStubDataY = function(dataType) {
                    var year = (new Date).getYear() - 1;
                    var STUB_RANGE_MIN = dataType === 'datetime' ? new Date(year, 0, 1) : 0,
                        STUB_RANGE_MAX = dataType === 'datetime' ? new Date(year, 11, 31) : 10;
                    $.extend(this, {
                        minY: STUB_RANGE_MIN,
                        maxY: STUB_RANGE_MAX,
                        stubDataY: true
                    })
                };
            var correctValueMarginsToZeroIfNeeded = function(self, field) {
                    var length,
                        min = isDefinedUtils(self['minVisible' + field]) ? self['minVisible' + field] : self['min' + field],
                        max = isDefinedUtils(self['maxVisible' + field]) ? self['maxVisible' + field] : self['max' + field],
                        minValueMargin = self['minValueMargin' + field],
                        maxValueMargin = self['maxValueMargin' + field],
                        isDateTime = isDateUtils(max) || isDateUtils(min);
                    if (isDefinedUtils(max) && isDefinedUtils(min))
                        length = max - min;
                    if (length && !isDateTime && !self['keepValueMargins' + field]) {
                        if (min <= 0 && max <= 0 && maxValueMargin && maxValueMargin > max / (min - max)) {
                            self['maxValueMargin' + field] = 0;
                            self['max' + field] = 0
                        }
                        if (min >= 0 && max >= 0 && minValueMargin && minValueMargin > min / (max - min)) {
                            self['minValueMargin' + field] = 0;
                            self['min' + field] = 0
                        }
                    }
                };
            var applyValueMargins = function() {
                    var self = this,
                        lengthX,
                        lengthY,
                        lengthVisibleX,
                        lengthVisibleY,
                        xDateTime = isDateUtils(self.maxX) || isDateUtils(self.minX),
                        yDateTime = isDateUtils(self.maxY) || isDateUtils(self.minY),
                        minX,
                        maxX,
                        minY,
                        maxY,
                        minValue,
                        minVisibleX,
                        maxVisibleX,
                        minVisibleY,
                        maxVisibleY;
                    if (self.axisTypeX === 'logarithmic') {
                        minX = Math.floor(utils.getLog(self.minX, self.baseX));
                        maxX = Math.ceil(utils.getLog(self.maxX, self.baseX));
                        minVisibleX = Math.floor(utils.getLog(self.minVisibleX, self.baseX));
                        maxVisibleX = Math.ceil(utils.getLog(self.maxVisibleX, self.baseX));
                        if (utils.isDefined(self.minX)) {
                            minValue = self.minX;
                            self.minX = utils.raiseTo(minX, self.baseX);
                            if (utils.getLog(minValue / self.minX, self.baseX) < utils.getLog(1 + self.baseX / 10, self.baseX) && (self.keepValueMarginsX || self.keepValueMarginsY) && !self.keepValueMarginsX) {
                                minX -= 1;
                                self.minX = utils.raiseTo(minX, self.baseX)
                            }
                        }
                        if (!isDefinedUtils(self.minVisibleX) || self.minVisibleX < self.minX || self.minVisibleX > self.maxX)
                            minVisibleX = minX;
                        self.minVisibleX = utils.raiseTo(minVisibleX, self.baseX);
                        if (utils.isDefined(self.maxX))
                            self.maxX = utils.raiseTo(maxX, self.baseX);
                        if (!isDefinedUtils(self.maxVisibleX) || self.maxVisibleX < self.minX || self.maxVisibleX > self.maxX)
                            maxVisibleX = maxX;
                        self.maxVisibleX = utils.raiseTo(maxVisibleX, self.baseX)
                    }
                    else {
                        correctValueMarginsToZeroIfNeeded(self, 'X');
                        if (utils.isDefined(self.maxX) && utils.isDefined(self.minX))
                            lengthX = self.maxX - self.minX;
                        if (!utils.isDefined(self.minVisibleX) || self.minVisibleX < self.minX || self.minVisibleX > self.maxX)
                            self.minVisibleX = self.minX;
                        if (!utils.isDefined(self.maxVisibleX) || self.maxVisibleX < self.minX || self.maxVisibleX > self.maxX)
                            self.maxVisibleX = self.maxX;
                        lengthVisibleX = self.maxVisibleX - self.minVisibleX;
                        if (isDefinedUtils(self.minX) && self.minValueMarginX)
                            if (xDateTime)
                                self.minX = new Date(self.minX.valueOf() - lengthX * self.minValueMarginX);
                            else
                                self.minX -= lengthX * self.minValueMarginX;
                        if (isDefinedUtils(self.minVisibleX) && self.minValueMarginX)
                            if (xDateTime)
                                self.minVisibleX = new Date(self.minVisibleX.valueOf() - lengthVisibleX * self.minValueMarginX);
                            else
                                self.minVisibleX -= lengthVisibleX * self.minValueMarginX;
                        if (isDefinedUtils(self.maxX) && self.maxValueMarginX)
                            if (xDateTime)
                                self.maxX = new Date(self.maxX.valueOf() + lengthX * self.maxValueMarginX);
                            else
                                self.maxX += lengthX * self.maxValueMarginX;
                        if (isDefinedUtils(self.maxVisibleX) && self.maxValueMarginX)
                            if (xDateTime)
                                self.maxVisibleX = new Date(self.maxVisibleX.valueOf() + lengthVisibleX * self.maxValueMarginX);
                            else
                                self.maxVisibleX += lengthVisibleX * self.maxValueMarginX
                    }
                    if (self.axisTypeY === 'logarithmic') {
                        minY = Math.floor(utils.getLog(self.minY, self.baseY));
                        maxY = Math.ceil(utils.getLog(self.maxY, self.baseY));
                        minVisibleY = Math.floor(utils.getLog(self.minVisibleY, self.baseY));
                        maxVisibleY = Math.ceil(utils.getLog(self.maxVisibleY, self.baseY));
                        if (utils.isDefined(self.minY)) {
                            minValue = self.minY;
                            self.minY = utils.raiseTo(minY, self.baseY);
                            if (utils.getLog(minValue / self.minY, self.baseY) < utils.getLog(1 + self.baseY / 10, self.baseY) && (self.keepValueMarginsX || self.keepValueMarginsY) && !self.keepValueMarginsY) {
                                minY -= 1;
                                self.minY = utils.raiseTo(minY, self.baseY)
                            }
                        }
                        if (!utils.isDefined(self.minVisibleY) || self.minVisibleY < self.minY || self.minVisibleY > self.maxY)
                            minVisibleY = minY;
                        self.minVisibleY = utils.raiseTo(minVisibleY, self.baseY);
                        if (utils.isDefined(self.maxY))
                            self.maxY = utils.raiseTo(maxY, self.baseY);
                        if (!utils.isDefined(self.maxVisibleY) || self.maxVisibleY < self.minY || self.maxVisibleY > self.maxY)
                            maxVisibleY = maxY;
                        self.maxVisibleY = utils.raiseTo(maxVisibleY, self.baseY)
                    }
                    else {
                        correctValueMarginsToZeroIfNeeded(self, 'Y');
                        if (utils.isDefined(self.maxY) && utils.isDefined(self.minY))
                            lengthY = self.maxY - self.minY;
                        if (!utils.isDefined(self.minVisibleY) || self.minVisibleY < self.minY || self.minVisibleY > self.maxY)
                            self.minVisibleY = self.minY;
                        if (!utils.isDefined(self.maxVisibleY) || self.maxVisibleY < self.minY || self.maxVisibleY > self.maxY)
                            self.maxVisibleY = self.maxY;
                        lengthVisibleY = self.maxVisibleY - self.minVisibleY;
                        if (isDefinedUtils(self.minY) && self.minValueMarginY)
                            if (yDateTime)
                                self.minY = new Date(self.minY.valueOf() - lengthY * self.minValueMarginY);
                            else
                                self.minY -= lengthY * self.minValueMarginY;
                        if (isDefinedUtils(self.minVisibleY) && self.minValueMarginY)
                            if (yDateTime)
                                self.minVisibleY = new Date(self.minVisibleY.valueOf() - lengthVisibleY * self.minValueMarginY);
                            else
                                self.minVisibleY -= lengthVisibleY * self.minValueMarginY;
                        if (isDefinedUtils(self.maxY) && self.maxValueMarginY)
                            if (yDateTime)
                                self.maxY = new Date(self.maxY.valueOf() + lengthY * self.maxValueMarginY);
                            else
                                self.maxY += lengthY * self.maxValueMarginY;
                        if (isDefinedUtils(self.maxVisibleY) && self.maxValueMarginY)
                            if (yDateTime)
                                self.maxVisibleY = new Date(self.maxVisibleY.valueOf() + lengthVisibleY * self.maxValueMarginY);
                            else
                                self.maxVisibleY += lengthVisibleY * self.maxValueMarginY
                    }
                    self.applyEqualLimitsMargins()
                };
            var applyEqualLimitsMargins = function() {
                    var self = this,
                        xDateTime = isDateUtils(self.maxX) || isDateUtils(self.minX),
                        yDateTime = isDateUtils(self.maxY) || isDateUtils(self.minY);
                    if (isDefinedUtils(self.minX) && isDefinedUtils(self.maxX) && self.minX.valueOf() === self.maxX.valueOf())
                        if (xDateTime) {
                            self.minX = new Date(self.minX.valueOf() - DATETIME_EQUALITY_CORRECTION);
                            self.maxX = new Date(self.maxX.valueOf() + DATETIME_EQUALITY_CORRECTION)
                        }
                        else {
                            self.minX = self.minX - NUMBER_EQUALITY_CORRECTION;
                            self.maxX = self.maxX + NUMBER_EQUALITY_CORRECTION
                        }
                    if (isDefinedUtils(self.minVisibleX) && isDefinedUtils(self.maxVisibleX) && self.minVisibleX.valueOf() === self.maxVisibleX.valueOf())
                        if (xDateTime) {
                            self.minVisibleX = self.minVisibleX.valueOf() - DATETIME_EQUALITY_CORRECTION < self.minX.valueOf() ? self.minX : new Date(self.minVisibleX.valueOf() - DATETIME_EQUALITY_CORRECTION);
                            self.maxVisibleX = self.maxVisibleX.valueOf() + DATETIME_EQUALITY_CORRECTION > self.maxX.valueOf() ? self.maxX : new Date(self.maxVisibleX.valueOf() + DATETIME_EQUALITY_CORRECTION)
                        }
                        else {
                            self.minVisibleX = self.minVisibleX - NUMBER_EQUALITY_CORRECTION < self.minX ? self.minX : self.minVisibleX - NUMBER_EQUALITY_CORRECTION;
                            self.maxVisibleX = self.maxVisibleX + NUMBER_EQUALITY_CORRECTION > self.maxX ? self.maxX : self.maxVisibleX + NUMBER_EQUALITY_CORRECTION
                        }
                    if (isDefinedUtils(self.minY) && isDefinedUtils(self.maxY) && self.minY.valueOf() === self.maxY.valueOf())
                        if (yDateTime) {
                            self.minY = new Date(self.minY.valueOf() - DATETIME_EQUALITY_CORRECTION);
                            self.maxY = new Date(self.maxY.valueOf() + DATETIME_EQUALITY_CORRECTION)
                        }
                        else {
                            self.minY = self.minY === 0 ? self.minY : self.minY - NUMBER_EQUALITY_CORRECTION;
                            self.maxY = self.maxY + NUMBER_EQUALITY_CORRECTION
                        }
                    if (isDefinedUtils(self.minVisibleY) && isDefinedUtils(self.maxVisibleY) && self.minVisibleY.valueOf() === self.maxVisibleY.valueOf())
                        if (yDateTime) {
                            self.minVisibleY = self.minVisibleY.valueOf() - DATETIME_EQUALITY_CORRECTION < self.minY.valueOf() ? self.minY : new Date(self.minVisibleY.valueOf() - DATETIME_EQUALITY_CORRECTION);
                            self.maxVisibleY = self.maxVisibleY.valueOf() + DATETIME_EQUALITY_CORRECTION > self.maxY.valueOf() ? self.maxY : new Date(self.maxVisibleY.valueOf() + DATETIME_EQUALITY_CORRECTION)
                        }
                        else {
                            if (self.minVisibleY !== 0)
                                self.minVisibleY = self.minVisibleY - NUMBER_EQUALITY_CORRECTION < self.minY ? self.minY : self.minVisibleY - NUMBER_EQUALITY_CORRECTION;
                            self.maxVisibleY = self.maxVisibleY + NUMBER_EQUALITY_CORRECTION > self.maxY ? self.maxY : self.maxVisibleY + NUMBER_EQUALITY_CORRECTION
                        }
                };
            var correctValueZeroLevel = function() {
                    var self = this;
                    if (isDateUtils(self.maxY) || isDateUtils(self.minY))
                        return;
                    function setZeroLevel(min, max) {
                        self[min] < 0 && self[max] < 0 && (self[max] = 0);
                        self[min] > 0 && self[max] > 0 && (self[min] = 0)
                    }
                    setZeroLevel("minY", "maxY");
                    setZeroLevel("minVisibleY", "maxVisibleY")
                };
            return {
                    ctor: ctor,
                    dispose: dispose,
                    getBoundRange: getBoundRange,
                    getBoundRangeX: getBoundRangeX,
                    getBoundRangeY: getBoundRangeY,
                    isDefined: isDefined,
                    isDefinedX: isDefinedX,
                    isDefinedY: isDefinedY,
                    setStubData: setStubData,
                    setStubDataX: setStubDataX,
                    setStubDataY: setStubDataY,
                    applyValueMargins: applyValueMargins,
                    applyEqualLimitsMargins: applyEqualLimitsMargins,
                    correctValueZeroLevel: correctValueZeroLevel
                }
        }())
    })(jQuery, DevExpress);
    /*! Module viz-core, file chartsConsts.js */
    (function(DX) {
        DX.viz.charts.consts = {
            dataTypes: {
                STRING: 'string',
                NUMERIC: 'numeric',
                DATETIME: 'datetime'
            },
            axisTypes: {
                DISCRETE: 'discrete',
                CONTINUOUS: 'continuous',
                LOGARITHMIC: 'logarithmic'
            }
        }
    })(DevExpress);
    /*! Module viz-core, file dataValidator.js */
    (function($, DX) {
        var viz = DX.viz,
            parseUtils = new viz.core.ParseUtils,
            chartConst = viz.charts.consts,
            dataTypes = chartConst.dataTypes,
            axisTypes = chartConst.axisTypes,
            utils = DX.utils;
        viz.charts.DataValidator = DX.Class.inherit({
            ctor: function(data, groups, incidentOccured, dataPrepareOptions) {
                var _this = this;
                groups = groups || [[]];
                if (!data)
                    _this._nullData = true;
                _this.groups = groups;
                _this.data = data || [];
                _this._parsers = {};
                _this._errorShowList = {};
                _this._skipFields = {};
                _this.options = dataPrepareOptions || {};
                _this.incidentOccured = incidentOccured;
                _this.userArgumentCategories = _this.groups.length && _this.groups[0].length && _this.groups[0][0].options.argumentCategories;
                if (_this.incidentOccured)
                    _this.incidentOccured = function() {
                        incidentOccured.apply(null, arguments)
                    };
                else
                    _this.incidentOccured = $.noop
            },
            validate: function validate() {
                var _this = this;
                _this._data = _this.data;
                if (!utils.isArray(_this.data) || _this._nullData)
                    _this.incidentOccured(_this._errorMessages.incorrectDataMessage.apply(_this));
                _this._checkType();
                _this._checkAxisType();
                if (_this.options.convertToAxisDataType) {
                    _this._createParser();
                    _this._parse()
                }
                _this._sort();
                $.each(_this._skipFields, function(field, fieldValue) {
                    if (fieldValue === _this._data.length)
                        _this.incidentOccured(_this._errorMessages.missingFieldMessage(field))
                });
                return _this._data
            },
            _checkType: function _checkType() {
                var _this = this,
                    groupsWithUndefinedValueType = [],
                    groupsWithUndefinedArgumentType = [],
                    checkValueTypeOfGroup = function checkValueTypeOfGroup(group, cell) {
                        $.each(group, function(_, series) {
                            $.each(series.getValueFields(), function(_, field) {
                                group.valueType = _this._getType(cell[field], group.valueType)
                            })
                        });
                        if (group.valueType)
                            return true
                    },
                    checkArgumentTypeOfGroup = function checkArgumentTypeOfGroup(group, cell) {
                        $.each(group, function(_, series) {
                            var field = series.getArgumentField();
                            _this.groups.argumentType = _this._getType(cell[field], _this.groups.argumentType)
                        });
                        if (_this.groups.argumentType)
                            return true
                    };
                $.each(_this.groups, function(_, group) {
                    if (!group.length)
                        return null;
                    var valueTypeGroup = group[0].options.valueType,
                        argumentTypeGroup = group[0].options.argumentType;
                    group.valueType = valueTypeGroup;
                    _this.groups.argumentType = argumentTypeGroup;
                    valueTypeGroup ? null : groupsWithUndefinedValueType.push(group);
                    argumentTypeGroup ? null : groupsWithUndefinedArgumentType.push(group)
                });
                if (groupsWithUndefinedValueType.length || groupsWithUndefinedArgumentType.length)
                    $.each(_this.data, function(_, cell) {
                        var define = true;
                        if (!utils.isObject(cell))
                            return;
                        $.each(groupsWithUndefinedValueType, function(index, group) {
                            define = define && checkValueTypeOfGroup(group, cell)
                        });
                        $.each(groupsWithUndefinedArgumentType, function(index, group) {
                            define = define && checkArgumentTypeOfGroup(group, cell)
                        });
                        if (!_this.options.checkTypeForAllData && define)
                            return false
                    })
            },
            _checkAxisType: function _checkAxisType() {
                var _this = this;
                $.each(_this.groups, function(_, group) {
                    $.each(group, function(_, series) {
                        var optionsSeries = {};
                        optionsSeries.argumentAxisType = _this._correctAxisType(_this.groups.argumentType, series.options.argumentAxisType, !!(_this.userArgumentCategories && _this.userArgumentCategories.length));
                        optionsSeries.valueAxisType = _this._correctAxisType(group.valueType, series.options.valueAxisType, !!(series.options.valueCategories && series.options.valueCategories.length));
                        _this.groups.argumentAxisType = _this.groups.argumentAxisType || series.options.argumentAxisType;
                        optionsSeries.argumentType = _this.groups.argumentType;
                        optionsSeries.valueType = group.valueType;
                        series._updateDataType(optionsSeries)
                    })
                })
            },
            _createParser: function _createParser() {
                var _this = this;
                $.each(_this.groups, function(index, group) {
                    $.each(group, function(_, series) {
                        _this._parsers[series.getArgumentField()] = _this._createParserUnit(_this.groups.argumentType, _this.groups.argumentAxisType === axisTypes.LOGARITHMIC ? _this._filterForLogAxis : null);
                        $.each(series.getValueFields(), function(_, field) {
                            _this._parsers[field] = _this._createParserUnit(group.valueType, series.options.valueAxisType === axisTypes.LOGARITHMIC ? _this._filterForLogAxis : null)
                        });
                        if (series.getTagField())
                            _this._parsers[series.getTagField()] = null
                    })
                })
            },
            _parse: function _parse() {
                var _this = this,
                    parsedData = [];
                $.each(_this.data, function(_, cell) {
                    var parserObject = {};
                    if (!utils.isObject(cell)) {
                        cell && _this.incidentOccured(_this._errorMessages.incorrectDataMessage.apply(_this));
                        return
                    }
                    $.each(_this._parsers, function(field, parser) {
                        parserObject[field] = parser ? parser(cell[field], field) : cell[field];
                        parserObject['original' + field] = cell[field]
                    });
                    parsedData.push(parserObject)
                });
                this._data = parsedData
            },
            _getType: function _getType(unit, type) {
                if (type === dataTypes.STRING || utils.isString(unit))
                    return dataTypes.STRING;
                if (type === dataTypes.DATETIME || utils.isDate(unit))
                    return dataTypes.DATETIME;
                if (utils.isNumber(unit))
                    return dataTypes.NUMERIC;
                return type
            },
            _correctAxisType: function _correctAxisType(type, axisType, hasCategories) {
                if (type === dataTypes.STRING && (axisType === axisTypes.CONTINUOUS || axisType === axisTypes.LOGARITHMIC))
                    this.incidentOccured(this._errorMessages.incompatibleTypesDataMessage());
                if (axisType === axisTypes.LOGARITHMIC)
                    return axisTypes.LOGARITHMIC;
                axisType = (hasCategories || axisType === axisTypes.DISCRETE || type === dataTypes.STRING) && axisTypes.DISCRETE;
                return axisType || axisTypes.CONTINUOUS
            },
            _filterForLogAxis: function(val, field) {
                if (val <= 0) {
                    this.incidentOccured(this._errorMessages.numericParsingMessage(field, val));
                    return null
                }
                return val
            },
            _createParserUnit: function _createParserUnit(type, filter) {
                var _this = this,
                    parser = type ? parseUtils.getParser(type, undefined, true) : function(unit) {
                        return unit
                    };
                return function(unit, field) {
                        var parseUnit = parser(unit);
                        if (filter)
                            parseUnit = filter.call(_this, parseUnit, field);
                        if (parseUnit === undefined) {
                            _this._addSkipFields(field);
                            _this._validUnit(unit, field, type)
                        }
                        return parseUnit
                    }
            },
            _validUnit: function _validUnit(unit, field, type) {
                if (!unit)
                    return;
                (unit.length || !utils.isDate(unit)) && this.incidentOccured(this._errorMessages.unsupportedFieldMessage(field));
                type === dataTypes.NUMERIC ? this.incidentOccured(this._errorMessages.numericParsingMessage(field)) : this.incidentOccured(this._errorMessages.dateParsingMessage(field))
            },
            _sort: function _sort() {
                var _this = this,
                    groups = _this.groups,
                    hash = {},
                    argumentField = groups.length && groups[0].length && groups[0][0].getArgumentField();
                if (utils.isFunction(_this.options.sortingMethod))
                    _this._data.sort(_this.options.sortingMethod);
                else if (_this.userArgumentCategories) {
                    $.each(_this.userArgumentCategories, function(index, value) {
                        hash[value] = index
                    });
                    _this._data.sort(function sortCat(a, b) {
                        a = a[argumentField];
                        b = b[argumentField];
                        return hash[a] - hash[b]
                    })
                }
                else if (_this.options.sortingMethod === true && groups.argumentType !== dataTypes.STRING)
                    _this._data.sort(function(a, b) {
                        return a[argumentField] - b[argumentField]
                    })
            },
            _addSkipFields: function _addSkipFields(field) {
                this._skipFields[field] = (this._skipFields[field] || 0) + 1
            },
            _errorMessages: {
                missingFieldMessage: function(field) {
                    return "Data source does not contain the '" + field + "' field."
                },
                unsupportedFieldMessage: function(field) {
                    return "The '" + field + "' field contains data of unsupported type."
                },
                incorrectDataMessage: function() {
                    if (this._erorrDataSource !== true) {
                        this._erorrDataSource = true;
                        return "Data source contains unsupported data."
                    }
                },
                incompatibleTypesDataMessage: function() {
                    return "The axis type and data type are incompatible."
                },
                numericParsingMessage: function(field, count) {
                    return "Value of the '" + field + "' field cannot be parsed to a correct numeric"
                },
                dateParsingMessage: function(field, count) {
                    return "Value of the '" + field + "' field cannot be parsed to a correct date."
                }
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file themeManager.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            Palette = viz.core.Palette,
            isArray = DX.utils.isArray;
        var HOVER_COLOR_HIGHLIGHTING = 20,
            HIGHLIGHTING_STEP = 50;
        viz.charts.ThemeManager = viz.core.BaseThemeManager.inherit(function() {
            var ctor = function(options, themeGroupName) {
                    var _this = this;
                    _this.isIE8 = DX.browser.msie && DX.browser.version < 9;
                    options = options || {};
                    _this.callBase(options.theme, themeGroupName || 'chart');
                    _this.palette = new Palette(options.palette || _this.theme.defaultPalette, HIGHLIGHTING_STEP, _this.themeName);
                    _this.init()
                };
            var dispose = function() {
                    this.palette.dispose();
                    this.palette = null;
                    this.callBase()
                };
            var init = function() {
                    var _this = this;
                    _this.theme.legend = _this.theme.legend || {};
                    _this.theme.legend.font = _this.theme.legend.font || {};
                    _this.initializeFont(_this.theme.legend.font);
                    initDefaultSeriesTheme(_this);
                    initAxisTheme(_this);
                    _this.theme.title = _this.theme.title || {};
                    _this.theme.title.font = _this.theme.title.font || {};
                    _this.initializeFont(_this.theme.title.font);
                    _this.theme.tooltip = _this.theme.tooltip || {};
                    _this.theme.tooltip.font = _this.theme.tooltip.font || {};
                    _this.initializeFont(_this.theme.tooltip.font)
                };
            var initDefaultSeriesTheme = function(self) {
                    var theme = self.theme,
                        commonSeriesSettings = theme.commonSeriesSettings,
                        fontOptions = theme.font,
                        pointTheme;
                    commonSeriesSettings.point = commonSeriesSettings.point || {};
                    commonSeriesSettings.containerBackgroundColor = commonSeriesSettings.containerBackgroundColor || theme.containerBackgroundColor;
                    commonSeriesSettings.label = commonSeriesSettings.label || {};
                    self.initializeFont(commonSeriesSettings.label.font)
                };
            var initAxisTheme = function(self) {
                    var theme = self.theme,
                        axisTheme = theme.commonAxisSettings,
                        fontOptions = theme.font,
                        titleTheme,
                        labelTheme;
                    if (axisTheme) {
                        axisTheme.label = axisTheme.label || {};
                        axisTheme.grid = axisTheme.grid || {};
                        axisTheme.ticks = axisTheme.ticks || {};
                        axisTheme.line = axisTheme.line || {};
                        axisTheme.title = axisTheme.title || {};
                        axisTheme.label.font = axisTheme.label.font || {};
                        self.initializeFont(axisTheme.label.font);
                        axisTheme.title.font = axisTheme.title.font || {};
                        self.initializeFont(axisTheme.title.font)
                    }
                };
            var applyChartTheme = function(userOptions) {
                    var self = this,
                        refs = {
                            dataSource: userOptions.dataSource,
                            series: userOptions.series
                        },
                        result;
                    delete userOptions.dataSource;
                    delete userOptions.series;
                    if (userOptions.valueAxis && isArray(userOptions.valueAxis) && !userOptions.valueAxis.length || $.isEmptyObject(userOptions.valueAxis))
                        delete userOptions.valueAxis;
                    if (userOptions.panes && isArray(userOptions.panes) && !userOptions.panes.length || $.isEmptyObject(userOptions.panes))
                        delete userOptions.panes;
                    result = self.applyTheme(self.theme, userOptions);
                    result.dataSource = refs.dataSource;
                    result.series = refs.series;
                    userOptions.series = refs.series;
                    userOptions.dataSource = refs.dataSource;
                    return result
                };
            var applyNextSeriesTheme = function(userOptions, commonSeriesSettings, userCommonSeriesSettings) {
                    var debug = DX.utils.debug;
                    debug.assertParam(userOptions, 'User options were not passed');
                    if (commonSeriesSettings) {
                        debug.assertParam(commonSeriesSettings.hoverStyle, 'hoverStyle option was not passed');
                        debug.assertParam(commonSeriesSettings.selectionStyle, 'selectionStyle option was not passed');
                        debug.assertParam(commonSeriesSettings.point, 'point option was not passed');
                        debug.assertParam(commonSeriesSettings.point.hoverStyle, 'point.hoverStyle option was not passed');
                        debug.assertParam(commonSeriesSettings.point.selectionStyle, 'point.selectionStyle option was not passed')
                    }
                    var self = this,
                        mergedSettings = $.extend(true, {}, commonSeriesSettings || self.theme.commonSeriesSettings),
                        mergedUserSettings = $.extend(true, {}, userCommonSeriesSettings || {}),
                        seriesType = ((userOptions.type || mergedSettings.type || '') + '').toLowerCase(),
                        isBar = ~seriesType.indexOf('bar'),
                        isBubble = ~seriesType.indexOf('bubble'),
                        isArea = ~seriesType.indexOf('area'),
                        mainSeriesColor,
                        mainPointColor;
                    mergedUserSettings = $.extend(true, mergedUserSettings, mergedUserSettings[seriesType]);
                    mergedSettings = $.extend(true, mergedSettings, mergedSettings[seriesType], mergedUserSettings);
                    userOptions = userOptions || {};
                    if (isBar || isBubble)
                        $.extend(true, userOptions, mergedUserSettings.point, userOptions.point);
                    mainSeriesColor = new DX.Color(userOptions.color || mergedUserSettings.color || self.palette.getNextColor());
                    mergedSettings.color = mainSeriesColor.toHex();
                    mergedSettings.border.color = mergedSettings.border.color || mainSeriesColor.toHex();
                    mergedSettings.hoverStyle.color = mergedSettings.hoverStyle.color || self.isIE8 && (isBar || isBubble || isArea) && mainSeriesColor.highlight(HOVER_COLOR_HIGHLIGHTING) || mainSeriesColor.toHex();
                    mergedSettings.hoverStyle.border.color = mergedSettings.hoverStyle.border.color || mainSeriesColor.toHex();
                    mergedSettings.selectionStyle.color = mergedSettings.selectionStyle.color || self.isIE8 && (isBar || isBubble || isArea) && mainSeriesColor.highlight(HOVER_COLOR_HIGHLIGHTING) || mainSeriesColor.toHex();
                    mergedSettings.selectionStyle.border.color = mergedSettings.selectionStyle.border.color || mainSeriesColor.toHex();
                    mainPointColor = new DX.Color(userOptions.point && userOptions.point.color || mergedUserSettings.point && mergedUserSettings.point.color || mainSeriesColor.toHex());
                    mergedSettings.point.color = mainPointColor.toHex();
                    mergedSettings.point.border.color = mergedSettings.point.border.color || isBar && mergedSettings.border.color || mainPointColor.toHex();
                    mergedSettings.point.hoverStyle.color = mergedSettings.point.hoverStyle.color || isBar && mergedSettings.hoverStyle.color || mergedSettings.containerBackgroundColor;
                    mergedSettings.point.hoverStyle.border.color = mergedSettings.point.hoverStyle.border.color || isBar && mergedSettings.hoverStyle.border.color || mainPointColor.toHex();
                    mergedSettings.point.selectionStyle.color = mergedSettings.point.selectionStyle.color || isBar && mergedSettings.selectionStyle.color || mergedSettings.containerBackgroundColor;
                    mergedSettings.point.selectionStyle.border.color = mergedSettings.point.selectionStyle.border.color || isBar && mergedSettings.selectionStyle.border.color || mainPointColor.toHex();
                    return self.applyTheme(mergedSettings, userOptions)
                };
            var applyPieSeriesTheme = function applyPieSeriesTheme(userOptions, commonSeriesSettings, userCommonSeriesSettings) {
                    var self = this,
                        commonSettings = commonSeriesSettings || self.theme.commonSeriesSettings || {},
                        seriesType = (userOptions.type || commonSettings.type || '').toLowerCase();
                    if (seriesType && seriesType !== 'pie')
                        commonSettings[seriesType] = $.extend(true, {}, commonSettings[seriesType], commonSettings.pie);
                    userCommonSeriesSettings = userCommonSeriesSettings || {};
                    userOptions = userOptions || {};
                    userOptions = $.extend(true, {}, commonSettings, commonSettings[seriesType], userCommonSeriesSettings, userCommonSeriesSettings[seriesType], userOptions);
                    return userOptions
                };
            var applyNextPieSegmentTheme = function applyNextPieSegmentTheme(userOptions, commonSeriesSettings) {
                    var self = this,
                        commonSettings = commonSeriesSettings || self.theme.commonSeriesSettings || {},
                        mergedSettings = $.extend(true, {}, commonSettings.pie),
                        seriesType = userOptions.type || mergedSettings.type || '';
                    userOptions = userOptions || {};
                    var mainColor = new DX.Color(userOptions.color || self.palette.getNextColor());
                    mergedSettings.color = mainColor.toHex();
                    mergedSettings.border.color = mergedSettings.border.color || mainColor.toHex();
                    mergedSettings.hoverStyle.color = mergedSettings.hoverStyle.color || self.isIE8 && mainColor.highlight(HOVER_COLOR_HIGHLIGHTING) || mainColor.toHex();
                    mergedSettings.hoverStyle.border.color = mergedSettings.hoverStyle.border.color || mainColor.toHex();
                    mergedSettings.selectionStyle.color = mergedSettings.selectionStyle.color || self.isIE8 && mainColor.highlight(HOVER_COLOR_HIGHLIGHTING) || mainColor.toHex();
                    mergedSettings.selectionStyle.border.color = mergedSettings.selectionStyle.border.color || mainColor.toHex();
                    return self.applyTheme(mergedSettings, userOptions)
                };
            var resetPalette = function() {
                    this.palette.reset()
                };
            var updatePalette = function(palette) {
                    this.palette = new Palette(palette || this.theme.defaultPalette, HIGHLIGHTING_STEP, this.themeName)
                };
            return {
                    ctor: ctor,
                    dispose: dispose,
                    init: init,
                    applyChartTheme: applyChartTheme,
                    applyNextSeriesTheme: applyNextSeriesTheme,
                    applyPieSeriesTheme: applyPieSeriesTheme,
                    applyNextPieSegmentTheme: applyNextPieSegmentTheme,
                    resetPalette: resetPalette,
                    updatePalette: updatePalette
                }
        }())
    })(jQuery, DevExpress);
    /*! Module viz-core, file tooltip.js */
    (function($, DX, undefined) {
        var formatHelper = DX.formatHelper;
        var ARROW_WIDTH = 20;
        DX.viz.charts.Tooltip = DX.Class.inherit({
            ctor: function(options, group) {
                this.textStyle = {align: 'center'};
                this.tooltipGroup = group;
                this._reinit(options)
            },
            dispose: function() {
                this.shadow = null;
                this.cloud = null;
                this.text = null;
                this.tooltipGroup = null;
                this.options = null;
                this.textStyle = null;
                this.renderer = null
            },
            update: function(options) {
                this._reinit(options)
            },
            _reinit: function(options) {
                options = options || {};
                this.renderer = options.renderer || this.renderer;
                this.customColor = options.color || this.customColor;
                this.textStyle.font = options.font || this.textStyle.font;
                this.canvasWidth = options.canvasWidth || this.canvasWidth;
                this.canvasHeight = options.canvasHeight || this.canvasHeight;
                delete options.renderer;
                delete options.font;
                this.options = $.extend(true, {}, this.options || {}, options)
            },
            formatValueTooltip: function(options) {
                return formatHelper.format(this.value, options.format, options.precision)
            },
            formatTooltip: function(options) {
                var formatTooltipValues = function(point) {
                        point.argumentText = formatHelper.format(point.argument, options.argumentFormat, options.argumentPrecision);
                        if (point.percent !== undefined)
                            point.percentText = formatHelper.format(point.percent, 'percent', options.percentPrecision);
                        if (point.total !== undefined)
                            point.totalText = formatHelper.format(point.total, options.format, options.precision)
                    };
                formatTooltipValues(this);
                $.each(this.points || [], function(_, point) {
                    formatTooltipValues(point)
                });
                return options.customizeText ? options.customizeText.call(this, this) : this.valueText
            },
            _getData: function() {
                var _this = this,
                    x = _this.x,
                    y = _this.y,
                    xt = x,
                    yt = y,
                    i,
                    align = 'center',
                    pointsOfShadow = [],
                    points = [],
                    bbox = _this.text.getBBox(),
                    options = _this.options,
                    paddingLeftRight = options.paddingLeftRight,
                    paddingTopBottom = options.paddingTopBottom,
                    arrowLength = options.arrowLength > 0 ? options.arrowLength : 0,
                    horPosition = options.cloudHorizontalPosition,
                    verPosition = options.cloudVerticalPosition,
                    isHorPositionDefined = horPosition !== undefined && horPosition !== null,
                    isVerPositionDefined = verPosition !== undefined && verPosition !== null,
                    cloudWidth = bbox.width + paddingLeftRight * 2,
                    cloudHeight = bbox.height + paddingTopBottom * 2,
                    updatedText;
                updatedText = _this._checkWidthText(cloudWidth, cloudHeight);
                if (updatedText) {
                    bbox = updatedText.bbox;
                    cloudWidth = updatedText.cloudWidth;
                    cloudHeight = updatedText.cloudHeight;
                    paddingLeftRight = updatedText.paddingLeftRight;
                    paddingTopBottom = updatedText.paddingTopBottom
                }
                if (isHorPositionDefined ? horPosition === 'right' : cloudWidth / 2 > x) {
                    points = _this._setArrowLeft(cloudWidth, cloudHeight, arrowLength, x, y);
                    align = 'left';
                    xt += paddingLeftRight
                }
                else if (isHorPositionDefined ? horPosition === 'left' : x + cloudWidth / 2 > _this.canvasWidth) {
                    points = _this._setArrowRight(cloudWidth, cloudHeight, arrowLength, x, y);
                    align = 'right';
                    xt -= paddingLeftRight
                }
                else
                    points = _this._setArrowCenter(cloudWidth, cloudHeight, arrowLength, x, y);
                if (isVerPositionDefined ? verPosition === 'top' : cloudHeight + arrowLength < y) {
                    yt -= arrowLength + cloudHeight / 2 - bbox.height / 2 + _this.tooltipOffset;
                    _this.tooltipInverted = false
                }
                else {
                    yt += arrowLength + cloudHeight / 2 + bbox.height / 2 + _this.tooltipOffset;
                    _this.tooltipInverted = true
                }
                $.extend(pointsOfShadow, points);
                if (arrowLength > 0 && !_this.tooltipInverted) {
                    if (cloudHeight + arrowLength < y)
                        pointsOfShadow[1] += 2;
                    if (cloudWidth / 2 > x)
                        pointsOfShadow[2] += 2;
                    else if (x + cloudWidth / 2 > _this.canvasWidth)
                        pointsOfShadow[pointsOfShadow.length - 2] -= 2;
                    else {
                        pointsOfShadow[2] += 2;
                        pointsOfShadow[pointsOfShadow.length - 2] -= 2
                    }
                }
                else if (_this.tooltipInverted)
                    if (x + cloudWidth / 2 < _this.canvasWidth)
                        pointsOfShadow[1] = pointsOfShadow[3];
                return {
                        points: points,
                        text: {
                            x: xt,
                            y: yt,
                            align: align
                        },
                        pointsOfShadow: pointsOfShadow
                    }
            },
            _updateTooltip: function() {
                var _this = this,
                    box,
                    data,
                    SHADOW_OFFSET = 4,
                    scale;
                _this.text.updateText(_this.tooltipText);
                _this.text.applySettings({font: _this.textStyle.font});
                data = _this._getData();
                _this.shadow.applySettings({points: data.pointsOfShadow});
                _this.shadow.move(_this.tooltipInverted ? SHADOW_OFFSET : 0, SHADOW_OFFSET);
                _this.cloud.applySettings({
                    points: data.points,
                    fill: _this.fillColor,
                    'class': _this.className
                });
                _this.text.applySettings({y: data.text.y});
                box = _this.text.getBBox();
                _this.text.applySettings({
                    x: data.text.x,
                    y: data.text.y - (box.y + box.height - data.text.y),
                    align: data.text.align
                });
                box = _this.tooltipGroup.getBBox();
                if (box.y + box.height > _this.canvasHeight) {
                    scale = (_this.canvasHeight - box.y) / box.height;
                    _this.tooltipGroup.applySettings({
                        scale: scale,
                        translateX: _this.x * (1 - scale),
                        translateY: _this.y * (1 - scale)
                    })
                }
                else
                    _this.tooltipGroup.applySettings({
                        scale: 1,
                        translateX: 0,
                        translateY: 0
                    })
            },
            draw: function() {
                if (!this.shadow) {
                    this.shadow = this.renderer.createPath({}, {
                        fill: '#000000',
                        stroke: 'none',
                        opacity: 0.1
                    });
                    this.cloud = this.renderer.createArea({}, {fill: this.customColor});
                    this.text = this.renderer.createText('0', 0, 0, this.textStyle)
                }
                this.shadow.append(this.tooltipGroup);
                this.cloud.append(this.tooltipGroup);
                this.text.append(this.tooltipGroup);
                this.hide()
            },
            show: function() {
                var options = {visibility: 'visible'};
                this.shadow.applySettings(options);
                this.cloud.applySettings(options);
                this.text.applySettings(options)
            },
            hide: function() {
                var options = {visibility: 'hidden'};
                this.shadow.applySettings(options);
                this.cloud.applySettings(options);
                this.text.applySettings(options)
            },
            move: function(x, y, offset, text, color, className) {
                this.x = x;
                this.y = y;
                this.tooltipOffset = offset;
                this.tooltipText = text;
                this.fillColor = this.customColor || color;
                this.className = className;
                this._updateTooltip()
            },
            _setArrowCenter: function(cloudWidth, cloudHeight, arrowLength, x, y) {
                var _this = this,
                    position = _this.options.cloudVerticalPosition,
                    isPosDefined = position !== undefined && position !== null,
                    verticalInvert = !(isPosDefined ? position === 'top' : cloudHeight + arrowLength < y),
                    x0 = x,
                    y0 = verticalInvert ? y + _this.tooltipOffset : y - _this.tooltipOffset,
                    x1 = x0 + ARROW_WIDTH / 2,
                    y1 = verticalInvert ? y0 + arrowLength : y0 - arrowLength,
                    x2 = x1 + cloudWidth / 2 - ARROW_WIDTH / 2,
                    y2 = y1,
                    x3 = x2,
                    y3 = verticalInvert ? y2 + cloudHeight : y2 - cloudHeight,
                    x4 = x3 - cloudWidth,
                    y4 = y3,
                    x5 = x4,
                    y5 = verticalInvert ? y4 - cloudHeight : y4 + cloudHeight,
                    x6 = x5 + cloudWidth / 2 - ARROW_WIDTH / 2,
                    y6 = y5;
                return [x0, y0, x1, y1, x2, y2, x3, y3, x4, y4, x5, y5, x6, y6]
            },
            _setArrowLeft: function(cloudWidth, cloudHeight, arrowLength, x, y) {
                var _this = this,
                    position = _this.options.cloudVerticalPosition,
                    isPosDefined = position !== undefined && position !== null,
                    verticalInvert = !(isPosDefined ? position === 'top' : cloudHeight + arrowLength < y),
                    x0 = x,
                    y0 = verticalInvert ? y + _this.tooltipOffset : y - _this.tooltipOffset,
                    x1 = x0 + ARROW_WIDTH,
                    y1 = verticalInvert ? y0 + arrowLength : y0 - arrowLength,
                    x2 = x1 + cloudWidth - ARROW_WIDTH,
                    y2 = y1,
                    x3 = x2,
                    y3 = verticalInvert ? y2 + cloudHeight : y2 - cloudHeight,
                    x4 = x3 - cloudWidth,
                    y4 = y3,
                    x5 = x4,
                    y5 = verticalInvert ? y4 - cloudHeight - arrowLength : y4 + cloudHeight + arrowLength;
                return [x0, y0, x1, y1, x2, y2, x3, y3, x4, y4, x5, y5]
            },
            _setArrowRight: function(cloudWidth, cloudHeight, arrowLength, x, y) {
                var _this = this,
                    position = _this.options.cloudVerticalPosition,
                    isPosDefined = position !== undefined && position !== null,
                    verticalInvert = !(isPosDefined ? position === 'top' : cloudHeight + arrowLength < y),
                    x0 = x,
                    y0 = verticalInvert ? y + _this.tooltipOffset : y - _this.tooltipOffset,
                    x1 = x0,
                    y1 = verticalInvert ? y0 + arrowLength + cloudHeight : y0 - arrowLength - cloudHeight,
                    x2 = x1 - cloudWidth,
                    y2 = y1,
                    x3 = x2,
                    y3 = verticalInvert ? y2 - cloudHeight : y2 + cloudHeight,
                    x4 = x3 + cloudWidth - ARROW_WIDTH,
                    y4 = y3,
                    x5 = x4 + ARROW_WIDTH,
                    y5 = verticalInvert ? y4 - arrowLength : y4 + arrowLength;
                return [x0, y0, x1, y1, x2, y2, x3, y3, x4, y4, x5, y5]
            },
            _checkWidthText: function(cloudWidth, cloudHeight) {
                var x = this.x,
                    y = this.y,
                    text = this.tooltipText,
                    index,
                    paddingLeftRight = this.options.paddingLeftRight,
                    paddingTopBottom = this.options.paddingTopBottom,
                    textLength,
                    maxTooltipWidth,
                    remainLength,
                    newIndex,
                    bbox = this.text.getBBox();
                if (cloudWidth < x || x + cloudWidth < this.canvasWidth || cloudWidth / 2 < x && x + cloudWidth / 2 < this.canvasWidth)
                    return false;
                if (text.indexOf("<br/>") === -1 && text.indexOf(" ") !== -1) {
                    maxTooltipWidth = Math.max(x, this.canvasWidth - x, 2 * Math.min(x, this.canvasWidth - x));
                    textLength = text.length * maxTooltipWidth / bbox.width;
                    index = text.substr(0, ~~textLength).lastIndexOf(" ");
                    if (index === -1)
                        index = text.substr(0).indexOf(" ");
                    remainLength = text.substr(index + 1).length;
                    this.tooltipText = text.substr(0, index) + "<br/>";
                    while (textLength <= remainLength) {
                        newIndex = text.substr(index + 1, ~~textLength).lastIndexOf(" ");
                        if (newIndex === -1)
                            newIndex = text.substr(index + 1).indexOf(" ");
                        if (newIndex !== -1) {
                            this.tooltipText += text.substr(index + 1, newIndex) + "<br/>";
                            remainLength = text.substr(index + 1 + newIndex).length;
                            index += newIndex + 1
                        }
                        else
                            break
                    }
                    this.tooltipText += text.substr(index + 1);
                    this.text.updateText(this.tooltipText);
                    bbox = this.text.getBBox();
                    cloudWidth = bbox.width + paddingLeftRight * 2;
                    cloudHeight = bbox.height + paddingTopBottom * 2
                }
                if (cloudWidth > x && x + cloudWidth > this.canvasWidth && (cloudWidth / 2 > x || x + cloudWidth / 2 > this.canvasWidth)) {
                    paddingLeftRight = 5;
                    paddingTopBottom = 5;
                    cloudWidth = bbox.width + 2 * paddingLeftRight;
                    cloudHeight = bbox.height + 2 * paddingTopBottom
                }
                return {
                        bbox: bbox,
                        cloudWidth: cloudWidth,
                        cloudHeight: cloudHeight,
                        paddingTopBottom: paddingTopBottom,
                        paddingLeftRight: paddingLeftRight
                    }
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file seriesConsts.js */
    (function(DX) {
        DX.viz.charts.series.consts = {
            events: {
                mouseover: 'mouseover',
                mouseout: 'mouseout',
                mousemove: 'mousemove',
                touchstart: 'touchstart',
                touchmove: 'touchmove',
                touchend: 'touchend',
                mousedown: 'mousedown',
                mouseup: 'mouseup',
                click: 'click',
                selectSeries: 'selectseries',
                deselectSeries: 'deselectseries',
                selectPoint: 'selectpoint',
                deselectPoint: 'deselectpoint',
                showPointTooltip: 'showpointtooltip',
                hidePointTooltip: 'hidepointtooltip'
            },
            states: {
                hover: 'hover',
                normal: 'normal',
                selected: 'selected',
                normalMark: 0,
                hoverMark: 1,
                selectedMark: 2
            },
            animations: {
                showDuration: {duration: 400},
                hideGroup: {opacity: 0.0001},
                showGroup: {opacity: 1}
            }
        }
    })(DevExpress);
    /*! Module viz-core, file seriesDrawers.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            utils = utils = DX.utils;
        series.SeriesPointsDrawerMixin = {
            drawPoints: function(group, labelsGroup, points, animationEnabled) {
                var self = this,
                    labelVisible = self.areLabelsVisible();
                if (self.hoverPattern) {
                    self.styles.states.hover.fill = this.hoverPattern.id;
                    self.styles.states.selected.fill = this.selectedPattern.id
                }
                $.each(points, function(i, point) {
                    point.adjustSeriesLabels = self.adjustSeriesLabels;
                    if (!point.isInVisibleArea(point.x, point.y, point.width || 0, point.height || 0))
                        return;
                    point.options.visible && point.drawMarker(self.renderer, group, animationEnabled);
                    labelVisible && point.drawLabel(self.renderer, labelsGroup)
                })
            },
            drawPointTrackers: function(points) {
                var self = this,
                    trackersVisible = !self._suppressTrackers;
                $.each(points, function drawPointTracker(i, point) {
                    if (!point.isInVisibleArea(point.x, point.y, point.width || 0, point.height || 0))
                        return;
                    trackersVisible && point.drawTrackerMarker(self.renderer, self.options.markerTrackerGroup)
                })
            }
        };
        series.LineDrawerMixin = {
            drawLine: function(seriesElementsGroup, segment) {
                this.paths.push(this.createSpecialPath(segment, this.styles.attributes).append(seriesElementsGroup))
            },
            drawLineTracker: function(segment) {
                var self = this,
                    styles = this.styles,
                    strokeWidth;
                if (this._suppressTrackers)
                    return;
                strokeWidth = styles.attributes.strokeWidth < 20 ? 20 : styles.attributes.strokeWidth;
                var tracker = self.createSpecialPath(segment, {
                        strokeWidth: strokeWidth,
                        stroke: 'grey',
                        opacity: 0.0001
                    }).append(self.options.seriesTrackerGroup);
                self.trackerElements.push(tracker);
                tracker.data({series: self})
            },
            createSpecialPath: function(segment, argument) {
                return this.renderer.createPath(segment, argument)
            }
        };
        series.AreaDrawerMixin = {
            drawArea: function(seriesElementsGroup, index, areaSegment) {
                this.resetLineColors();
                if (this.isStackedSeries() || this.isFullStackedSeries())
                    this.seriesGroup.toBackground();
                if (this.segments[index].length === 1) {
                    var stickArea = this.renderer.createPath(areaSegment, this.styles.stick).append(seriesElementsGroup);
                    stickArea.stick = true;
                    this.areas.push(stickArea)
                }
                else
                    this.areas.push(this.createSpecialArea(areaSegment, this.styles.area).append(seriesElementsGroup));
                if (this.hoverPattern) {
                    this.styles.area.states.hover.fill = this.hoverPattern.id;
                    this.styles.area.states.selected.fill = this.selectedPattern.id;
                    this.styles.states.hover.fill = 'none';
                    this.styles.states.selected.fill = 'none'
                }
            },
            drawAreaTracker: function(index, segment) {
                var tracker;
                if (this._suppressTrackers)
                    return;
                if (this.areaSegments[index].length === 2)
                    tracker = this.renderer.createPath(this.areaSegments[index], {
                        strokeWidth: 20,
                        stroke: 'grey',
                        opacity: 0.0001
                    }).append(this.options.seriesTrackerGroup);
                else
                    tracker = this.createSpecialArea(this.areaSegments[index], {
                        strokeWidth: 0,
                        fill: 'grey',
                        opacity: 0.0001
                    }).append(this.options.seriesTrackerGroup);
                this.trackerElements.push(tracker);
                tracker.data({series: this})
            },
            prepareSegments: function(index) {
                this.areaSegments = this.areaSegments || [];
                var segments = this.preparedSegments || this.segments,
                    fwPoints = $.map(segments[index], function(pt) {
                        return pt.getCoords()
                    }),
                    bwPoints = $.map(segments[index].slice().reverse(), function(pt) {
                        return pt.getCoords(true)
                    });
                this.areaSegments[index] = fwPoints.concat(bwPoints)
            },
            createSpecialArea: function(segment, attributes) {
                return this.renderer.createArea(segment, attributes)
            }
        };
        series.SplineDrawerMixin = {
            drawSpline: function(seriesElementsGroup, index, segment) {
                series.LineDrawerMixin.drawLine.call(this, seriesElementsGroup, segment)
            },
            drawSplineTracker: function(index) {
                series.LineDrawerMixin.drawLineTracker.call(this, this.preparedSegments[index])
            },
            prepareSegments: function(index) {
                var self = this,
                    bezierPoints = [],
                    pointsCopy = self.segments[index];
                self.preparedSegments = self.preparedSegments || [];
                var checkExtr = function(otherPointCoord, pointCoord, controlCoord) {
                        return otherPointCoord > pointCoord && controlCoord > otherPointCoord || otherPointCoord < pointCoord && controlCoord < otherPointCoord ? otherPointCoord : controlCoord
                    };
                var clonePoint = function(point, newX, newY) {
                        var p = utils.clone(point);
                        p.x = newX;
                        p.y = newY;
                        return p
                    };
                if (pointsCopy.length !== 1)
                    $.each(pointsCopy, function(i, curPoint) {
                        var leftControlX,
                            leftControlY,
                            rightControlX,
                            rightControlY,
                            prevPoint,
                            nextPoint,
                            xCur,
                            yCur,
                            x1,
                            x2,
                            y1,
                            y2,
                            delta,
                            lambda = 0.5,
                            curIsExtremum,
                            leftPoint,
                            rightPoint,
                            a,
                            b,
                            c,
                            xc,
                            yc,
                            shift;
                        if (!i) {
                            bezierPoints.push(curPoint);
                            bezierPoints.push(curPoint);
                            return
                        }
                        prevPoint = pointsCopy[i - 1];
                        if (i < pointsCopy.length - 1) {
                            nextPoint = pointsCopy[i + 1];
                            xCur = curPoint.x;
                            yCur = curPoint.y;
                            x1 = prevPoint.x;
                            x2 = nextPoint.x;
                            y1 = prevPoint.y;
                            y2 = nextPoint.y;
                            curIsExtremum = !!(!self.options.rotated && (yCur <= prevPoint.y && yCur <= nextPoint.y || yCur >= prevPoint.y && yCur >= nextPoint.y) || self.options.rotated && (xCur <= prevPoint.x && xCur <= nextPoint.x || xCur >= prevPoint.x && xCur >= nextPoint.x));
                            if (curIsExtremum)
                                if (!self.options.rotated) {
                                    rightControlY = leftControlY = yCur;
                                    rightControlX = (xCur + nextPoint.x) / 2;
                                    leftControlX = (xCur + prevPoint.x) / 2
                                }
                                else {
                                    rightControlX = leftControlX = xCur;
                                    rightControlY = (yCur + nextPoint.y) / 2;
                                    leftControlY = (yCur + prevPoint.y) / 2
                                }
                            else {
                                a = y2 - y1;
                                b = x1 - x2;
                                c = y1 * x2 - x1 * y2;
                                if (!self.options.rotated) {
                                    xc = xCur;
                                    yc = -1 * (a * xc + c) / b;
                                    shift = yc - yCur || 0;
                                    y1 -= shift;
                                    y2 -= shift
                                }
                                else {
                                    yc = yCur;
                                    xc = -1 * (b * yc + c) / a;
                                    shift = xc - xCur || 0;
                                    x1 -= shift;
                                    x2 -= shift
                                }
                                rightControlX = (xCur + lambda * x2) / (1 + lambda);
                                rightControlY = (yCur + lambda * y2) / (1 + lambda);
                                leftControlX = (xCur + lambda * x1) / (1 + lambda);
                                leftControlY = (yCur + lambda * y1) / (1 + lambda)
                            }
                            if (!self.options.rotated) {
                                leftControlY = checkExtr(prevPoint.y, yCur, leftControlY);
                                rightControlY = checkExtr(nextPoint.y, yCur, rightControlY)
                            }
                            else {
                                leftControlX = checkExtr(prevPoint.x, xCur, leftControlX);
                                rightControlX = checkExtr(nextPoint.x, xCur, rightControlX)
                            }
                            leftPoint = clonePoint(curPoint, leftControlX, leftControlY);
                            rightPoint = clonePoint(curPoint, rightControlX, rightControlY);
                            bezierPoints.push(leftPoint, curPoint, rightPoint)
                        }
                        else {
                            bezierPoints.push(curPoint, curPoint);
                            return
                        }
                    });
                else
                    bezierPoints.push(pointsCopy[0]);
                self.preparedSegments[index] = bezierPoints
            },
            createSpecialPath: function(segment, argument) {
                return this.renderer.createBezierPath(segment, argument)
            }
        };
        series.SplineAreaDrawerMixin = {
            drawSplineArea: series.AreaDrawerMixin.drawArea,
            drawSplineAreaTracker: series.AreaDrawerMixin.drawAreaTracker,
            prepareSegments: function(index) {
                series.SplineDrawerMixin.prepareSegments.call(this, index);
                series.AreaDrawerMixin.prepareSegments.call(this, index);
                var segment = this.areaSegments[index];
                var lastFwPoint = segment[segment.length / 2 - 1];
                var firstBwPoint = segment[segment.length / 2];
                segment.splice(segment.length / 2, 0, {
                    x: lastFwPoint.x,
                    y: lastFwPoint.y
                }, {
                    x: firstBwPoint.x,
                    y: firstBwPoint.y
                })
            },
            createSpecialArea: function(segment, attributes) {
                return this.renderer.createBezierArea(segment, attributes)
            }
        };
        series.StepLineDrawerMixin = {
            drawStepLine: function(seriesElementsGroup, index, segment) {
                series.LineDrawerMixin.drawLine.call(this, seriesElementsGroup, segment)
            },
            drawStepLineTracker: function(index, segment) {
                series.LineDrawerMixin.drawLineTracker.call(this, this.preparedSegments[index])
            },
            prepareSegments: function(index) {
                var self = this,
                    segmentPoint = [];
                self.preparedSegments = self.preparedSegments || [];
                $.each(self.segments[index], function(i, pt) {
                    var stepY;
                    if (!i) {
                        segmentPoint.push(pt);
                        return
                    }
                    stepY = segmentPoint[segmentPoint.length - 1].y;
                    if (stepY !== pt.y) {
                        var point = utils.clone(pt);
                        point.y = stepY;
                        segmentPoint.push(point)
                    }
                    segmentPoint.push(pt)
                });
                self.preparedSegments[index] = segmentPoint
            },
            createSpecialPath: function(segment, argument) {
                return this.renderer.createPath(segment, argument)
            }
        };
        series.StepAreaDrawerMixin = {
            drawStepArea: series.AreaDrawerMixin.drawArea,
            drawStepAreaTrackers: series.AreaDrawerMixin.drawAreaTracker,
            prepareSegments: function(index) {
                series.StepLineDrawerMixin.prepareSegments.call(this, index);
                series.AreaDrawerMixin.prepareSegments.call(this, index)
            },
            createSpecialArea: function(segment, attributes) {
                return this.renderer.createArea(segment, attributes)
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file seriesStatesVisualizer.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            ALL_SERIES_POINTS_MODE = 'allseriespoints',
            INCLUDE_POINTS_MODE = 'includepoints',
            statesConsts = series.consts.states;
        series.pointVisualizationMixin = {
            applyPointStyle: function(mode, nameFunc) {
                if (mode === ALL_SERIES_POINTS_MODE || mode === INCLUDE_POINTS_MODE)
                    $.each(this.segments, function(_, segment) {
                        $.each(segment, function(_, pt) {
                            if (!(pt.fullState & statesConsts.selectedMark))
                                pt[nameFunc]()
                        })
                    })
            },
            applyPointNormalStyle: function(mode) {
                this.applyPointStyle(mode, 'applyNormalStyle')
            },
            applyPointHoverStyle: function(mode) {
                this.applyPointStyle(mode, 'applyHoverStyle')
            },
            applyPointSelectionStyle: function(mode) {
                this.applyPointStyle(mode, 'applySelectionStyle')
            }
        };
        series.pathVisualizationMixin = {
            applyPathStyle: function(style) {
                var self = this;
                $.each(this.paths, function(_, path) {
                    path.applySettings(style)
                })
            },
            applyPathNormalStyle: function() {
                this.applyPathStyle(this.styles.states.normal)
            },
            applyPathHoverStyle: function() {
                this.applyPathStyle(this.styles.states.hover)
            },
            applyPathSelectionStyle: function() {
                this.applyPathStyle(this.styles.states.selected)
            }
        };
        series.areaVisualizationMixin = {
            applyAreaStyle: function(mode, style) {
                var self = this;
                if (this.areas)
                    $.each(this.areas, function(_, area) {
                        if (!area.stick)
                            area.applySettings(self.styles.area.states[style]);
                        else
                            area.applySettings(self.styles.stick.states[style])
                    })
            },
            applyAreaNormalStyle: function(mode) {
                this.applyAreaStyle(mode, 'normal')
            },
            applyAreaHoverStyle: function(mode) {
                this.applyAreaStyle(mode, 'hover')
            },
            applyAreaSelectionStyle: function(mode) {
                this.applyAreaStyle(mode, 'selected')
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file seriesAdjustOptions.js */
    (function($, DX) {
        var series = DX.viz.charts.series;
        series.LineSeriesAdjustOptionsMixin = {adjustOptions: function() {
                var styles = this.styles,
                    attributes = styles.attributes,
                    hover = styles.states.hover,
                    selected = styles.states.selected,
                    normal = styles.states.normal;
                attributes.stroke = attributes.fill;
                attributes.fill = 'none';
                attributes.strokeWidth = attributes.lineWidth;
                normal.stroke = normal.fill;
                normal.fill = 'none';
                normal.strokeWidth = normal.lineWidth;
                hover.stroke = hover.fill;
                hover.fill = 'none';
                hover.strokeWidth = hover.lineWidth;
                selected.stroke = selected.fill;
                selected.fill = 'none';
                selected.strokeWidth = selected.lineWidth
            }};
        series.AreaSeriesAdjustOptionsMixin = {adjustOptions: function() {
                var styles = this.styles,
                    attributes = styles.attributes,
                    states = styles.states,
                    hover = states.hover,
                    selected = states.selected,
                    normal = states.normal,
                    areaNormal = {},
                    areaHover = {},
                    areaSelected = {},
                    stickNormal = {},
                    stickHover = {},
                    stickSelected = {},
                    opacity;
                opacity = 'opacity' in attributes ? attributes.opacity : 0.5;
                areaNormal = {
                    fill: normal.fill,
                    stroke: 'none',
                    strokeWidth: 0,
                    opacity: opacity
                };
                areaHover = {
                    fill: hover.fill,
                    stroke: 'none',
                    strokeWidth: 0,
                    opacity: opacity
                };
                areaSelected = {
                    fill: selected.fill,
                    stroke: 'none',
                    strokeWidth: 0,
                    opacity: opacity
                };
                stickNormal = {
                    fill: 'none',
                    stroke: normal.fill,
                    strokeWidth: 1,
                    opacity: opacity
                };
                stickHover = {
                    fill: 'none',
                    stroke: hover.fill,
                    strokeWidth: 1,
                    opacity: opacity
                };
                stickSelected = {
                    fill: 'none',
                    stroke: selected.fill,
                    strokeWidth: 1,
                    opacity: opacity
                };
                styles.area = {
                    'class': 'dxc-area-element',
                    fill: attributes.fill,
                    stroke: 'none',
                    strokeWidth: 0,
                    opacity: opacity,
                    states: {
                        normal: areaNormal,
                        hover: areaHover,
                        selected: areaSelected
                    }
                };
                styles.stick = {
                    'class': 'dxc-area-element',
                    fill: 'none',
                    stroke: attributes.fill,
                    strokeWidth: 1,
                    opacity: opacity,
                    states: {
                        normal: stickNormal,
                        hover: stickHover,
                        selected: stickSelected
                    }
                }
            }};
        series.BarSeriesAdjustOptionsMixin = {adjustOptions: function() {
                var styles = this.styles,
                    options = this.options,
                    attributes = styles.attributes,
                    hover = styles.states.hover,
                    selected = styles.states.selected,
                    normal = styles.states.normal,
                    pointAttributes = styles.point.attributes,
                    pointHover = styles.point.states.hover,
                    pointSelected = styles.point.states.selected,
                    pointNormal = styles.point.states.normal,
                    hoverMode = options.hoverMode,
                    selectionMode = options.selectionMode,
                    func = function(mode) {
                        if (!mode)
                            return false;
                        switch (mode.toLowerCase()) {
                            case"allseriespoints":
                            case"allargumentpoints":
                            case"none":
                                return true
                        }
                    };
                $.extend(true, pointAttributes, attributes);
                $.extend(true, pointHover, hover);
                $.extend(true, pointSelected, selected);
                $.extend(true, pointNormal, normal);
                pointHover.r = pointSelected.r = pointNormal.r = pointAttributes.r;
                styles.point.hoverMode = func(hoverMode) && hoverMode;
                styles.point.selectionMode = func(selectionMode) && selectionMode;
                styles.point.visible = true
            }};
        series.CandleStickSeriesAdjustOptionsMixin = {adjustOptions: function() {
                var styles = this.styles,
                    options = this.options,
                    attributes = styles.attributes,
                    hover = styles.states.hover,
                    selected = styles.states.selected,
                    normal = styles.states.normal,
                    pointAttributes = styles.point.attributes,
                    pointHover = styles.point.states.hover,
                    pointSelected = styles.point.states.selected,
                    pointNormal = styles.point.states.normal,
                    hoverMode = options.hoverMode,
                    selectionMode = options.selectionMode,
                    func = function(mode) {
                        if (!mode)
                            return false;
                        switch (mode.toLowerCase()) {
                            case"allseriespoints":
                            case"allargumentpoints":
                            case"none":
                                return true
                        }
                    };
                attributes.stroke = attributes.fill;
                attributes.strokeWidth = attributes.lineWidth;
                normal.stroke = normal.fill;
                normal.strokeWidth = normal.lineWidth;
                hover.stroke = hover.fill;
                hover.strokeWidth = hover.lineWidth;
                selected.stroke = selected.fill;
                selected.strokeWidth = selected.lineWidth;
                $.extend(true, pointAttributes, attributes);
                $.extend(true, pointHover, hover);
                $.extend(true, pointSelected, selected);
                $.extend(true, pointNormal, normal);
                pointHover.r = pointSelected.r = pointNormal.r = pointAttributes.r = 0;
                styles.point.hoverMode = func(hoverMode) && hoverMode;
                styles.point.selectionMode = func(selectionMode) && selectionMode;
                styles.point.visible = true
            }};
        series.BubleSeriesAdjustOptionsMixin = {adjustOptions: function() {
                var styles = this.styles,
                    options = this.options,
                    attributes = styles.attributes,
                    hover = styles.states.hover,
                    selected = styles.states.selected,
                    normal = styles.states.normal,
                    pointAttributes = styles.point.attributes,
                    pointHover = styles.point.states.hover,
                    pointSelected = styles.point.states.selected,
                    pointNormal = styles.point.states.normal,
                    hoverMode = options.hoverMode,
                    selectionMode = options.selectionMode,
                    func = function(mode) {
                        if (!mode)
                            return false;
                        switch (mode.toLowerCase()) {
                            case"allseriespoints":
                            case"allargumentpoints":
                            case"none":
                                return true
                        }
                    };
                $.extend(true, pointAttributes, attributes);
                $.extend(true, pointHover, hover);
                $.extend(true, pointSelected, selected);
                $.extend(true, pointNormal, normal);
                delete pointHover.r;
                delete pointSelected.r;
                delete pointNormal.r;
                styles.point.hoverMode = func(hoverMode) && hoverMode;
                styles.point.selectionMode = func(selectionMode) && selectionMode;
                styles.point.visible = true
            }}
    })(jQuery, DevExpress);
    /*! Module viz-core, file seriesAnimation.js */
    (function($, DX, undefined) {
        var series = DX.viz.charts.series;
        series.pointsAnimation = {
            animatePoints: function(complete) {
                if (this.points && this.points.length) {
                    var lastPointIndex = this.points.length - 1;
                    $.each(this.points, function(index, pt) {
                        pt.animate(index === lastPointIndex ? complete : undefined)
                    })
                }
                else
                    complete && complete()
            },
            sequentialAnimatePoints: function(complete) {
                if (this.styles && this.styles.point.visible && this.segments) {
                    var _this = this,
                        i = 0,
                        t = 0.2,
                        pointsCount = _this.points && _this.points.length,
                        duration = 1 / (t * (pointsCount - 1) + 1);
                    var animateP = function() {
                            if (_this.points[i])
                                _this.points[i++].animate(i === pointsCount ? complete : undefined, duration, function(_, p) {
                                    if (p >= t) {
                                        this.step = null;
                                        animateP()
                                    }
                                })
                        };
                    animateP()
                }
            }
        };
        series.pathAnimation = {
            animatePaths: function(complete) {
                var self = this,
                    segments = self.preparedSegments || self.segments;
                if (segments && segments.length && self.paths && self.paths.length)
                    $.each(self.paths, function(i, path) {
                        path.animate({points: segments[i]}, {}, i == segments.length - 1 ? complete : undefined)
                    });
                else
                    complete && complete()
            },
            getZeroPathPoints: function(i) {
                var segments = this.preparedSegments || this.segments;
                return $.map(segments[i], function(pt) {
                        return pt.getDefaultCoords()
                    })
            }
        };
        series.areaAnimation = {
            animateAreas: function(complete) {
                var self = this,
                    lastAreaIndex;
                if (self.areaSegments && self.areaSegments.length && self.areas) {
                    lastAreaIndex = self.areas.length - 1;
                    $.each(self.areas, function(i, area) {
                        area.animate({points: self.areaSegments[i]}, undefined, i === lastAreaIndex ? complete : undefined)
                    })
                }
                else
                    complete && complete()
            },
            getZeroAreaPoints: function(i) {
                var fwPoints,
                    bwPoints,
                    segments = this.preparedSegments || this.segments;
                fwPoints = $.map(segments[i], function(pt) {
                    return pt.getDefaultCoords()
                });
                bwPoints = $.map(segments[i].slice().reverse(), function(pt) {
                    return pt.getDefaultCoords()
                });
                return fwPoints.concat(bwPoints)
            }
        };
        series.splineAreaAnimation = {
            animateAreas: function(complete) {
                series.areaAnimation.animateAreas.call(this, complete)
            },
            getZeroAreaPoints: function(i) {
                var areaPoints = series.areaAnimation.getZeroAreaPoints.call(this, i);
                var lastFwPoint = areaPoints[areaPoints.length / 2 - 1];
                var firstBwPoint = areaPoints[areaPoints.length / 2];
                areaPoints.splice(areaPoints.length / 2, 0, {
                    x: lastFwPoint.x,
                    y: lastFwPoint.y
                }, {
                    x: firstBwPoint.x,
                    y: firstBwPoint.y
                });
                return areaPoints
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file seriesSpecialMethods.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            isDefined = DX.utils.isDefined,
            utils = DX.utils;
        series.specialAreaMethodsMixin = {resetLineColors: function() {
                var styles = this.styles,
                    attributes = styles.attributes,
                    states = styles.states,
                    hover = states.hover,
                    selected = states.selected,
                    normal = states.normal;
                attributes.fill = 'none';
                delete attributes.lineWidth;
                normal.fill = 'none';
                delete normal.lineWidth;
                hover.fill = 'none';
                delete hover.lineWidth;
                selected.fill = 'none';
                delete selected.lineWidth
            }};
        series.specialBarMethodsMixin = {_getPointSize: function() {
                return 3
            }};
        series.specialCandleStickMethodsMixin = {
            getRangeData: function() {
                var self = this,
                    options = self.options,
                    rotated = options.rotated,
                    valAxis = rotated ? 'X' : 'Y',
                    argAxis = rotated ? 'Y' : 'X',
                    points = self.points,
                    vals = [],
                    args = [];
                var compareNumeric = function(a, b) {
                        return a - b
                    };
                $.each(this.points, function(i, val) {
                    isDefined(val.argument) && args.push(val.argument);
                    if (val.hasValue()) {
                        vals.push(val.highValue);
                        vals.push(val.lowValue)
                    }
                });
                self.rangeData = {};
                var processArgument = function(arg, prevArg) {
                        var interval;
                        if (utils.isDefined(prevArg))
                            interval = Math.abs(arg - prevArg);
                        if (utils.isDefined(interval) && (interval < self.rangeData.intervalX || !utils.isDefined(self.rangeData.intervalX)))
                            self.rangeData.intervalX = interval
                    };
                if (vals.length) {
                    vals.sort(compareNumeric);
                    self.rangeData['max' + valAxis] = vals[vals.length - 1];
                    self.rangeData['min' + valAxis] = vals[0];
                    $.each(points, function(i, point) {
                        var prevPoint,
                            arg = point.argument,
                            prevArg;
                        if (i !== 0) {
                            prevPoint = points[i - 1];
                            prevArg = prevPoint.argument
                        }
                        processArgument(arg, prevArg)
                    })
                }
                if (args.length && options.argumentAxisType !== 'discrete') {
                    args.sort(compareNumeric);
                    self.rangeData['min' + argAxis] = args[0];
                    self.rangeData['max' + argAxis] = args[args.length - 1]
                }
                else
                    self.rangeData['categories' + argAxis] = args;
                return this.rangeData
            },
            _getPointStyles: function(i, reductionLevel, valueFields) {
                var pointStylesReduct = $.extend(true, {}, this.styles.point || {}),
                    innerColor = this.styles.reduction.innerColor,
                    className = 'dx-candle-default',
                    reductionColor = this.styles.reduction.color;
                if (valueFields.open !== null && valueFields.high !== null && valueFields.low !== null && valueFields.close !== null) {
                    if (i !== 0)
                        if (this.prevLevelValue !== null && reductionLevel < this.prevLevelValue) {
                            pointStylesReduct.attributes.fill = pointStylesReduct.states.normal.fill = pointStylesReduct.states.hover.fill = pointStylesReduct.states.selected.fill = reductionColor;
                            pointStylesReduct.attributes.stroke = pointStylesReduct.states.normal.stroke = pointStylesReduct.states.hover.stroke = pointStylesReduct.states.selected.stroke = reductionColor;
                            className = 'dx-candle-reduction'
                        }
                    this.prevLevelValue = reductionLevel;
                    if (valueFields.open < valueFields.close) {
                        pointStylesReduct.attributes.fill = pointStylesReduct.states.normal.fill = pointStylesReduct.states.hover.fill = pointStylesReduct.states.selected.fill = innerColor;
                        className = (className ? className : '') + ' dx-candle-positive'
                    }
                }
                pointStylesReduct.attributes['class'] = className;
                return {
                        className: className,
                        pointStylesReduct: pointStylesReduct
                    }
            },
            reinitData: function(data) {
                var self = this,
                    level,
                    pointFactory = series.pointFactory,
                    argumentField = this.options.argumentField || 'date',
                    openValueField = this.options.openValueField || 'open',
                    highValueField = this.options.highValueField || 'high',
                    lowValueField = this.options.lowValueField || 'low',
                    closeValueField = this.options.closeValueField || 'close',
                    tagField = this.options.tagField,
                    styles;
                this.segments = [];
                if (!data.length) {
                    this.points = [];
                    return
                }
                self.level = this.styles.reduction.level;
                switch ((self.level || '').toLowerCase()) {
                    case'open':
                        level = openValueField;
                        break;
                    case'high':
                        level = highValueField;
                        break;
                    case'low':
                        level = lowValueField;
                        break;
                    default:
                        level = closeValueField;
                        self.level = 'close';
                        break
                }
                self.pointsByArgument = {};
                self.className = 'dx-candle-default';
                this.points = $.map(data, function(val, i) {
                    var point;
                    if (val[argumentField] === undefined || val[argumentField] === null || val[openValueField] === undefined || val[highValueField] === undefined || val[lowValueField] === undefined || val[closeValueField] === undefined)
                        return;
                    styles = self._getPointStyles(i, val[level], {
                        open: val[openValueField],
                        high: val[highValueField],
                        close: val[closeValueField],
                        low: val[lowValueField]
                    });
                    point = pointFactory.createPoint(self.type, {
                        openValue: val[openValueField],
                        pointClassName: styles.className,
                        highValue: val[highValueField],
                        lowValue: val[lowValueField],
                        closeValue: val[closeValueField],
                        argument: val[argumentField],
                        originalOpenValue: val['original' + openValueField],
                        originalHighValue: val['original' + highValueField],
                        originalLowValue: val['original' + lowValueField],
                        originalCloseValue: val['original' + closeValueField],
                        originalArgument: val['original' + argumentField],
                        options: styles.pointStylesReduct,
                        tag: val[tagField],
                        reductionValue: val[level],
                        series: self
                    });
                    self.pointsByArgument[point.argument.valueOf()] = self.pointsByArgument[point.argument.valueOf()] || point;
                    return point
                });
                delete this.prevLevelValue;
                self.originalPoints = self.points;
                this._segmentPoints()
            },
            createPatterns: function() {
                var self = this,
                    hover = self.styles.states.hover,
                    selected = self.styles.states.selected,
                    normal = self.styles.states.normal,
                    reductionColor = self.styles.reduction.color,
                    renderer = self.renderer;
                self.callBase();
                if (!self.patternColorReduction)
                    self.patternColorReduction = reductionColor;
                if (!self.hoverPatternReduction) {
                    self.hoverPatternReduction = renderer.createPattern(normal.fill === hover.fill ? self.patternColorReduction : hover.fill, hover.hatching);
                    self.selectedPatternReduction = renderer.createPattern(normal.fill === selected.fill ? self.patternColorReduction : selected.fill, selected.hatching)
                }
                self.hoverPatternReduction.append();
                self.selectedPatternReduction.append()
            },
            createMarkerGroups: function(seriesMarkersGroup) {
                var styles = this.styles,
                    reduction = styles.reduction,
                    defaultMarkersOptions = $.extend({'class': 'default-markers'}, styles.point.states.normal),
                    reductionMarkersOptions = $.extend({'class': 'reduction-markers'}, styles.point.states.normal, {
                        fill: reduction.color,
                        stroke: reduction.color
                    }),
                    defaultPositiveMarkersOptions = $.extend({'class': 'default-positive-markers'}, styles.point.states.normal, {fill: reduction.innerColor}),
                    reductionPositiveMarkersOptions = $.extend({'class': 'reduction-positive-markers'}, styles.point.states.normal, {
                        fill: reduction.innerColor,
                        stroke: reduction.color
                    });
                return {
                        defaultMarkersGroup: this.renderer.createGroup(defaultMarkersOptions).append(seriesMarkersGroup),
                        reductionMarkersGroup: this.renderer.createGroup(reductionMarkersOptions).append(seriesMarkersGroup),
                        defaultPositiveMarkersGroup: this.renderer.createGroup(defaultPositiveMarkersOptions).append(seriesMarkersGroup),
                        reductionPositiveMarkersGroup: this.renderer.createGroup(reductionPositiveMarkersOptions).append(seriesMarkersGroup)
                    }
            },
            getValueFields: function() {
                return [this.options.openValueField, this.options.highValueField, this.options.lowValueField, this.options.closeValueField]
            },
            updateTeamplateFieldNames: function() {
                var _this = this;
                _this.options.openValueField = _this.options.openValueField + _this.name;
                _this.options.highValueField = _this.options.highValueField + _this.name;
                _this.options.lowValueField = _this.options.lowValueField + _this.name;
                _this.options.closeValueField = _this.options.closeValueField + _this.name;
                _this.options.tagField = _this.options.tagField + _this.name
            },
            _getPointSize: function() {
                return 10
            }
        };
        series.specialPieMethodsMixin = {
            arrangePoints: function() {
                var series = this,
                    minSegmentSize = series.styles.minSegmentSize,
                    points,
                    pointsLength,
                    correction = 0,
                    translator = this.translator,
                    total = 0,
                    percent,
                    i,
                    totalNotMinValues = 0,
                    totalMinSegmentSize = 0,
                    minShownValue,
                    isClockWise = series.options.segmentsDirection !== 'anticlockwise';
                series.points = $.map(series.points, function(point) {
                    if (point.value === null || point.value < 0 || point.value === 0 && !minSegmentSize)
                        return null;
                    return point
                });
                points = series.points;
                pointsLength = points.length;
                for (i = 0; i < pointsLength; i++)
                    total += points[i].value;
                if (total === 0) {
                    total = pointsLength;
                    $.each(series.points, function(i, point) {
                        point.value = 1
                    })
                }
                if (minSegmentSize) {
                    $.each(points, function(i, point) {
                        if (point.value < minSegmentSize * total / 360)
                            totalMinSegmentSize += minSegmentSize;
                        else
                            totalNotMinValues += point.value
                    });
                    minShownValue = totalMinSegmentSize < 360 ? minSegmentSize * totalNotMinValues / (360 - totalMinSegmentSize) : 0
                }
                $.each(isClockWise ? points : points.concat([]).reverse(), function(i, point) {
                    var val = point.value,
                        updatedZeroValue;
                    if (minSegmentSize && val < minShownValue) {
                        updatedZeroValue = minShownValue;
                        point.value = updatedZeroValue
                    }
                    percent = val / total;
                    point.correctValue(correction, percent);
                    correction = correction + (updatedZeroValue || val)
                })
            },
            correctPosition: function(correction) {
                var debug = DX.utils.debug;
                debug.assert(correction, 'correction was not passed');
                debug.assertParam(correction.centerX, 'correction.centerX was not passed');
                debug.assertParam(correction.centerY, 'correction.centerY was not passed');
                debug.assertParam(correction.radiusInner, 'correction.radiusInner was not passed');
                debug.assertParam(correction.radiusOuter, 'correction.radiusOuter was not passed');
                $.each(this.points, function(_, point) {
                    point.correctPosition(correction)
                })
            },
            getRangeData: function() {
                var range = this.callBase();
                if (!range)
                    return range;
                if (range.minY !== undefined) {
                    range.minY = range.minY > 0 ? 0 : range.minY;
                    range.maxY = range.maxY < 0 ? 0 : range.maxY
                }
                return range
            },
            parseStyleOptions: function(options) {
                if (options.label && options.label.position && options.label.position !== 'outside' && options.label.position !== 'inside' && options.label.position !== 'columns')
                    options.label.position = 'outside';
                if (options.label.position && options.label.position === 'columns')
                    options.label.connector.visible = true;
                this.options.segmentsDirection = options.segmentsDirection || 'clockwise';
                this.styles = this.callBase(options);
                this.adjustOptions();
                return this.styles
            }
        };
        series.specialBubbleMethodsMixin = {
            reinitData: function(data) {
                var self = this,
                    createPoint = series.pointFactory.createPoint,
                    rotated = self.options.rotated,
                    pointStyles = self.styles.point,
                    i,
                    curPoint,
                    point,
                    options = self.options,
                    argumentField = options.argumentField,
                    valueField = options.valueField,
                    sizeField = options.sizeField,
                    tagField = options.tagField;
                if (data && data.length)
                    this._canRenderCompleteHandle = true;
                self.points = [];
                self.pointsByArgument = {};
                self.segments = [];
                for (i = 0; i < data.length; i++) {
                    curPoint = data[i];
                    if (!utils.isDefined(curPoint[valueField]) || !utils.isDefined(curPoint[argumentField]) || !utils.isDefined(curPoint[sizeField]))
                        continue;
                    point = createPoint(self.type, {
                        value: curPoint[valueField],
                        argument: curPoint[argumentField],
                        size: curPoint[sizeField],
                        originalValue: curPoint['original' + valueField],
                        originalArgument: curPoint['original' + argumentField],
                        rotated: rotated,
                        options: pointStyles,
                        tag: curPoint[tagField],
                        series: self
                    });
                    self.points.push(point);
                    self.pointsByArgument[point.argument.valueOf()] = self.pointsByArgument[point.argument.valueOf()] || point
                }
                self.originalPoints = self.points;
                self._segmentPoints()
            },
            getValueFields: function() {
                return [this.options.valueField, this.options.sizeField]
            },
            updateTeamplateFieldNames: function() {
                var _this = this;
                _this.options.valueField = _this.options.valueField + _this.name;
                _this.options.sizeField = _this.options.sizeField + _this.name;
                _this.options.tagField = _this.options.tagField + _this.name
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file commonSeriesResampler.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            utils = DX.utils;
        series.SeriesDataFilterMixin = {
            _fusionPoints: function(fusionPoints, type, tick) {
                var result = this._calcMedianValue(fusionPoints, 'value');
                return series.pointFactory.createPoint(type, {
                        value: result,
                        argument: tick,
                        originalValue: result,
                        originalArgument: tick,
                        rotated: this.options.rotated,
                        options: this.styles.point,
                        tag: null,
                        series: this
                    })
            },
            _calcMedianValue: function(fusionPoints, valueField) {
                var result,
                    allValue;
                allValue = $.map(fusionPoints, function(point) {
                    return point[valueField]
                });
                allValue.sort(function(a, b) {
                    return a - b
                });
                result = allValue[Math.floor(allValue.length / 2)];
                return utils.isDefined(result) ? result : null
            },
            _resample: function(ticks, ticksInterval) {
                var self = this,
                    fusPoints = [],
                    arrayFusPoints,
                    result,
                    nowIndexTicks = 0;
                if (this.options.argumentAxisType === 'discrete' || this.options.valueAxisType === 'discrete') {
                    ticksInterval = this.getOriginalPoints().length / ticks;
                    arrayFusPoints = $.map(this.getOriginalPoints(), function(point, index) {
                        if (Math.floor(nowIndexTicks) === index) {
                            nowIndexTicks += ticksInterval;
                            return point
                        }
                        return null
                    });
                    return arrayFusPoints
                }
                arrayFusPoints = $.map(this.getOriginalPoints(), function(point) {
                    switch (self._isInInterval(point.argument, ticks, nowIndexTicks, ticksInterval)) {
                        case true:
                            fusPoints.push(point);
                            break;
                        case false:
                            return null;
                        case'nextInterval':
                            result = self._fusionPoints(fusPoints, self.type, ticks[nowIndexTicks], nowIndexTicks);
                            while (self._isInInterval(point.argument, ticks, nowIndexTicks, ticksInterval) === 'nextInterval')
                                nowIndexTicks++;
                            fusPoints = [];
                            self._isInInterval(point.argument, ticks, nowIndexTicks, ticksInterval) === true && fusPoints.push(point);
                            if (result)
                                return result
                    }
                });
                fusPoints.length && arrayFusPoints.push(self._fusionPoints(fusPoints, self.type, ticks[nowIndexTicks]));
                delete self.prevLevelValue;
                return arrayFusPoints
            },
            _isInInterval: function(argument, ticks, nowIndexTicks, ticksInterval) {
                var minTick = ticks[nowIndexTicks],
                    maxTick = ticks[nowIndexTicks + 1],
                    sumMinTickTicksInterval;
                ticksInterval = $.isNumeric(ticksInterval) ? ticksInterval : utils.convertDateTickIntervalToMilliseconds(ticksInterval);
                sumMinTickTicksInterval = utils.isDate(minTick) ? new Date(minTick.getTime() + ticksInterval) : minTick + ticksInterval;
                if (argument >= minTick && argument < sumMinTickTicksInterval)
                    return true;
                if (argument < minTick || maxTick === undefined)
                    return false;
                return 'nextInterval'
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file financeSeriesResampler.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            utils = DX.utils,
            seriesDataFilterMixin = series.SeriesDataFilterMixin;
        series.FinancialSeriesDataResamplerMixin = {
            _fusionPoints: function(fusionPoints, type, tick, nowIndexTicks) {
                var fusedPoint = utils.clone(fusionPoints[0]),
                    styles,
                    reductionLevel,
                    highValue = -Infinity,
                    lowValue = +Infinity,
                    openValue,
                    closeValue;
                if (!fusionPoints.length)
                    return;
                $.each(fusionPoints, function(_, point) {
                    if (!point.hasValue())
                        return;
                    highValue = Math.max(highValue, point.highValue);
                    lowValue = Math.min(lowValue, point.lowValue);
                    openValue = openValue !== undefined ? openValue : point.openValue;
                    closeValue = point.closeValue !== undefined ? point.closeValue : closeValue
                });
                fusedPoint.argument = tick;
                fusedPoint.openValue = openValue;
                fusedPoint.closeValue = closeValue;
                fusedPoint.highValue = highValue;
                fusedPoint.lowValue = lowValue;
                switch ((this.level || '').toLowerCase()) {
                    case'open':
                        reductionLevel = openValue;
                        break;
                    case'high':
                        reductionLevel = highValue;
                        break;
                    case'low':
                        reductionLevel = lowValue;
                        break;
                    default:
                        reductionLevel = closeValue;
                        break
                }
                styles = this._getPointStyles(nowIndexTicks, reductionLevel, {
                    open: openValue,
                    close: closeValue,
                    high: highValue,
                    low: lowValue
                });
                fusedPoint.pointClassName = styles.className;
                fusedPoint.options = styles.pointStylesReduct;
                fusedPoint.reductionValue = reductionLevel;
                return series.pointFactory.createPoint(type, fusedPoint)
            },
            _resample: seriesDataFilterMixin._resample,
            _isInInterval: seriesDataFilterMixin._isInInterval
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file rangeSeriesResampler.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            utils = DX.utils,
            seriesDataFilterMixin = series.SeriesDataFilterMixin;
        series.RangeSeriesDataFilterMixin = {
            _fusionPoints: function(fusionPoints, type, tick) {
                var value = series.SeriesDataFilterMixin._calcMedianValue(fusionPoints, 'value'),
                    minValue = series.SeriesDataFilterMixin._calcMedianValue(fusionPoints, 'minValue');
                if (value === null || minValue === null)
                    value = minValue = null;
                return series.pointFactory.createPoint(type, {
                        minValue: minValue,
                        value: value,
                        argument: tick,
                        originalMinValue: minValue,
                        originalValue: value,
                        originalArgument: tick,
                        rotated: this.options.rotated,
                        options: this.styles.point,
                        tag: null,
                        series: this
                    })
            },
            _resample: seriesDataFilterMixin._resample,
            _isInInterval: seriesDataFilterMixin._isInInterval
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file bubbleSeriesResampler.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            seriesDataFilterMixin = series.SeriesDataFilterMixin,
            VALUE = 'value',
            SIZE = 'size';
        series.BubbleSeriesDataResamplerMixin = {
            _fusionPoints: function(fusionPoints, type, tick) {
                var medianValue = this._calcMedianValue(fusionPoints, VALUE),
                    medianSize = this._calcMedianValue(fusionPoints, SIZE);
                return series.pointFactory.createPoint(type, {
                        size: medianSize,
                        value: medianValue,
                        argument: tick,
                        originalValue: medianValue,
                        originalArgument: tick,
                        rotated: this.options.rotated,
                        options: this.styles.point,
                        tag: null,
                        series: this
                    })
            },
            _resample: seriesDataFilterMixin._resample,
            _isInInterval: seriesDataFilterMixin._isInInterval,
            _calcMedianValue: seriesDataFilterMixin._calcMedianValue
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file basePoint.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            eventsConsts = series.consts.events,
            statesConsts = series.consts.states,
            utils = DX.utils,
            formatHelper = DX.formatHelper,
            CANVAS_POSITION_DEFAULT = 'canvas_position_default';
        series.BasePoint = DX.Class.inherit({
            ctor: function(data) {
                var debug = DX.utils.debug;
                debug.assertParam(data, 'data was not passed');
                debug.assertParam(data.options, 'options were not passed');
                this.LABEL_BACKGROUND_PADDING_X = 8;
                this.LABEL_BACKGROUND_PADDING_Y = 4;
                this.LABEL_OFFSET = 10;
                this.rotated = !!data.rotated;
                if (data.options.label && data.options.label.position && data.options.label.position !== 'outside' && data.options.label.position !== 'inside')
                    data.options.label.position = 'outside';
                this.options = data.options;
                this.series = data.series;
                this.value = this.initialValue = data.value;
                this.argument = this.initialArgument = data.argument;
                this.originalValue = data.originalValue;
                this.originalArgument = data.originalArgument;
                this.minValue = CANVAS_POSITION_DEFAULT;
                this.labelFormatObject = {
                    argument: this.initialArgument,
                    value: this.initialValue,
                    seriesName: this.series.name,
                    originalValue: this.originalValue,
                    originalArgument: this.originalArgument
                };
                this.tag = data.tag;
                this.pointClassName = data.pointClassName || ''
            },
            dispose: function() {
                var _this = this;
                _this.off();
                _this.trackerGraphic && _this.trackerGraphic.removeData();
                _this.graphic = null;
                _this.trackerGraphic = null;
                _this.hoverPattern = null;
                _this.selectedPattern = null;
                _this.label = null;
                _this.labelBackground = null;
                _this.connector = null;
                _this.insideLabelGroup = null;
                _this.labelGroup = null;
                _this.points = null;
                _this.translator = null;
                _this.options = null;
                _this.series = null;
                _this.tag = null;
                _this.labelFormatObject = null;
                _this.stackPoints = null
            },
            formatLabel: function(options) {
                this.valueText = formatHelper.format(this.value, options.format, options.precision);
                this.argumentText = formatHelper.format(this.argument, options.argumentFormat, options.argumentPrecision);
                if (this.percent !== undefined)
                    this.percentText = formatHelper.format(this.percent, 'percent', options.percentPrecision);
                if (this.total !== undefined)
                    this.totalText = formatHelper.format(this.total, options.format, options.precision);
                return options.customizeText ? options.customizeText.call(this, this) : this.valueText
            },
            setOptions: function(options) {
                this.options = options
            },
            translate: function(translator) {
                this.translator = translator = translator || this.translator;
                if (!this.translator || !this.hasValue())
                    return;
                if (!this.rotated) {
                    this.y = translator.translateY(this.value);
                    this.minY = translator.translateY(this.minValue);
                    this.x = translator.translateX(this.argument);
                    this.defaultY = translator.translateY(CANVAS_POSITION_DEFAULT)
                }
                else {
                    this.y = translator.translateY(this.argument);
                    this.x = translator.translateX(this.value);
                    this.minX = translator.translateX(this.minValue);
                    this.defaultX = translator.translateX(CANVAS_POSITION_DEFAULT)
                }
                this._calculateVisibility(this.x, this.y, 0, 0);
                this.prepareStatesOptions()
            },
            _calculateVisibility: function(x, y, width, height) {
                var visibleArea;
                if (this.translator && this.translator.getCanvasVisibleArea) {
                    visibleArea = this.translator.getCanvasVisibleArea() || {};
                    if (visibleArea.minX > x + (width || 0) || visibleArea.maxX < x || visibleArea.minY > y + (height || 0) || visibleArea.maxY < y)
                        this.visible = false;
                    else
                        this.visible = true
                }
            },
            correctValue: function(correction) {
                this.value += correction;
                if (!utils.isNumber(this.minValue))
                    this.minValue = correction;
                else
                    this.minValue += correction;
                this.translate()
            },
            setPercentValue: function(total, fullStacked) {
                var valuePercent = this.value / total || 0,
                    minValuePercent;
                if (utils.isNumber(this.minValue)) {
                    minValuePercent = this.minValue / total || 0;
                    this.labelFormatObject.percent = valuePercent - minValuePercent
                }
                else
                    this.labelFormatObject.percent = valuePercent;
                this.labelFormatObject.total = total;
                if (fullStacked) {
                    this.value = valuePercent;
                    this.minValue = !minValuePercent ? this.minValue : minValuePercent;
                    this.translate()
                }
            },
            getCoords: function(min) {
                if (!min)
                    return {
                            x: this.x,
                            y: this.y
                        };
                if (!this.rotated)
                    return {
                            x: this.x,
                            y: this.minY
                        };
                return {
                        x: this.minX,
                        y: this.y
                    }
            },
            getDefaultCoords: function() {
                return !this.rotated ? {
                        x: this.x,
                        y: this.defaultY
                    } : {
                        x: this.defaultX,
                        y: this.y
                    }
            },
            getTooltipCoords: function() {
                if (this.graphic)
                    return {
                            x: this.x,
                            y: this.y,
                            offset: this.graphic.getBBox().height / 2
                        };
                else
                    return {
                            x: this.x,
                            y: this.y,
                            offset: 0
                        }
            },
            isInVisibleArea: function() {
                return this.visible
            },
            drawMarker: function(renderer, group, animationEnabled) {
                if (!this.hasValue())
                    return;
                var radius = this.options.attributes.r,
                    states = this.options.states.normal,
                    imageMarker = this.options.image,
                    marker,
                    bbox,
                    markerUrl,
                    markerWidth,
                    markerHeight,
                    markerOffsetX,
                    markerOffsetY,
                    DEFAULT_MARKER_WIDTH = 20,
                    DEFAULT_MARKER_HEIGHT = 20,
                    translateX,
                    translateY,
                    pointAttributes;
                if (animationEnabled)
                    if (this.rotated)
                        translateX = this.defaultX - this.x;
                    else
                        translateY = this.defaultY - this.y;
                pointAttributes = $.extend({
                    translateX: translateX,
                    translateY: translateY
                }, this.options.attributes);
                if (imageMarker) {
                    markerUrl = imageMarker.url ? imageMarker.url.toString() : imageMarker.toString();
                    markerWidth = imageMarker.width || DEFAULT_MARKER_WIDTH;
                    markerHeight = imageMarker.height || DEFAULT_MARKER_HEIGHT;
                    markerOffsetX = Math.round(markerWidth * 0.5);
                    markerOffsetY = Math.round(markerHeight * 0.5);
                    marker = renderer.createImage(this.x - markerOffsetX, this.y - markerOffsetY, markerWidth, markerHeight, markerUrl, {location: 'center'})
                }
                else
                    switch (this.options.symbol) {
                        case'circle':
                            marker = renderer.createCircle(this.x, this.y, radius, pointAttributes);
                            break;
                        case'square':
                        case'polygon':
                        case'triangle':
                        case'cross':
                            marker = renderer.createArea(this.points, pointAttributes);
                            break
                    }
                marker && marker.move(translateX || 0, translateY || 0).append(group);
                this.graphic = marker;
                this._checkState()
            },
            _checkState: function() {
                if (this.isSelected())
                    this.series.setPointSelectedState(this);
                else if (this.isHovered())
                    this.series.setPointHoverState(this);
                else
                    this.fullState = statesConsts.normalMark
            },
            _trackerAttrs: {
                stroke: 'none',
                fill: 'grey',
                opacity: 0.0001,
                inh: true
            },
            storeTrackerR: function() {
                var navigator = window.navigator,
                    touchSupport = 'ontouchstart' in window || navigator.msPointerEnabled && navigator.msMaxTouchPoints || navigator.pointerEnabled && navigator.maxTouchPoints,
                    minTrackerSize = touchSupport ? 20 : 6;
                this.options.trackerR = this.options.attributes.r < minTrackerSize ? minTrackerSize : this.options.attributes.r;
                return this.options.trackerR
            },
            drawTrackerMarker: function(renderer, trackerGroup) {
                if (!this.hasValue())
                    return;
                this.trackerGraphic = renderer.createCircle(this.x, this.y, this.options.trackerR || this.storeTrackerR(), this._trackerAttrs).append(trackerGroup);
                this.trackerGraphic.data({point: this})
            },
            select: function() {
                this.series.selectPoint(this)
            },
            clearSelection: function() {
                this.series.deselectPoint(this)
            },
            _populatePointShape: function(target, radius) {
                var self = this,
                    floorHalfRadius,
                    ceilHalfRadius;
                if (self.options.symbol === 'square')
                    target.points = [{
                            x: self.x - radius,
                            y: self.y - radius
                        }, {
                            x: self.x + radius,
                            y: self.y - radius
                        }, {
                            x: self.x + radius,
                            y: self.y + radius
                        }, {
                            x: self.x - radius,
                            y: self.y + radius
                        }, {
                            x: self.x - radius,
                            y: self.y - radius
                        }];
                if (self.options.symbol === 'polygon')
                    target.points = [{
                            x: self.x - radius,
                            y: self.y
                        }, {
                            x: self.x,
                            y: self.y - radius
                        }, {
                            x: self.x + radius,
                            y: self.y
                        }, {
                            x: self.x,
                            y: self.y + radius
                        }, {
                            x: self.x - radius,
                            y: self.y
                        }];
                if (self.options.symbol === 'triangle')
                    target.points = [{
                            x: self.x - radius,
                            y: self.y - radius
                        }, {
                            x: self.x + radius,
                            y: self.y - radius
                        }, {
                            x: self.x,
                            y: self.y + radius
                        }, {
                            x: self.x - radius,
                            y: self.y - radius
                        }];
                if (self.options.symbol === 'cross') {
                    floorHalfRadius = Math.floor(radius / 2);
                    ceilHalfRadius = Math.ceil(radius / 2);
                    target.points = [{
                            x: self.x - radius,
                            y: self.y - floorHalfRadius
                        }, {
                            x: self.x - floorHalfRadius,
                            y: self.y - radius
                        }, {
                            x: self.x,
                            y: self.y - ceilHalfRadius
                        }, {
                            x: self.x + floorHalfRadius,
                            y: self.y - radius
                        }, {
                            x: self.x + radius,
                            y: self.y - floorHalfRadius
                        }, {
                            x: self.x + ceilHalfRadius,
                            y: self.y
                        }, {
                            x: self.x + radius,
                            y: self.y + floorHalfRadius
                        }, {
                            x: self.x + floorHalfRadius,
                            y: self.y + radius
                        }, {
                            x: self.x,
                            y: self.y + ceilHalfRadius
                        }, {
                            x: self.x - floorHalfRadius,
                            y: self.y + radius
                        }, {
                            x: self.x - radius,
                            y: self.y + floorHalfRadius
                        }, {
                            x: self.x - ceilHalfRadius,
                            y: self.y
                        }]
                }
            },
            prepareStatesOptions: function() {
                var self = this;
                if (self.options.states && self.options.states.normal)
                    self._populatePointShape(self, self.options.states.normal.r)
            },
            applyNormalStyle: function() {
                if (this.graphic) {
                    this._populatePointShape(this.options.states.normal, this.options.states.normal.r);
                    this.graphic.applySettings(this.options.states.normal)
                }
                return this
            },
            applyHoverStyle: function() {
                if (this.graphic && !this.options.image) {
                    this._populatePointShape(this.options.states.hover, this.options.states.hover.r);
                    this.graphic.applySettings(this.options.states.hover);
                    this.graphic.toForeground();
                    this.graphic.addClass('dx-chart-hovered-point')
                }
                return this
            },
            applySelectionStyle: function() {
                if (this.graphic && !this.options.image) {
                    this._populatePointShape(this.options.states.selected, this.options.states.selected.r);
                    this.graphic.applySettings(this.options.states.selected);
                    this.graphic.toForeground();
                    this.graphic.addClass('dx-chart-selected-point')
                }
                return this
            },
            setHoverState: function() {
                this.series.setPointHoverState(this)
            },
            releaseHoverState: function() {
                this.series.releasePointHoverState(this);
                if (this.graphic) {
                    this.graphic.removeClass('dx-chart-hovered-point');
                    !this.isSelected() && this.graphic.toBackground()
                }
            },
            setSelectedState: function() {
                this.series.setPointSelectedState(this)
            },
            releaseSelectedState: function() {
                this.series.releasePointSelectedState(this);
                if (this.graphic)
                    this.graphic.removeClass('dx-chart-selected-point')
            },
            showTooltip: function() {
                this.series.showPointTooltip(this)
            },
            hideTooltip: function() {
                this.series.hidePointTooltip(this)
            },
            on: function(events, data, handler) {
                $(this).on(events, data, handler);
                return this
            },
            off: function(events) {
                $(this).off(events);
                return this
            },
            isSelected: function() {
                return !!(this.fullState & statesConsts.selectedMark)
            },
            isHovered: function() {
                return !!(this.fullState & statesConsts.hoverMark)
            },
            correctLabel: function() {
                this.correctBackgroundPosition();
                this.rotateLabel();
                this.correctLabelPosition()
            },
            drawLabel: function(renderer, group) {
                if (!this.hasValue())
                    return;
                if (!utils.isDefined(this.labelFormatObject.value))
                    return;
                var labelOptions = this.options.label,
                    labelText = this.formatLabel.call(this.labelFormatObject, labelOptions);
                if (!utils.isDefined(labelText))
                    return;
                this.labelGroup = renderer.createGroup().append(group);
                if (this.options.label.connector && this.options.label.connector.strokeWidth)
                    this.connector = renderer.createPath([], labelOptions.connector).append(this.labelGroup);
                this.insideLabelGroup = renderer.createGroup().append(this.labelGroup);
                labelOptions.background['class'] = this.pointClassName;
                if (labelOptions.background.fill && labelOptions.background.fill !== 'none' || labelOptions.background.strokeWidth && labelOptions.background.stroke && labelOptions.background.stroke !== 'none')
                    this.labelBackground = renderer.createRect(this.x, this.y, 0, 0, 0, labelOptions.background).append(this.insideLabelGroup);
                this.label = renderer.createText(labelText, this.x, this.y, labelOptions.attributes).append(this.insideLabelGroup);
                this.correctLabel();
                this.correctConnectorPosition()
            },
            rotateLabel: function() {
                var bbox = this.insideLabelGroup.getBBox(),
                    labelOptions = this.options.label;
                this.insideLabelGroup.applySettings({
                    x: bbox.x + bbox.width / 2,
                    y: bbox.y + bbox.height / 2,
                    rotate: labelOptions.rotationAngle
                })
            },
            getGraphicSettings: function() {
                return {
                        x: this.graphic.settings.x || 0,
                        y: this.graphic.settings.y || 0,
                        height: this.graphic.settings.height || 0,
                        width: this.graphic.settings.width || 0
                    }
            },
            correctLabelPosition: function() {
                var bbox = this.insideLabelGroup.getBBox(),
                    bboxgraphic = this.graphic ? this.graphic.getBBox() : {
                        x: this.x,
                        y: this.y,
                        height: 0,
                        width: 0
                    },
                    x = 0,
                    y = 0;
                if (bboxgraphic.isEmpty)
                    bboxgraphic = {
                        x: this.x,
                        y: this.y,
                        height: 0,
                        width: 0
                    };
                if (!this.rotated)
                    if (this.initialValue > 0 || this.series.isFullStackedSeries())
                        y += bboxgraphic.y - bbox.y - bbox.height - this.LABEL_OFFSET;
                    else
                        y += bboxgraphic.y + bboxgraphic.height - bbox.y + this.LABEL_OFFSET;
                else {
                    y += bboxgraphic.y - bbox.y - bbox.height / 2 + bboxgraphic.height / 2;
                    if (this.initialValue > 0 || this.series.isFullStackedSeries())
                        x += bboxgraphic.x + bboxgraphic.width - bbox.x + this.LABEL_OFFSET;
                    else
                        x += bboxgraphic.x - bbox.x - bbox.width - this.LABEL_OFFSET
                }
                x += this.options.label.horizontalOffset;
                y += this.options.label.verticalOffset;
                this.checkLabelPosition({
                    x: bbox.x + x,
                    y: bbox.y + y,
                    height: bbox.height,
                    width: bbox.width
                }, x, y)
            },
            checkLabelPosition: function(bbox, x, y) {
                var bboxgraphic = this.graphic ? this.graphic.getBBox() : {
                        x: this.x,
                        y: this.y,
                        height: 0,
                        width: 0
                    },
                    visibleArea = this.translator.getCanvasVisibleArea();
                if (bboxgraphic.isEmpty)
                    bboxgraphic = {
                        x: this.x,
                        y: this.y,
                        height: 0,
                        width: 0
                    };
                if (!this.rotated)
                    if (visibleArea.minX <= bboxgraphic.x + bboxgraphic.width && visibleArea.maxX >= bboxgraphic.x) {
                        if (visibleArea.minX > bbox.x && this.adjustSeriesLabels)
                            x += visibleArea.minX - bbox.x;
                        if (visibleArea.maxX < bbox.x + bbox.width && this.adjustSeriesLabels)
                            x -= bbox.x + bbox.width - visibleArea.maxX;
                        if (visibleArea.minY > bbox.y)
                            y += bboxgraphic.y + bboxgraphic.height - bbox.y + this.LABEL_OFFSET;
                        if (visibleArea.maxY < bbox.y + bbox.height)
                            y -= bbox.y + bbox.height - bboxgraphic.y + this.LABEL_OFFSET
                    }
                if (this.rotated)
                    if (visibleArea.minY <= bboxgraphic.y + bboxgraphic.height && visibleArea.maxY >= bboxgraphic.y) {
                        if (visibleArea.minX > bbox.x)
                            x += bboxgraphic.x + bboxgraphic.width - bbox.x + this.LABEL_OFFSET;
                        if (visibleArea.maxX < bbox.x + bbox.width)
                            x -= bbox.x + bbox.width - bboxgraphic.x + this.LABEL_OFFSET;
                        if (visibleArea.minY > bbox.y && this.adjustSeriesLabels)
                            y += visibleArea.minY - bbox.y;
                        if (visibleArea.maxY < bbox.y + bbox.height && this.adjustSeriesLabels)
                            y -= bbox.y + bbox.height - visibleArea.maxY
                    }
                this.insideLabelGroup.move(~~x, ~~y)
            },
            correctBackgroundPosition: function() {
                if (!this.labelBackground)
                    return;
                var bbox = this.label.getBBox(),
                    x = bbox.x - this.LABEL_BACKGROUND_PADDING_X,
                    y = bbox.y - this.LABEL_BACKGROUND_PADDING_Y,
                    width = bbox.width + 2 * this.LABEL_BACKGROUND_PADDING_X,
                    height = bbox.height + 2 * this.LABEL_BACKGROUND_PADDING_Y;
                this.labelBackground.applySettings({
                    x: x,
                    y: y,
                    width: width,
                    height: height
                })
            },
            correctConnectorPosition: function(bboxgraphic) {
                var bbox = this.insideLabelGroup.getBBox(),
                    bboxgraphic = bboxgraphic || (this.graphic ? this.graphic.getBBox() : {
                        x: this.x,
                        y: this.y,
                        height: 0,
                        width: 0
                    }),
                    x1,
                    x2,
                    y1,
                    y2,
                    centerLabelY,
                    centerLabelX;
                if (!this.connector)
                    return;
                if (bboxgraphic.isEmpty)
                    bboxgraphic = {
                        x: this.x,
                        y: this.y,
                        height: 0,
                        width: 0
                    };
                bbox.x = bbox.x + (this.insideLabelGroup.settings.translateX || 0);
                bbox.y = bbox.y + (this.insideLabelGroup.settings.translateY || 0);
                centerLabelY = this.labelBackground ? bbox.y + bbox.height / 2 : null;
                centerLabelX = this.labelBackground ? bbox.x + bbox.width / 2 : null;
                if (!this.rotated) {
                    if ((centerLabelY || bbox.y + bbox.height) < bboxgraphic.y) {
                        y1 = centerLabelY || bbox.y + bbox.height;
                        y2 = bboxgraphic.y
                    }
                    else if ((centerLabelY || bbox.y) > bboxgraphic.y + bboxgraphic.height) {
                        y1 = centerLabelY || bbox.y;
                        y2 = bboxgraphic.y + bboxgraphic.height
                    }
                    else
                        return;
                    x1 = Math.round(bbox.x + bbox.width / 2);
                    if (x1 > bboxgraphic.x + bboxgraphic.width)
                        x2 = bboxgraphic.x + bboxgraphic.width;
                    else if (x1 < bboxgraphic.x)
                        x2 = bboxgraphic.x;
                    else
                        x2 = x1
                }
                else {
                    if ((centerLabelX || bbox.x) > bboxgraphic.x + bboxgraphic.width) {
                        x1 = centerLabelX || bbox.x;
                        x2 = bboxgraphic.x + bboxgraphic.width
                    }
                    else if ((centerLabelX || bbox.x + bbox.width) < bboxgraphic.x) {
                        x1 = centerLabelX || bbox.x + bbox.width;
                        x2 = bboxgraphic.x
                    }
                    else
                        return;
                    y1 = Math.round(bbox.y + bbox.height / 2);
                    if (y1 > bboxgraphic.y + bboxgraphic.height)
                        y2 = bboxgraphic.y + bboxgraphic.height;
                    else if (y1 < bboxgraphic.y)
                        y2 = bboxgraphic.y;
                    else
                        y2 = y1
                }
                this.connector.applySettings({points: [x1, y1, x2, y2]})
            },
            getColor: function() {
                return this.options.attributes.fill
            },
            getTooltipFormatObject: function(tooltip) {
                var tooltipFormatObject = this._getFormatObject(tooltip);
                if (this.stackPoints) {
                    if (!tooltip.options.customizeText)
                        tooltip.options.customizeText = function() {
                            return $.map(this.points, function(point, i) {
                                    return point.seriesName + ': ' + point.valueText
                                }).join('\n')
                        };
                    var tooltipStackPointsFormatObject = [];
                    $.each(this.stackPoints, function(i, point) {
                        tooltipStackPointsFormatObject.push(point._getFormatObject(tooltip))
                    });
                    var sharedTooltipFormatObject = {
                            total: tooltipFormatObject.total,
                            argument: tooltipFormatObject.argument,
                            points: tooltipStackPointsFormatObject
                        };
                    this.stackPoints.stackName && (sharedTooltipFormatObject.stackName = this.stackPoints.stackName);
                    return sharedTooltipFormatObject
                }
                else
                    return tooltipFormatObject
            },
            _getFormatObject: function(tooltip) {
                var value = tooltip.formatValueTooltip.call({value: this.initialValue}, tooltip.options);
                return $.extend({}, this.labelFormatObject, {
                        point: this,
                        valueText: value
                    })
            },
            animate: function(complete) {
                var self = this,
                    graphic = self.graphic;
                if (!graphic) {
                    complete && complete();
                    return
                }
                graphic.animate({translate: {
                        x: 0,
                        y: 0
                    }}, undefined, complete)
            },
            hasValue: function() {
                return this.initialValue !== null
            },
            getClassName: function() {
                return this.pointClassName
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file barPoint.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            statesConsts = series.consts.states,
            isDefined = DX.utils.isDefined,
            CANVAS_POSITION_DEFAULT = 'canvas_position_default';
        var truncateCoord = function(coord, minBounce, maxBounce) {
                if (coord < minBounce)
                    return minBounce;
                if (coord > maxBounce)
                    return maxBounce;
                return coord
            };
        series.BarPoint = series.BasePoint.inherit({
            translate: function(translator) {
                var canvasVisibleArea,
                    minX,
                    minY,
                    y,
                    x;
                this.translator = translator = translator || this.translator;
                if (!this.translator || !this.hasValue())
                    return;
                canvasVisibleArea = translator.getCanvasVisibleArea() || {};
                if (!this.rotated) {
                    x = minX = translator.translateX(this.argument) + (this.xCorrection || 0);
                    y = translator.translateY(this.value);
                    minY = translator.translateY(this.minValue);
                    this.height = Math.abs(y - minY);
                    this._calculateVisibility(Math.min(x, minX), Math.min(y, minY), this.width, this.height);
                    y = truncateCoord(y, canvasVisibleArea.minY, canvasVisibleArea.maxY);
                    minY = truncateCoord(minY, canvasVisibleArea.minY, canvasVisibleArea.maxY);
                    this.x = x;
                    this.minX = minX;
                    this.height = Math.abs(y - minY);
                    this.y = Math.min(y, minY) + (this.yCorrection || 0);
                    this.minY = minY + (this.yCorrection || 0);
                    this.defaultY = translator.translateY(CANVAS_POSITION_DEFAULT);
                    if (this.visible) {
                        if (this.x < canvasVisibleArea.minX) {
                            this.width = this.width - (canvasVisibleArea.minX - this.x);
                            this.x = canvasVisibleArea.minX;
                            this.minX = canvasVisibleArea.minX
                        }
                        if (this.x + this.width > canvasVisibleArea.maxX)
                            this.width = canvasVisibleArea.maxX - this.x
                    }
                }
                else {
                    y = minY = translator.translateY(this.argument) + (this.yCorrection || 0);
                    x = translator.translateX(this.value);
                    minX = translator.translateX(this.minValue);
                    this.width = Math.abs(x - minX);
                    this._calculateVisibility(Math.min(x, minX), Math.min(y, minY), this.width, this.height);
                    x = truncateCoord(x, canvasVisibleArea.minX, canvasVisibleArea.maxX);
                    minX = truncateCoord(minX, canvasVisibleArea.minX, canvasVisibleArea.maxX);
                    this.y = y;
                    this.minY = minY;
                    this.width = Math.abs(x - minX);
                    this.x = Math.min(x, minX) + (this.xCorrection || 0);
                    this.minX = minX + (this.xCorrection || 0);
                    this.defaultX = translator.translateX(CANVAS_POSITION_DEFAULT);
                    if (this.visible) {
                        if (this.y < canvasVisibleArea.minY) {
                            this.height = this.height - (canvasVisibleArea.minY - this.y);
                            this.y = canvasVisibleArea.minY;
                            this.minY = canvasVisibleArea.minY
                        }
                        if (this.y + this.height > canvasVisibleArea.maxY)
                            this.height = canvasVisibleArea.maxY - this.y
                    }
                }
            },
            getTooltipCoords: function() {
                var self = this,
                    x = self.x + self.width / 2,
                    y = self.y + self.height / 2;
                return {
                        x: x,
                        y: y,
                        offset: 0
                    }
            },
            correctCoordinates: function(correctOptions) {
                var correction = correctOptions.offset - Math.round(correctOptions.width / 2);
                if (!this.rotated) {
                    this.width = correctOptions.width;
                    this.xCorrection = correction
                }
                else {
                    this.height = correctOptions.width;
                    this.yCorrection = correction
                }
            },
            drawMarker: function(renderer, group) {
                if (!this.hasValue())
                    return;
                var attributes = this._checkState();
                this.graphic = renderer.createRect(this.x, this.y, this.width, this.height, attributes.r, attributes).append(group)
            },
            _checkState: function() {
                var attributes;
                if (this.isSelected())
                    attributes = this.options.states.selected;
                else if (this.isHovered())
                    attributes = this.options.states.hover;
                else {
                    attributes = this.options.attributes;
                    this.fullState = statesConsts.normalMark
                }
                return attributes
            },
            drawTrackerMarker: function(renderer, trackerGroup) {
                if (!this.hasValue())
                    return;
                var _this = this,
                    y = _this.y,
                    height = _this.height,
                    x = _this.x,
                    width = _this.width;
                if (_this.rotated) {
                    if (width === 1) {
                        width = 9;
                        x -= 4
                    }
                }
                else if (height === 1) {
                    height = 9;
                    y -= 4
                }
                this.trackerGraphic = renderer.createRect(x, y, width, height, _this.options.attributes.r, _this._trackerAttrs).append(trackerGroup);
                this.trackerGraphic.data({point: _this})
            },
            correctConnectorPosition: function() {
                this.callBase(this.getBboxGraphic())
            },
            drawLabel: function(renderer, group) {
                if (!this.hasValue() || !this.options.label.showForZeroValues && !this.labelFormatObject.value)
                    return;
                else
                    this.callBase(renderer, group)
            },
            getBboxGraphic: function() {
                var bboxgraphic = this.graphic && this.graphic.getBBox(),
                    deltaX,
                    deltaY;
                if (bboxgraphic.isEmpty)
                    bboxgraphic = this.getGraphicSettings();
                deltaX = bboxgraphic.x - this.x;
                deltaY = bboxgraphic.y - this.y;
                bboxgraphic.x -= deltaX;
                bboxgraphic.y -= deltaY;
                bboxgraphic.width += 2 * deltaX;
                bboxgraphic.height += 2 * deltaY;
                return bboxgraphic
            },
            correctLabelPosition: function() {
                var bbox = this.insideLabelGroup.getBBox(),
                    bboxgraphic = this.getBboxGraphic(),
                    businessRange = this.translator.getBusinessRange(),
                    isDiscreteValue = this.series.options.valueAxisType === 'discrete',
                    isTop = !isDiscreteValue && (this.initialValue >= 0 && !businessRange.invertY || this.initialValue < 0 && businessRange.invertY) || isDiscreteValue && !businessRange.invertY || this.series.isFullStackedSeries(),
                    isLeft = !isDiscreteValue && (this.initialValue >= 0 && !businessRange.invertX || this.initialValue < 0 && businessRange.invertX) || isDiscreteValue && !businessRange.invertX || this.series.isFullStackedSeries(),
                    x = 0,
                    y = 0;
                if (this.initialValue === 0 && this.series.isFullStackedSeries())
                    if (!this.rotated) {
                        x += bboxgraphic.width / 2;
                        y += this.defaultY - bbox.y - bbox.height - this.LABEL_OFFSET
                    }
                    else {
                        y += bboxgraphic.y - bbox.y - bbox.height / 2 + bboxgraphic.height / 2;
                        x += this.defaultX - bbox.x + this.LABEL_OFFSET
                    }
                else if (this.options.label.position === 'outside')
                    if (!this.rotated) {
                        x += bboxgraphic.width / 2;
                        if (isTop)
                            y += bboxgraphic.y - bbox.y - bbox.height - this.LABEL_OFFSET;
                        else
                            y += bboxgraphic.y + bboxgraphic.height - bbox.y + this.LABEL_OFFSET
                    }
                    else {
                        y += bboxgraphic.y - bbox.y - bbox.height / 2 + bboxgraphic.height / 2;
                        if (isLeft)
                            x += bboxgraphic.x + bboxgraphic.width - bbox.x + this.LABEL_OFFSET;
                        else
                            x += bboxgraphic.x - bbox.x - bbox.width - this.LABEL_OFFSET
                    }
                else if (this.options.label.position === 'inside')
                    if (!this.rotated) {
                        x += bboxgraphic.width / 2;
                        if (isTop)
                            y += bboxgraphic.y - bbox.y - bbox.height + this.LABEL_OFFSET + bbox.height;
                        else
                            y += bboxgraphic.y + bboxgraphic.height - bbox.y - this.LABEL_OFFSET - bbox.height
                    }
                    else {
                        y += bboxgraphic.y - bbox.y - bbox.height / 2 + bboxgraphic.height / 2;
                        if (isLeft)
                            x += bboxgraphic.x + bboxgraphic.width - bbox.x - bbox.width - this.LABEL_OFFSET;
                        else
                            x += bboxgraphic.x - bbox.x + this.LABEL_OFFSET
                    }
                x += this.options.label.horizontalOffset;
                y += this.options.label.verticalOffset;
                this.checkLabelPosition({
                    x: bbox.x + x,
                    y: bbox.y + y,
                    height: bbox.height,
                    width: bbox.width
                }, x, y, bboxgraphic)
            },
            checkLabelPosition: function(bbox, x, y, bboxgraphic) {
                var bboxgraphic = bboxgraphic || this.graphic.getBBox(),
                    visibleArea = this.translator.getCanvasVisibleArea();
                if (bboxgraphic.isEmpty)
                    bboxgraphic = this.getGraphicSettings();
                if (visibleArea.minX <= bboxgraphic.x + bboxgraphic.width && visibleArea.maxX >= bboxgraphic.x && visibleArea.minY <= bboxgraphic.y + bboxgraphic.height && visibleArea.maxY >= bboxgraphic.y) {
                    if (!this.rotated) {
                        if (visibleArea.minX > bbox.x && this.adjustSeriesLabels)
                            x += visibleArea.minX - bbox.x;
                        if (visibleArea.maxX < bbox.x + bbox.width && this.adjustSeriesLabels)
                            x -= bbox.x + bbox.width - visibleArea.maxX;
                        if (visibleArea.minY > bbox.y)
                            y += visibleArea.minY - bbox.y;
                        if (visibleArea.maxY < bbox.y + bbox.height)
                            y -= bbox.y + bbox.height - visibleArea.maxY
                    }
                    if (this.rotated) {
                        if (visibleArea.minX > bbox.x)
                            x += visibleArea.minX - bbox.x;
                        if (visibleArea.maxX < bbox.x + bbox.width)
                            x -= bbox.x + bbox.width - visibleArea.maxX;
                        if (visibleArea.minY > bbox.y && this.adjustSeriesLabels)
                            y += visibleArea.minY - bbox.y;
                        if (visibleArea.maxY < bbox.y + bbox.height && this.adjustSeriesLabels)
                            y -= bbox.y + bbox.height - visibleArea.maxY
                    }
                }
                this.insideLabelGroup.move(~~x, ~~y)
            },
            animate: function() {
                var _this = this,
                    graphic = _this.graphic;
                if (!graphic || !_this.translator)
                    return;
                if (!_this.rotated) {
                    graphic.applySettings({
                        height: 0,
                        y: _this.defaultY,
                        sharpEdges: false
                    });
                    graphic.animate({
                        height: _this.height,
                        y: _this.y
                    })
                }
                else {
                    graphic.applySettings({
                        width: 0,
                        x: _this.defaultX,
                        sharpEdges: false
                    });
                    graphic.animate({
                        width: _this.width,
                        x: _this.x
                    })
                }
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file ohlcPoint.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            utils = DX.utils,
            statesConsts = series.consts.states,
            formatHelper = DX.formatHelper;
        series.OhlcPoint = series.BasePoint.inherit({
            ctor: function(data) {
                var debug = DX.utils.debug;
                debug.assertParam(data, 'data was not passed');
                debug.assertParam(data.options, 'options were not passed');
                this.LABEL_BACKGROUND_PADDING_X = 8;
                this.LABEL_BACKGROUND_PADDING_Y = 4;
                this.LABEL_OFFSET = 10;
                this.argument = this.initialArgument = data.argument;
                this.openValue = data.openValue;
                this.highValue = data.highValue;
                this.lowValue = data.lowValue;
                this.closeValue = data.closeValue;
                this.value = this.initialValue = data.reductionValue;
                this.originalOpenValue = data.originalOpenValue;
                this.originalCloseValue = data.originalCloseValue;
                this.originalLowValue = data.originalLowValue;
                this.originalHighValue = data.originalHighValue;
                this.originalArgument = data.originalArgument;
                this.tag = data.tag;
                this.options = data.options;
                this.options.attributes && (this.options.attributes.inh = true);
                this.series = data.series;
                this.rotated = !!(this.series && this.series.options && this.series.options.rotated || false);
                this.labelFormatObject = {
                    openValue: this.openValue,
                    highValue: this.highValue,
                    lowValue: this.lowValue,
                    closeValue: this.closeValue,
                    reductionValue: this.initialValue,
                    argument: this.initialArgument,
                    value: this.initialValue,
                    seriesName: this.series.name,
                    originalOpenValue: this.originalOpenValue,
                    originalCloseValue: this.originalCloseValue,
                    originalLowValue: this.originalLowValue,
                    originalHighValue: this.originalHighValue,
                    originalArgument: this.originalArgument
                };
                this.pointClassName = data.pointClassName || ''
            },
            formatLabel: function(options) {
                this.openValueText = formatHelper.format(this.openValue, options.format, options.precision);
                this.highValueText = formatHelper.format(this.highValue, options.format, options.precision);
                this.lowValueText = formatHelper.format(this.lowValue, options.format, options.precision);
                this.closeValueText = formatHelper.format(this.closeValue, options.format, options.precision);
                this.reductionValueText = formatHelper.format(this.reductionValue, options.format, options.precision);
                this.valueText = formatHelper.format(this.value, options.format, options.precision);
                this.argumentText = formatHelper.format(this.argument, options.argumentFormat, options.argumentPrecision);
                return options.customizeText ? options.customizeText.call(this, this) : this.valueText
            },
            translate: function(translator) {
                var _this = this,
                    rotated = _this.rotated,
                    translateArg = rotated ? 'translateY' : 'translateX',
                    translateVal = rotated ? 'translateX' : 'translateY',
                    height,
                    math = Math;
                _this.translator = translator = translator || _this.translator;
                if (!_this.translator || !_this.hasValue())
                    return;
                _this.x = translator[translateArg](_this.argument) + (_this.xCorrection || 0);
                _this.openY = _this.openValue !== null ? translator[translateVal](_this.openValue) : null;
                _this.highY = translator[translateVal](_this.highValue);
                _this.lowY = translator[translateVal](_this.lowValue);
                _this.closeY = _this.closeValue !== null ? translator[translateVal](_this.closeValue) : null;
                height = math.abs(_this.lowY - _this.highY);
                if (!_this.rotated)
                    _this._calculateVisibility(_this.x - _this.width / 2, math.min(_this.lowY, _this.highY), _this.width, height);
                else
                    _this._calculateVisibility(math.min(_this.lowY, _this.highY), _this.x - _this.width / 2, height, _this.width)
            },
            correctCoordinates: function(correctOptions) {
                var minWidth = 1 + 2 * this.options.attributes.lineWidth,
                    maxWidth = 10;
                this.width = correctOptions.width < minWidth ? minWidth : correctOptions.width > maxWidth ? maxWidth : correctOptions.width;
                this.xCorrection = correctOptions.offset
            },
            drawMarker: function(renderer, group) {
                if (!this.hasValue())
                    return;
                var _this = this,
                    attributes,
                    rotated = _this.rotated,
                    pointGroup;
                attributes = _this._checkState();
                switch (_this.pointClassName) {
                    case'dx-candle-reduction':
                        pointGroup = group.reductionMarkersGroup;
                        break;
                    case'dx-candle-default dx-candle-positive':
                        pointGroup = group.defaultPositiveMarkersGroup;
                        break;
                    case'dx-candle-reduction dx-candle-positive':
                        pointGroup = group.reductionPositiveMarkersGroup;
                        break;
                    default:
                        pointGroup = group.defaultMarkersGroup
                }
                _this.drawMarkerInGroup(pointGroup, attributes, renderer)
            },
            _checkState: function() {
                var _this = this,
                    attributes;
                if (_this.isSelected())
                    attributes = _this.options.states.selected;
                else if (_this.isHovered())
                    attributes = _this.options.states.hover;
                else {
                    attributes = _this.options.attributes;
                    _this.fullState = statesConsts.normalMark
                }
                return attributes
            },
            drawMarkerInGroup: function(pointGroup, attributes, renderer) {
                var _this = this,
                    createPoint = this.rotated ? function(x, y) {
                        return {
                                x: y,
                                y: x
                            }
                    } : function(x, y) {
                        return {
                                x: x,
                                y: y
                            }
                    },
                    openValue = _this.openValue,
                    closeValue = _this.closeValue,
                    y;
                if ($.isNumeric(openValue) && $.isNumeric(closeValue)) {
                    if (openValue > closeValue)
                        _this.graphic = renderer.createArea([createPoint(_this.x, _this.highY), createPoint(_this.x, _this.openY), createPoint(_this.x + _this.width / 2, _this.openY), createPoint(_this.x + _this.width / 2, _this.closeY), createPoint(_this.x, _this.closeY), createPoint(_this.x, _this.lowY), createPoint(_this.x, _this.closeY), createPoint(_this.x - _this.width / 2, _this.closeY), createPoint(_this.x - _this.width / 2, _this.openY), createPoint(_this.x, _this.openY)], attributes).append(pointGroup);
                    else if (openValue < closeValue)
                        _this.graphic = renderer.createArea([createPoint(_this.x, _this.highY), createPoint(_this.x, _this.closeY), createPoint(_this.x + _this.width / 2, _this.closeY), createPoint(_this.x + _this.width / 2, _this.openY), createPoint(_this.x, _this.openY), createPoint(_this.x, _this.lowY), createPoint(_this.x, _this.openY), createPoint(_this.x - _this.width / 2, _this.openY), createPoint(_this.x - _this.width / 2, _this.closeY), createPoint(_this.x, _this.closeY)], attributes).append(pointGroup);
                    else if (openValue === closeValue)
                        _this.graphic = renderer.createArea([createPoint(_this.x, _this.highY), createPoint(_this.x, _this.lowY), createPoint(_this.x, _this.closeY), createPoint(_this.x - _this.width / 2, _this.closeY), createPoint(_this.x + _this.width / 2, _this.closeY), createPoint(_this.x, _this.closeY)], attributes).append(pointGroup)
                }
                else if (openValue === closeValue)
                    _this.graphic = renderer.createArea([createPoint(_this.x, _this.highY), createPoint(_this.x, _this.lowY)], attributes).append(pointGroup);
                else {
                    if ($.isNumeric(openValue))
                        y = _this.openY;
                    else
                        y = _this.closeY;
                    _this.graphic = renderer.createArea([createPoint(_this.x, _this.highY), createPoint(_this.x, _this.lowY), createPoint(_this.x, y), createPoint(_this.x - _this.width / 2, y), createPoint(_this.x + _this.width / 2, y), createPoint(_this.x, y)], attributes).append(pointGroup)
                }
            },
            drawTrackerMarker: function(renderer, trackerGroup) {
                if (!this.hasValue())
                    return;
                var _this = this,
                    highY = _this.highY,
                    lowY = _this.lowY,
                    rotated = _this.rotated,
                    math = Math,
                    x,
                    y,
                    width,
                    height;
                if (highY === lowY) {
                    highY = !rotated ? highY - 2 : highY + 2;
                    lowY = !rotated ? lowY + 2 : lowY - 2
                }
                if (!rotated) {
                    x = _this.x - _this.width / 2;
                    y = math.min(lowY, highY);
                    width = _this.width;
                    height = math.abs(lowY - highY)
                }
                else {
                    x = math.min(lowY, highY);
                    y = _this.x - _this.width / 2;
                    width = math.abs(lowY - highY);
                    height = _this.width
                }
                _this.trackerGraphic = renderer.createRect(x, y, width, height, 0, _this._trackerAttrs).append(trackerGroup);
                _this.trackerGraphic.data({point: _this})
            },
            animate: function(){},
            drawLabel: function(renderer, group) {
                if (!this.hasValue())
                    return;
                if (!utils.isDefined(this.labelFormatObject.value))
                    return;
                var labelOptions = this.options.label,
                    labelText = this.formatLabel.call(this.labelFormatObject, labelOptions),
                    rotated = this.rotated;
                if (!utils.isDefined(labelText))
                    return;
                this.labelGroup = renderer.createGroup().append(group);
                this.insideLabelGroup = renderer.createGroup().append(this.labelGroup);
                labelOptions.background['class'] = this.pointClassName;
                if (labelOptions.background.fill && labelOptions.background.fill !== 'none' || labelOptions.background.strokeWidth && labelOptions.background.stroke && labelOptions.background.stroke !== 'none') {
                    labelOptions.background.fill = this.options.attributes.stroke;
                    this.labelBackground = rotated ? renderer.createRect(this.highY, this.x, 0, 0, 0, labelOptions.background).append(this.insideLabelGroup) : renderer.createRect(this.x, this.highY, 0, 0, 0, labelOptions.background).append(this.insideLabelGroup)
                }
                this.label = rotated ? renderer.createText(labelText, this.highY, this.x, labelOptions.attributes).append(this.insideLabelGroup) : renderer.createText(labelText, this.x, this.highY, labelOptions.attributes).append(this.insideLabelGroup);
                this.correctBackgroundPosition();
                this.rotateLabel();
                this.correctLabelPosition()
            },
            correctLabelPosition: function() {
                var bbox = this.insideLabelGroup.getBBox(),
                    bboxgraphic = this.graphic.getBBox(),
                    rotated = this.rotated,
                    x = 0,
                    y = 0;
                if (!rotated)
                    y += bboxgraphic.y - bbox.y - bbox.height - this.LABEL_OFFSET;
                else
                    x += bboxgraphic.x - bbox.x + bboxgraphic.width + this.LABEL_OFFSET;
                x += this.options.label.horizontalOffset;
                y += this.options.label.verticalOffset;
                this.checkLabelPosition({
                    x: bbox.x + x,
                    y: bbox.y + y,
                    height: bbox.height,
                    width: bbox.width
                }, x, y)
            },
            checkLabelPosition: function(bbox, x, y) {
                var visibleArea = this.translator.getCanvasVisibleArea(),
                    bboxgraphic = this.graphic.getBBox();
                if (visibleArea.minX <= bboxgraphic.x + bboxgraphic.width && visibleArea.maxX >= bboxgraphic.x) {
                    if (visibleArea.minX > bbox.x && this.adjustSeriesLabels)
                        x += visibleArea.minX - bbox.x;
                    if (visibleArea.maxX < bbox.x + bbox.width && this.adjustSeriesLabels)
                        x -= bbox.x + bbox.width - visibleArea.maxX;
                    if (visibleArea.minY > bbox.y)
                        y += visibleArea.minY - bbox.y;
                    if (visibleArea.maxY < bbox.y + bbox.height)
                        y -= bbox.y + bbox.height - visibleArea.maxY
                }
                this.insideLabelGroup.move(~~x, ~~y)
            },
            getTooltipCoords: function() {
                var x,
                    y,
                    min,
                    max,
                    math = Math,
                    minValue = math.min(this.lowY, this.highY),
                    maxValue = math.max(this.lowY, this.highY),
                    visibleArea = this.translator.getCanvasVisibleArea();
                if (this.graphic) {
                    if (!this.rotated) {
                        min = math.max(visibleArea.minY, minValue);
                        max = math.min(visibleArea.maxY, maxValue);
                        x = this.x;
                        y = min + (max - min) / 2
                    }
                    else {
                        min = math.max(visibleArea.minX, minValue);
                        max = math.min(visibleArea.maxX, maxValue);
                        y = this.x;
                        x = min + (max - min) / 2
                    }
                    return {
                            x: x,
                            y: y,
                            offset: 0
                        }
                }
            },
            getTooltipFormatObject: function(tooltip) {
                var highValue = tooltip.formatValueTooltip.call({value: this.highValue}, tooltip.options),
                    openValue = tooltip.formatValueTooltip.call({value: this.openValue}, tooltip.options),
                    closeValue = tooltip.formatValueTooltip.call({value: this.closeValue}, tooltip.options),
                    lowValue = tooltip.formatValueTooltip.call({value: this.lowValue}, tooltip.options);
                return $.extend({}, this.labelFormatObject, {
                        valueText: 'h: ' + highValue + (openValue !== '' ? ' o: ' + openValue : '') + (closeValue !== '' ? ' c: ' + closeValue : '') + ' l: ' + lowValue,
                        highValueText: highValue,
                        openValueText: openValue,
                        closeValueText: closeValue,
                        lowValueText: lowValue,
                        point: this
                    })
            },
            getColor: function() {
                return this.options.attributes.stroke
            },
            hasValue: function() {
                return this.highValue !== null && this.lowValue !== null
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file stockPoint.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            statesConsts = series.consts.states,
            OhlcPoint = series.OhlcPoint;
        series.StockPoint = series.OhlcPoint.inherit({
            correctCoordinates: function(correctOptions) {
                var minWidth = 2 + this.options.attributes.lineWidth,
                    maxWidth = 10;
                this.width = correctOptions.width < minWidth ? minWidth : correctOptions.width > maxWidth ? maxWidth : correctOptions.width;
                this.xCorrection = correctOptions.offset
            },
            drawMarkerInGroup: function(pointGroup, attributes, renderer) {
                var createPoint = this.rotated ? function(x, y) {
                        return {
                                x: y,
                                y: x
                            }
                    } : function(x, y) {
                        return {
                                x: x,
                                y: y
                            }
                    },
                    openYExist = $.isNumeric(this.openY),
                    closeYExist = $.isNumeric(this.closeY);
                this.graphic = renderer.createPath([createPoint(this.x, this.highY), openYExist && createPoint(this.x, this.openY), openYExist && createPoint(this.x - this.width / 2, this.openY), openYExist && createPoint(this.x, this.openY), closeYExist && createPoint(this.x, this.closeY), closeYExist && createPoint(this.x + this.width / 2, this.closeY), closeYExist && createPoint(this.x, this.closeY), createPoint(this.x, this.lowY)], attributes).append(pointGroup)
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file rangePoint.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            utils = DX.utils,
            eventsConsts = series.consts.events,
            statesConsts = series.consts.states;
        series.RangePoint = series.BasePoint.inherit({
            ctor: function(data) {
                this.callBase(data);
                this.minValue = this.initialMinValue = data.minValue !== undefined ? data.minValue : 'default';
                this.originalMinValue = data.originalMinValue;
                this.minLabelFormatObject = {
                    argument: this.initialArgument,
                    value: this.initialMinValue,
                    seriesName: this.series.name,
                    originalMinValue: this.originalMinValue,
                    originalArgument: this.originalArgument
                }
            },
            dispose: function() {
                var _this = this;
                _this.minLabel = null;
                _this.minLabelBackground = null;
                _this.minConnector = null;
                _this.insideMinLabelGroup = null;
                _this.minLabelGroup = null;
                _this.maxLabel = null;
                _this.maxLabelBackground = null;
                _this.maxConnector = null;
                _this.insideMaxLabelGroup = null;
                _this.maxLabelGroup = null;
                _this.topPoints = null;
                _this.bottomPoints = null;
                _this.minLabelFormatObject = null;
                _this.callBase()
            },
            getTooltipCoords: function() {
                var x,
                    y,
                    min,
                    max,
                    minValue,
                    visibleArea = this.translator.getCanvasVisibleArea();
                if (!this.rotated) {
                    minValue = Math.min(this.y, this.minY);
                    x = this.x;
                    min = visibleArea.minY > minValue ? visibleArea.minY : minValue;
                    max = visibleArea.maxY < minValue + this.height ? visibleArea.maxY : minValue + this.height;
                    y = min + (max - min) / 2
                }
                else {
                    minValue = Math.min(this.x, this.minX);
                    y = this.y;
                    min = visibleArea.minX > minValue ? visibleArea.minX : minValue;
                    max = visibleArea.maxX < minValue + this.width ? visibleArea.maxX : minValue + this.width;
                    x = min + (max - min) / 2
                }
                return {
                        x: x,
                        y: y,
                        offset: 0
                    }
            },
            translate: function(translator) {
                this.minX = this.minY = translator.translateY(this.minValue);
                this.callBase(translator);
                if (!this.rotated) {
                    this.height = Math.abs(this.minY - this.y);
                    this.width = 0
                }
                else {
                    this.width = Math.abs(this.x - this.minX);
                    this.height = 0
                }
            },
            isInVisibleArea: function() {
                var minArgument = Math.min(this.minX, this.x) || this.x,
                    maxArgument = Math.max(this.minX, this.x) || this.x,
                    maxValue = Math.max(this.minY, this.y) || this.y,
                    minValue = Math.min(this.minY, this.y) || this.y,
                    notVisibleBothMarkersRight,
                    notVisibleBothMarkersLeft,
                    notVisibleBothMarkersBottom,
                    notVisibleBothMarkersTop,
                    visibleTopMarker = true,
                    visibleBottomMarker = true,
                    visibleRangeArea = true,
                    visibleArea;
                if (this.translator && this.translator.getCanvasVisibleArea) {
                    visibleArea = this.translator.getCanvasVisibleArea();
                    notVisibleBothMarkersRight = visibleArea.maxX < minArgument && visibleArea.maxX < maxArgument;
                    notVisibleBothMarkersLeft = visibleArea.minX > minArgument && visibleArea.minX > maxArgument;
                    notVisibleBothMarkersTop = visibleArea.minY > minValue && visibleArea.minY > maxValue;
                    notVisibleBothMarkersBottom = visibleArea.maxY < minValue && visibleArea.maxY < maxValue;
                    if (notVisibleBothMarkersTop || notVisibleBothMarkersBottom || notVisibleBothMarkersRight || notVisibleBothMarkersLeft)
                        visibleTopMarker = visibleBottomMarker = visibleRangeArea = false;
                    else if (!this.rotated) {
                        visibleTopMarker = visibleArea.minY < minValue && visibleArea.maxY > minValue;
                        visibleBottomMarker = visibleArea.minY < maxValue && visibleArea.maxY > maxValue
                    }
                    else {
                        visibleBottomMarker = visibleArea.minX < minArgument && visibleArea.maxX > minArgument;
                        visibleTopMarker = visibleArea.minX < maxArgument && visibleArea.maxX > maxArgument
                    }
                }
                this.visibleTopMarker = visibleTopMarker;
                this.visibleBottomMarker = visibleBottomMarker;
                this.visibleRangeArea = visibleRangeArea;
                return visibleRangeArea
            },
            drawMarker: function(renderer, group) {
                if (!this.hasValue())
                    return;
                var radius = this.options.attributes.r,
                    topMarker,
                    x,
                    y,
                    bottomMarker,
                    markerGroup = renderer.createGroup().append(group);
                switch (this.options.symbol) {
                    case'circle':
                        if (!this.rotated) {
                            x = this.x;
                            y = Math.min(this.y, this.minY)
                        }
                        else {
                            x = Math.min(this.x, this.minX);
                            y = this.y
                        }
                        topMarker = this.visibleTopMarker ? renderer.createCircle(x + this.width, y, radius, this.options.attributes).append(markerGroup) : null;
                        bottomMarker = this.visibleBottomMarker ? renderer.createCircle(x, y + this.height, radius, this.options.attributes).append(markerGroup) : null;
                        break;
                    case'square':
                    case'polygon':
                    case'triangle':
                    case'cross':
                        topMarker = this.visibleTopMarker ? renderer.createArea(this.topPoints, this.options.attributes).append(markerGroup) : null;
                        bottomMarker = this.visibleBottomMarker ? renderer.createArea(this.bottomPoints, this.options.attributes).append(markerGroup) : null;
                        break
                }
                this.graphic = markerGroup;
                this.graphic.topMarker = topMarker;
                this.graphic.bottomMarker = bottomMarker;
                this._checkState()
            },
            _populatePointShape: function(target, radius) {
                var self = this,
                    floorHalfRadius,
                    ceilHalfRadius,
                    topX,
                    topY,
                    bottomX,
                    bottomY;
                if (!this.rotated) {
                    topX = bottomX = self.x;
                    topY = Math.min(self.y, self.minY);
                    bottomY = Math.max(self.y, self.minY)
                }
                else {
                    topX = Math.max(self.x, self.minX);
                    bottomX = Math.min(self.x, self.minX);
                    topY = bottomY = self.y
                }
                if (self.options.symbol === 'square') {
                    target.topPoints = [{
                            x: topX - radius,
                            y: topY - radius
                        }, {
                            x: topX + radius,
                            y: topY - radius
                        }, {
                            x: topX + radius,
                            y: topY + radius
                        }, {
                            x: topX - radius,
                            y: topY + radius
                        }, {
                            x: topX - radius,
                            y: topY - radius
                        }];
                    target.bottomPoints = [{
                            x: bottomX - radius,
                            y: bottomY - radius
                        }, {
                            x: bottomX + radius,
                            y: bottomY - radius
                        }, {
                            x: bottomX + radius,
                            y: bottomY + radius
                        }, {
                            x: bottomX - radius,
                            y: bottomY + radius
                        }, {
                            x: bottomX - radius,
                            y: bottomY - radius
                        }]
                }
                if (self.options.symbol === 'polygon') {
                    target.topPoints = [{
                            x: topX - radius,
                            y: topY
                        }, {
                            x: topX,
                            y: topY - radius
                        }, {
                            x: topX + radius,
                            y: topY
                        }, {
                            x: topX,
                            y: topY + radius
                        }, {
                            x: topX - radius,
                            y: topY
                        }];
                    target.bottomPoints = [{
                            x: bottomX - radius,
                            y: bottomY
                        }, {
                            x: bottomX,
                            y: bottomY - radius
                        }, {
                            x: bottomX + radius,
                            y: bottomY
                        }, {
                            x: bottomX,
                            y: bottomY + radius
                        }, {
                            x: bottomX - radius,
                            y: bottomY
                        }]
                }
                if (self.options.symbol === 'triangle') {
                    target.topPoints = [{
                            x: topX - radius,
                            y: topY - radius
                        }, {
                            x: topX + radius,
                            y: topY - radius
                        }, {
                            x: topX,
                            y: topY + radius
                        }, {
                            x: topX - radius,
                            y: topY - radius
                        }];
                    target.bottomPoints = [{
                            x: bottomX - radius,
                            y: bottomY - radius
                        }, {
                            x: bottomX + radius,
                            y: bottomY - radius
                        }, {
                            x: bottomX,
                            y: bottomY + radius
                        }, {
                            x: bottomX - radius,
                            y: bottomY - radius
                        }]
                }
                if (self.options.symbol === 'cross') {
                    floorHalfRadius = Math.floor(radius / 2);
                    ceilHalfRadius = Math.ceil(radius / 2);
                    target.topPoints = [{
                            x: topX - radius,
                            y: topY - floorHalfRadius
                        }, {
                            x: topX - floorHalfRadius,
                            y: topY - radius
                        }, {
                            x: topX,
                            y: topY - ceilHalfRadius
                        }, {
                            x: topX + floorHalfRadius,
                            y: topY - radius
                        }, {
                            x: topX + radius,
                            y: topY - floorHalfRadius
                        }, {
                            x: topX + ceilHalfRadius,
                            y: topY
                        }, {
                            x: topX + radius,
                            y: topY + floorHalfRadius
                        }, {
                            x: topX + floorHalfRadius,
                            y: topY + radius
                        }, {
                            x: topX,
                            y: topY + ceilHalfRadius
                        }, {
                            x: topX - floorHalfRadius,
                            y: topY + radius
                        }, {
                            x: topX - radius,
                            y: topY + floorHalfRadius
                        }, {
                            x: topX - ceilHalfRadius,
                            y: topY
                        }];
                    target.bottomPoints = [{
                            x: bottomX - radius,
                            y: bottomY - floorHalfRadius
                        }, {
                            x: bottomX - floorHalfRadius,
                            y: bottomY - radius
                        }, {
                            x: bottomX,
                            y: bottomY - ceilHalfRadius
                        }, {
                            x: bottomX + floorHalfRadius,
                            y: bottomY - radius
                        }, {
                            x: bottomX + radius,
                            y: bottomY - floorHalfRadius
                        }, {
                            x: bottomX + ceilHalfRadius,
                            y: bottomY
                        }, {
                            x: bottomX + radius,
                            y: bottomY + floorHalfRadius
                        }, {
                            x: bottomX + floorHalfRadius,
                            y: bottomY + radius
                        }, {
                            x: bottomX,
                            y: bottomY + ceilHalfRadius
                        }, {
                            x: bottomX - floorHalfRadius,
                            y: bottomY + radius
                        }, {
                            x: bottomX - radius,
                            y: bottomY + floorHalfRadius
                        }, {
                            x: bottomX - ceilHalfRadius,
                            y: bottomY
                        }]
                }
            },
            drawTrackerMarker: function(renderer, trackerGroup) {
                if (!this.hasValue())
                    return;
                var _this = this,
                    options = _this.options,
                    radius = options.trackerR || _this.storeTrackerR(),
                    x,
                    y;
                if (!_this.rotated) {
                    x = _this.x - radius;
                    y = Math.min(_this.y, _this.minY) - radius
                }
                else {
                    x = Math.min(_this.x, _this.minX) - radius;
                    y = _this.y - radius
                }
                _this.trackerGraphic = renderer.createRect(x, y, _this.width + 2 * radius, _this.height + 2 * radius, 0, _this._trackerAttrs).append(trackerGroup);
                _this.trackerGraphic.data({point: _this})
            },
            applyStyle: function(style) {
                if (this.graphic) {
                    this._populatePointShape(style, style.r);
                    if (this.graphic.topMarker)
                        this.graphic.topMarker.applySettings(style.topPoints ? {
                            points: style.topPoints,
                            style: style
                        } : style);
                    if (this.graphic.bottomMarker)
                        this.graphic.bottomMarker.applySettings(style.bottomPoints ? {
                            points: style.bottomPoints,
                            style: style
                        } : style)
                }
            },
            applyNormalStyle: function() {
                this.applyStyle(this.options.states.normal);
                return this.callBase()
            },
            applyHoverStyle: function() {
                this.applyStyle(this.options.states.hover);
                return this.callBase()
            },
            applySelectionStyle: function() {
                this.applyStyle(this.options.states.selected);
                return this.callBase()
            },
            drawLabel: function(renderer, group) {
                if (!this.hasValue())
                    return;
                if (!utils.isDefined(this.labelFormatObject.value) || !utils.isDefined(this.minLabelFormatObject.value))
                    return;
                var labelOptions = this.options.label,
                    maxLabelText = this.formatLabel.call(this.labelFormatObject, labelOptions),
                    minLabelText = this.formatLabel.call(this.minLabelFormatObject, labelOptions),
                    businessRange = this.translator.getBusinessRange(),
                    isDiscreteValue = this.series.options.valueAxisType === 'discrete',
                    notInverted = isDiscreteValue && (!businessRange.invertY && !this.rotated || businessRange.invertX && this.rotated) || !isDiscreteValue && this.value > this.minValue && (!businessRange.invertY && !this.rotated || !businessRange.invertX && this.rotated);
                if (!utils.isDefined(maxLabelText) || !utils.isDefined(minLabelText))
                    return;
                this.labelGroup = renderer.createGroup().append(group);
                if (this.options.label.connector && this.options.label.connector.strokeWidth) {
                    if (this.visibleTopMarker)
                        this.maxConnector = renderer.createLine(0, 0, 0, 0, this.options.label.connector).append(this.labelGroup);
                    if (this.visibleBottomMarker)
                        this.minConnector = renderer.createLine(0, 0, 0, 0, this.options.label.connector).append(this.labelGroup)
                }
                this.maxLabelGroup = renderer.createGroup().append(this.labelGroup);
                this.insideMaxLabelGroup = renderer.createGroup().append(this.maxLabelGroup);
                this.minLabelGroup = renderer.createGroup().append(this.labelGroup);
                this.insideMinLabelGroup = renderer.createGroup().append(this.minLabelGroup);
                if (labelOptions.background.fill && labelOptions.background.fill !== 'none' || labelOptions.background.strokeWidth && labelOptions.background.stroke && labelOptions.background.stroke !== 'none') {
                    this.maxLabelBackground = renderer.createRect(this.x, this.y, 0, 0, 0, labelOptions.background).append(this.insideMaxLabelGroup);
                    this.minLabelBackground = renderer.createRect(this.x, this.y, 0, 0, 0, labelOptions.background).append(this.insideMinLabelGroup)
                }
                this.maxLabel = renderer.createText(notInverted ? maxLabelText : minLabelText, this.x, this.y, labelOptions.attributes).append(this.insideMaxLabelGroup);
                this.minLabel = renderer.createText(notInverted ? minLabelText : maxLabelText, this.x, this.y, labelOptions.attributes).append(this.insideMinLabelGroup);
                this.correctLabel();
                this.correctConnectorPosition(this.maxLabelGroup.getBBox(), this.maxConnector);
                this.correctConnectorPosition(this.minLabelGroup.getBBox(), this.minConnector)
            },
            rotateLabel: function() {
                var bboxmax = this.insideMaxLabelGroup.getBBox(),
                    bboxmin = this.insideMinLabelGroup.getBBox(),
                    labelOptions = this.options.label;
                this.insideMaxLabelGroup.applySettings({
                    x: bboxmax.x + bboxmax.width / 2,
                    y: bboxmax.y + bboxmax.height / 2,
                    rotate: labelOptions.rotationAngle
                });
                this.insideMinLabelGroup.applySettings({
                    x: bboxmin.x + bboxmin.width / 2,
                    y: bboxmin.y + bboxmin.height / 2,
                    rotate: labelOptions.rotationAngle
                })
            },
            correctLabelPosition: function() {
                var maxbbox = this.insideMaxLabelGroup.getBBox(),
                    minbbox = this.insideMinLabelGroup.getBBox(),
                    topBBoxgraphic = this.graphic && this.graphic.topMarker ? this.graphic.topMarker.getBBox() : {
                        x: this.rotated ? Math.max(this.x, this.minX) : this.x,
                        y: !this.rotated ? Math.min(this.y, this.minY) : this.y,
                        height: 0,
                        width: 0
                    },
                    bottomBBoxgraphic = this.graphic && this.graphic.bottomMarker ? this.graphic.bottomMarker.getBBox() : {
                        x: this.rotated ? Math.min(this.x, this.minX) : this.x,
                        y: !this.rotated ? Math.max(this.y, this.minY) : this.y,
                        height: 0,
                        width: 0
                    },
                    x1 = 0,
                    y1 = 0,
                    x2 = 0,
                    y2 = 0;
                if (this.options.label.position === 'outside')
                    if (!this.rotated) {
                        y1 += topBBoxgraphic.y - maxbbox.y - maxbbox.height - this.LABEL_OFFSET;
                        y2 += bottomBBoxgraphic.y + bottomBBoxgraphic.height - minbbox.y + this.LABEL_OFFSET
                    }
                    else {
                        y1 = y2 += topBBoxgraphic.y - maxbbox.y - maxbbox.height / 2 + topBBoxgraphic.height / 2;
                        x1 += topBBoxgraphic.x + topBBoxgraphic.width - maxbbox.x + this.LABEL_OFFSET;
                        x2 += bottomBBoxgraphic.x - minbbox.x - minbbox.width - this.LABEL_OFFSET
                    }
                else if (this.options.label.position === 'inside')
                    if (!this.rotated) {
                        y1 += topBBoxgraphic.y + topBBoxgraphic.height - maxbbox.y + this.LABEL_OFFSET;
                        y2 += bottomBBoxgraphic.y - minbbox.y - minbbox.height - this.LABEL_OFFSET
                    }
                    else {
                        y1 = y2 += topBBoxgraphic.y - maxbbox.y - maxbbox.height / 2 + topBBoxgraphic.height / 2;
                        x1 += topBBoxgraphic.x - maxbbox.x - maxbbox.width - this.LABEL_OFFSET;
                        x2 += bottomBBoxgraphic.x + bottomBBoxgraphic.width - minbbox.x + this.LABEL_OFFSET
                    }
                x1 += this.options.label.horizontalOffset;
                y1 += this.options.label.verticalOffset;
                x2 += this.options.label.horizontalOffset;
                y2 += this.options.label.verticalOffset;
                this.checkLabelPosition(x1, y1, x2, y2)
            },
            checkLabelPosition: function(x1, y1, x2, y2) {
                var maxgroupbbox = this.insideMaxLabelGroup.getBBox(),
                    mingroupbbox = this.insideMinLabelGroup.getBBox(),
                    newMaxbbox = {},
                    newMinbbox = {},
                    topBBoxgraphic = this.graphic && this.graphic.topMarker ? this.graphic.topMarker.getBBox() : {
                        x: this.rotated ? Math.max(this.x, this.minX) : this.x,
                        y: !this.rotated ? Math.min(this.y, this.minY) : this.y,
                        height: 0,
                        width: 0
                    },
                    bottomBBoxgraphic = this.graphic && this.graphic.bottomMarker ? this.graphic.bottomMarker.getBBox() : {
                        x: this.rotated ? Math.min(this.x, this.minX) : this.x,
                        y: !this.rotated ? Math.max(this.y, this.minY) : this.y,
                        height: 0,
                        width: 0
                    },
                    maxX = maxgroupbbox.x + x1,
                    maxY = maxgroupbbox.y + y1,
                    minX = mingroupbbox.x + x2,
                    minY = mingroupbbox.y + y2;
                var visibleArea = this.translator.getCanvasVisibleArea();
                if (this.visibleRangeArea) {
                    if (!this.rotated) {
                        if (visibleArea.minX > maxX && this.adjustSeriesLabels)
                            x1 += visibleArea.minX - maxX;
                        if (visibleArea.minX > minX && this.adjustSeriesLabels)
                            x2 += visibleArea.minX - minX;
                        if (visibleArea.maxX < maxX + maxgroupbbox.width && this.adjustSeriesLabels)
                            x1 -= maxX + maxgroupbbox.width - visibleArea.maxX;
                        if (visibleArea.maxX < minX + mingroupbbox.width && this.adjustSeriesLabels)
                            x2 -= minX + mingroupbbox.width - visibleArea.maxX;
                        if (visibleArea.minY > maxY)
                            y1 += visibleArea.minY - maxY;
                        if (visibleArea.maxY < minY + mingroupbbox.height)
                            y2 -= minY + mingroupbbox.height - visibleArea.maxY;
                        newMaxbbox.y = maxgroupbbox.y + y1;
                        newMinbbox.y = mingroupbbox.y + y2;
                        if (newMaxbbox.y + maxgroupbbox.height > newMinbbox.y) {
                            y1 -= (newMaxbbox.y + maxgroupbbox.height - newMinbbox.y) / 2;
                            y2 += (newMaxbbox.y + maxgroupbbox.height - newMinbbox.y) / 2;
                            newMaxbbox.y = maxgroupbbox.y + y1;
                            newMinbbox.y = mingroupbbox.y + y2;
                            if (visibleArea.minY > newMaxbbox.y) {
                                y2 += visibleArea.minY - newMaxbbox.y;
                                y1 += visibleArea.minY - newMaxbbox.y
                            }
                            else if (visibleArea.maxY < newMinbbox.y + mingroupbbox.height) {
                                y1 -= newMinbbox.y + mingroupbbox.height - visibleArea.maxY;
                                y2 -= newMinbbox.y + mingroupbbox.height - visibleArea.maxY
                            }
                        }
                    }
                    if (this.rotated) {
                        if (visibleArea.minX > minX)
                            x2 += visibleArea.minX - minX;
                        if (visibleArea.maxX < maxX + maxgroupbbox.width)
                            x1 -= maxX + maxgroupbbox.width - visibleArea.maxX;
                        if (visibleArea.minY > minY && this.adjustSeriesLabels)
                            y2 += visibleArea.minY - minY;
                        if (visibleArea.minY > maxY && this.adjustSeriesLabels)
                            y1 += visibleArea.minY - maxY;
                        if (visibleArea.maxY < minY + mingroupbbox.height && this.adjustSeriesLabels)
                            y2 -= minY + mingroupbbox.height - visibleArea.maxY;
                        if (visibleArea.maxY < maxY + maxgroupbbox.height && this.adjustSeriesLabels)
                            y1 -= maxY + maxgroupbbox.height - visibleArea.maxY;
                        newMaxbbox.x = maxgroupbbox.x + x1;
                        newMinbbox.x = mingroupbbox.x + x2;
                        if (newMaxbbox.x < newMinbbox.x + mingroupbbox.width) {
                            x1 += (newMinbbox.x + mingroupbbox.width - newMaxbbox.x) / 2;
                            x2 -= (newMinbbox.x + mingroupbbox.width - newMaxbbox.x) / 2;
                            newMaxbbox.x = maxgroupbbox.x + x1;
                            newMinbbox.x = mingroupbbox.x + x2;
                            if (visibleArea.minX > newMinbbox.x) {
                                x2 += visibleArea.minX - newMinbbox.x;
                                x1 += visibleArea.minX - newMinbbox.x
                            }
                            else if (visibleArea.maxX < newMaxbbox.x + maxgroupbbox.width) {
                                x1 -= newMaxbbox.x + maxgroupbbox.width - visibleArea.maxX;
                                x2 -= newMaxbbox.x + maxgroupbbox.width - visibleArea.maxX
                            }
                        }
                    }
                }
                this.insideMaxLabelGroup.move(~~x1, ~~y1);
                this.insideMinLabelGroup.move(~~x2, ~~y2)
            },
            correctBackgroundPosition: function() {
                if (!this.maxLabelBackground || !this.minLabelBackground)
                    return;
                var maxbbox = this.maxLabel.getBBox(),
                    minbbox = this.minLabel.getBBox(),
                    x1 = maxbbox.x - this.LABEL_BACKGROUND_PADDING_X,
                    x2 = minbbox.x - this.LABEL_BACKGROUND_PADDING_X,
                    y1 = maxbbox.y - this.LABEL_BACKGROUND_PADDING_Y,
                    y2 = minbbox.y - this.LABEL_BACKGROUND_PADDING_Y,
                    width1 = maxbbox.width + 2 * this.LABEL_BACKGROUND_PADDING_X,
                    width2 = minbbox.width + 2 * this.LABEL_BACKGROUND_PADDING_X,
                    height1 = maxbbox.height + 2 * this.LABEL_BACKGROUND_PADDING_Y,
                    height2 = minbbox.height + 2 * this.LABEL_BACKGROUND_PADDING_Y;
                this.maxLabelBackground.applySettings({
                    x: x1,
                    y: y1,
                    width: width1,
                    height: height1
                });
                this.minLabelBackground.applySettings({
                    x: x2,
                    y: y2,
                    width: width2,
                    height: height2
                })
            },
            correctConnectorPosition: function(bbox, connector) {
                if (!connector)
                    return;
                var bboxgraphic = this.graphic ? this.graphic.getBBox() : {
                        x: this.rotated ? Math.min(this.x, this.minX) : this.x,
                        y: !this.rotated ? Math.min(this.y, this.minY) : this.y,
                        height: this.height,
                        width: this.width
                    },
                    centerLabelY = this.maxLabelBackground || this.minLabelBackground ? bbox.y + bbox.height / 2 : null,
                    centerLabelX = this.maxLabelBackground || this.minLabelBackground ? bbox.x + bbox.width / 2 : null,
                    x1,
                    x2,
                    y1,
                    y2;
                if (!this.rotated) {
                    if ((centerLabelY || bbox.y + bbox.height) < bboxgraphic.y) {
                        y1 = centerLabelY || bbox.y + bbox.height;
                        y2 = bboxgraphic.y
                    }
                    else if ((centerLabelY || bbox.y) > bboxgraphic.y + bboxgraphic.height) {
                        y1 = centerLabelY || bbox.y;
                        y2 = bboxgraphic.y + bboxgraphic.height
                    }
                    else
                        return false;
                    x1 = Math.round(bbox.x + bbox.width / 2);
                    if (x1 > bboxgraphic.x + bboxgraphic.width)
                        x2 = bboxgraphic.x + bboxgraphic.width;
                    else if (x1 < bboxgraphic.x)
                        x2 = bboxgraphic.x;
                    else
                        x2 = x1
                }
                else {
                    if ((centerLabelX || bbox.x) > bboxgraphic.x + bboxgraphic.width) {
                        x1 = centerLabelX || bbox.x;
                        x2 = bboxgraphic.x + bboxgraphic.width
                    }
                    else if ((centerLabelX || bbox.x + bbox.width) < bboxgraphic.x) {
                        x1 = centerLabelX || bbox.x + bbox.width;
                        x2 = bboxgraphic.x
                    }
                    else
                        return false;
                    y1 = Math.round(bbox.y + bbox.height / 2);
                    if (y1 > bboxgraphic.y + bboxgraphic.height)
                        y2 = bboxgraphic.y + bboxgraphic.height;
                    else if (y1 < bboxgraphic.y)
                        y2 = bboxgraphic.y;
                    else
                        y2 = y1
                }
                connector.applySettings({points: [x1, y1, x2, y2]})
            },
            getTooltipFormatObject: function(tooltip) {
                var minValue = tooltip.formatValueTooltip.call({value: this.initialMinValue}, tooltip.options),
                    value = tooltip.formatValueTooltip.call({value: this.initialValue}, tooltip.options);
                return {
                        argument: this.initialArgument,
                        valueText: minValue + ' - ' + value,
                        rangeValue1Text: minValue,
                        rangeValue2Text: value,
                        rangeValue1: this.initialMinValue,
                        rangeValue2: this.initialValue,
                        seriesName: this.series.name,
                        point: this,
                        originalMinValue: this.originalMinValue,
                        originalValue: this.originalValue,
                        originalArgument: this.originalArgument
                    }
            },
            animate: function() {
                var _this = this,
                    graphic = _this.graphic;
                if (!graphic || !_this.translator)
                    return;
                if (!_this.rotated) {
                    if (graphic.topMarker)
                        graphic.topMarker.move(0, _this.defaultY - Math.min(_this.minY, _this.y));
                    if (graphic.bottomMarker)
                        graphic.bottomMarker.move(0, _this.defaultY - Math.max(_this.minY, _this.y))
                }
                else {
                    if (graphic.topMarker)
                        graphic.topMarker.move(_this.defaultX - Math.max(_this.minX, _this.x), 0);
                    if (graphic.bottomMarker)
                        graphic.bottomMarker.move(_this.defaultX - Math.min(_this.minX, _this.x), 0)
                }
                if (graphic.topMarker)
                    graphic.topMarker.move(0, 0, true);
                if (graphic.bottomMarker)
                    graphic.bottomMarker.move(0, 0, true)
            },
            hasValue: function() {
                return this.initialValue !== null && this.initialMinValue !== null
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file rangeBarPoint.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            BarPoint = series.BarPoint,
            utils = DX.utils;
        series.RangeBarPoint = series.BarPoint.inherit({
            ctor: function(data) {
                this.callBase(data);
                this.minValue = this.initialMinValue = data.minValue !== undefined ? data.minValue : 'default';
                this.originalMinValue = data.originalMinValue;
                this.minLabelFormatObject = {
                    argument: this.initialArgument,
                    value: this.initialMinValue,
                    seriesName: this.options.seriesName,
                    originalMinValue: this.originalMinValue,
                    originalArgument: this.originalArgument
                }
            },
            dispose: function() {
                var _this = this;
                _this.minLabel = null;
                _this.minLabelBackground = null;
                _this.minConnector = null;
                _this.insideMinLabelGroup = null;
                _this.minLabelGroup = null;
                _this.maxLabel = null;
                _this.maxLabelBackground = null;
                _this.maxConnector = null;
                _this.insideMaxLabelGroup = null;
                _this.maxLabelGroup = null;
                _this.minLabelFormatObject = null;
                _this.callBase()
            },
            translate: function(translator) {
                if (!this.hasValue())
                    return;
                this.callBase(translator);
                if (this.rotated)
                    this.width = this.width || 1;
                else
                    this.height = this.height || 1
            },
            drawLabel: function(renderer, group) {
                if (!this.hasValue() && (!utils.isDefined(this.labelFormatObject.value) || !utils.isDefined(this.minLabelFormatObject.value)))
                    return;
                var labelOptions = this.options.label,
                    maxLabelText = this.formatLabel.call(this.labelFormatObject, labelOptions),
                    minLabelText = this.formatLabel.call(this.minLabelFormatObject, labelOptions),
                    businessRange = this.translator.getBusinessRange(),
                    isDiscreteValue = this.series.options.valueAxisType === 'discrete',
                    notInverted = isDiscreteValue && (!businessRange.invertY && !this.rotated || businessRange.invertX && this.rotated) || !isDiscreteValue && this.value > this.minValue && (!businessRange.invertY && !this.rotated || !businessRange.invertX && this.rotated);
                if (!utils.isDefined(maxLabelText) || !utils.isDefined(minLabelText))
                    return;
                this.labelGroup = renderer.createGroup().append(group);
                if (this.options.label.connector && this.options.label.connector.strokeWidth) {
                    this.maxConnector = renderer.createLine(0, 0, 0, 0, this.options.label.connector).append(this.labelGroup);
                    this.minConnector = renderer.createLine(0, 0, 0, 0, this.options.label.connector).append(this.labelGroup)
                }
                this.maxLabelGroup = renderer.createGroup().append(this.labelGroup);
                this.insideMaxLabelGroup = renderer.createGroup().append(this.maxLabelGroup);
                this.minLabelGroup = renderer.createGroup().append(this.labelGroup);
                this.insideMinLabelGroup = renderer.createGroup().append(this.minLabelGroup);
                if (labelOptions.background.fill && labelOptions.background.fill !== 'none' || labelOptions.background.strokeWidth && labelOptions.background.stroke && labelOptions.background.stroke !== 'none') {
                    this.maxLabelBackground = renderer.createRect(this.x, this.y, 0, 0, 0, labelOptions.background).append(this.insideMaxLabelGroup);
                    this.minLabelBackground = renderer.createRect(this.x, this.y, 0, 0, 0, labelOptions.background).append(this.insideMinLabelGroup)
                }
                this.maxLabel = renderer.createText(notInverted ? maxLabelText : minLabelText, this.x, this.y, labelOptions.attributes).append(this.insideMaxLabelGroup);
                this.minLabel = renderer.createText(notInverted ? minLabelText : maxLabelText, this.x, this.y, labelOptions.attributes).append(this.insideMinLabelGroup);
                this.correctLabel();
                this.correctConnectorPosition(this.maxLabelGroup.getBBox(), this.maxConnector);
                this.correctConnectorPosition(this.minLabelGroup.getBBox(), this.minConnector)
            },
            rotateLabel: function() {
                var bboxmax = this.insideMaxLabelGroup.getBBox(),
                    bboxmin = this.insideMinLabelGroup.getBBox(),
                    labelOptions = this.options.label;
                this.insideMaxLabelGroup.applySettings({
                    x: bboxmax.x + bboxmax.width / 2,
                    y: bboxmax.y + bboxmax.height / 2,
                    rotate: labelOptions.rotationAngle
                });
                this.insideMinLabelGroup.applySettings({
                    x: bboxmin.x + bboxmin.width / 2,
                    y: bboxmin.y + bboxmin.height / 2,
                    rotate: labelOptions.rotationAngle
                })
            },
            correctLabelPosition: function() {
                var maxbbox = this.insideMaxLabelGroup.getBBox(),
                    minbbox = this.insideMinLabelGroup.getBBox(),
                    bboxgraphic = this.graphic.getBBox(),
                    x1 = 0,
                    y1 = 0,
                    x2 = 0,
                    y2 = 0;
                if (bboxgraphic.isEmpty)
                    bboxgraphic = this.getGraphicSettings();
                if (this.options.label.position === 'outside')
                    if (!this.rotated) {
                        x1 = x2 += bboxgraphic.width / 2;
                        y1 += bboxgraphic.y - maxbbox.y - maxbbox.height - this.LABEL_OFFSET;
                        y2 += bboxgraphic.y + bboxgraphic.height - minbbox.y + this.LABEL_OFFSET
                    }
                    else {
                        y1 = y2 += bboxgraphic.y - maxbbox.y - maxbbox.height / 2 + bboxgraphic.height / 2;
                        x1 += bboxgraphic.x + bboxgraphic.width - maxbbox.x + this.LABEL_OFFSET;
                        x2 += bboxgraphic.x - minbbox.x - minbbox.width - this.LABEL_OFFSET
                    }
                else if (this.options.label.position === 'inside')
                    if (!this.rotated) {
                        x1 = x2 += bboxgraphic.width / 2;
                        y1 += bboxgraphic.y - maxbbox.y + this.LABEL_OFFSET;
                        y2 += bboxgraphic.y + bboxgraphic.height - minbbox.y - minbbox.height - this.LABEL_OFFSET
                    }
                    else {
                        y1 = y2 += bboxgraphic.y - maxbbox.y - maxbbox.height / 2 + bboxgraphic.height / 2;
                        x1 += bboxgraphic.x + bboxgraphic.width - maxbbox.x - maxbbox.width - this.LABEL_OFFSET;
                        x2 += bboxgraphic.x - minbbox.x + this.LABEL_OFFSET
                    }
                x1 += this.options.label.horizontalOffset;
                y1 += this.options.label.verticalOffset;
                x2 += this.options.label.horizontalOffset;
                y2 += this.options.label.verticalOffset;
                this.checkLabelPosition(x1, y1, x2, y2)
            },
            checkLabelPosition: function(x1, y1, x2, y2) {
                var maxgroupbbox = this.insideMaxLabelGroup.getBBox(),
                    mingroupbbox = this.insideMinLabelGroup.getBBox(),
                    newMaxbbox = {},
                    newMinbbox = {},
                    bboxgraphic = this.graphic.getBBox(),
                    maxX = maxgroupbbox.x + x1,
                    maxY = maxgroupbbox.y + y1,
                    minX = mingroupbbox.x + x2,
                    minY = mingroupbbox.y + y2;
                var visibleArea = this.translator.getCanvasVisibleArea();
                if (visibleArea.minX <= bboxgraphic.x + bboxgraphic.width && visibleArea.maxX >= bboxgraphic.x && visibleArea.minY <= bboxgraphic.y + bboxgraphic.height && visibleArea.maxY >= bboxgraphic.y) {
                    if (!this.rotated) {
                        if (visibleArea.minX > maxX && this.adjustSeriesLabels)
                            x1 += visibleArea.minX - maxX;
                        if (visibleArea.minX > minX && this.adjustSeriesLabels)
                            x2 += visibleArea.minX - minX;
                        if (visibleArea.maxX < maxX + maxgroupbbox.width && this.adjustSeriesLabels)
                            x1 -= maxX + maxgroupbbox.width - visibleArea.maxX;
                        if (visibleArea.maxX < minX + mingroupbbox.width && this.adjustSeriesLabels)
                            x2 -= minX + mingroupbbox.width - visibleArea.maxX;
                        if (visibleArea.minY > maxY)
                            y1 += visibleArea.minY - maxY;
                        if (visibleArea.maxY < minY + mingroupbbox.height)
                            y2 -= minY + mingroupbbox.height - visibleArea.maxY;
                        newMaxbbox.y = maxgroupbbox.y + y1;
                        newMinbbox.y = mingroupbbox.y + y2;
                        if (newMaxbbox.y + maxgroupbbox.height > newMinbbox.y) {
                            y1 -= (newMaxbbox.y + maxgroupbbox.height - newMinbbox.y) / 2;
                            y2 += (newMaxbbox.y + maxgroupbbox.height - newMinbbox.y) / 2;
                            newMaxbbox.y = maxgroupbbox.y + y1;
                            newMinbbox.y = mingroupbbox.y + y2;
                            if (visibleArea.minY > newMaxbbox.y) {
                                y2 += visibleArea.minY - newMaxbbox.y;
                                y1 += visibleArea.minY - newMaxbbox.y
                            }
                            else if (visibleArea.maxY < newMinbbox.y + mingroupbbox.height) {
                                y1 -= newMinbbox.y + mingroupbbox.height - visibleArea.maxY;
                                y2 -= newMinbbox.y + mingroupbbox.height - visibleArea.maxY
                            }
                        }
                    }
                    if (this.rotated) {
                        if (visibleArea.minX > minX)
                            x2 += visibleArea.minX - minX;
                        if (visibleArea.maxX < maxX + maxgroupbbox.width)
                            x1 -= maxX + maxgroupbbox.width - visibleArea.maxX;
                        if (visibleArea.minY > minY && this.adjustSeriesLabels)
                            y2 += visibleArea.minY - minY;
                        if (visibleArea.minY > maxY && this.adjustSeriesLabels)
                            y1 += visibleArea.minY - maxY;
                        if (visibleArea.maxY < minY + mingroupbbox.height && this.adjustSeriesLabels)
                            y2 -= minY + mingroupbbox.height - visibleArea.maxY;
                        if (visibleArea.maxY < maxY + maxgroupbbox.height && this.adjustSeriesLabels)
                            y1 -= maxY + maxgroupbbox.height - visibleArea.maxY;
                        newMaxbbox.x = maxgroupbbox.x + x1;
                        newMinbbox.x = mingroupbbox.x + x2;
                        if (newMaxbbox.x < newMinbbox.x + mingroupbbox.width) {
                            x1 += (newMinbbox.x + mingroupbbox.width - newMaxbbox.x) / 2;
                            x2 -= (newMinbbox.x + mingroupbbox.width - newMaxbbox.x) / 2;
                            newMaxbbox.x = maxgroupbbox.x + x1;
                            newMinbbox.x = mingroupbbox.x + x2;
                            if (visibleArea.minX > newMinbbox.x) {
                                x2 += visibleArea.minX - newMinbbox.x;
                                x1 += visibleArea.minX - newMinbbox.x
                            }
                            else if (visibleArea.maxX < newMaxbbox.x + maxgroupbbox.width) {
                                x1 -= newMaxbbox.x + maxgroupbbox.width - visibleArea.maxX;
                                x2 -= newMaxbbox.x + maxgroupbbox.width - visibleArea.maxX
                            }
                        }
                    }
                }
                this.insideMaxLabelGroup.move(~~x1, ~~y1);
                this.insideMinLabelGroup.move(~~x2, ~~y2)
            },
            correctBackgroundPosition: function() {
                if (!this.maxLabelBackground || !this.minLabelBackground)
                    return;
                var maxbbox = this.maxLabel.getBBox(),
                    minbbox = this.minLabel.getBBox(),
                    x1 = maxbbox.x - this.LABEL_BACKGROUND_PADDING_X,
                    x2 = minbbox.x - this.LABEL_BACKGROUND_PADDING_X,
                    y1 = maxbbox.y - this.LABEL_BACKGROUND_PADDING_Y,
                    y2 = minbbox.y - this.LABEL_BACKGROUND_PADDING_Y,
                    width1 = maxbbox.width + 2 * this.LABEL_BACKGROUND_PADDING_X,
                    width2 = minbbox.width + 2 * this.LABEL_BACKGROUND_PADDING_X,
                    height1 = maxbbox.height + 2 * this.LABEL_BACKGROUND_PADDING_Y,
                    height2 = minbbox.height + 2 * this.LABEL_BACKGROUND_PADDING_Y;
                this.maxLabelBackground.applySettings({
                    x: x1,
                    y: y1,
                    width: width1,
                    height: height1
                });
                this.minLabelBackground.applySettings({
                    x: x2,
                    y: y2,
                    width: width2,
                    height: height2
                })
            },
            correctConnectorPosition: function(bbox, connector) {
                if (!connector)
                    return;
                var bboxgraphic = this.graphic.getBBox(),
                    x1,
                    x2,
                    y1,
                    y2,
                    centerLabelY = this.maxLabelBackground || this.minLabelBackground ? bbox.y + bbox.height / 2 : null,
                    centerLabelX = this.maxLabelBackground || this.minLabelBackground ? bbox.x + bbox.width / 2 : null;
                if (bboxgraphic.isEmpty)
                    bboxgraphic = this.getGraphicSettings();
                if (!this.rotated) {
                    if ((centerLabelY || bbox.y + bbox.height) < bboxgraphic.y) {
                        y1 = centerLabelY || bbox.y + bbox.height;
                        y2 = bboxgraphic.y
                    }
                    else if ((centerLabelY || bbox.y) > bboxgraphic.y + bboxgraphic.height) {
                        y1 = centerLabelY || bbox.y;
                        y2 = bboxgraphic.y + bboxgraphic.height
                    }
                    else
                        return false;
                    x1 = Math.round(bbox.x + bbox.width / 2);
                    if (x1 > bboxgraphic.x + bboxgraphic.width)
                        x2 = bboxgraphic.x + bboxgraphic.width;
                    else if (x1 < bboxgraphic.x)
                        x2 = bboxgraphic.x;
                    else
                        x2 = x1
                }
                else {
                    if ((centerLabelX || bbox.x) > bboxgraphic.x + bboxgraphic.width) {
                        x1 = centerLabelX || bbox.x;
                        x2 = bboxgraphic.x + bboxgraphic.width
                    }
                    else if ((centerLabelX || bbox.x + bbox.width) < bboxgraphic.x) {
                        x1 = centerLabelX || bbox.x + bbox.width;
                        x2 = bboxgraphic.x
                    }
                    else
                        return false;
                    y1 = Math.round(bbox.y + bbox.height / 2);
                    if (y1 > bboxgraphic.y + bboxgraphic.height)
                        y2 = bboxgraphic.y + bboxgraphic.height;
                    else if (y1 < bboxgraphic.y)
                        y2 = bboxgraphic.y;
                    else
                        y2 = y1
                }
                connector.applySettings({points: [x1, y1, x2, y2]})
            },
            getTooltipFormatObject: function(tooltip) {
                var minValue = tooltip.formatValueTooltip.call({value: this.initialMinValue}, tooltip.options),
                    value = tooltip.formatValueTooltip.call({value: this.initialValue}, tooltip.options);
                return {
                        argument: this.initialArgument,
                        valueText: minValue + ' - ' + value,
                        rangeValue1Text: minValue,
                        rangeValue2Text: value,
                        rangeValue1: this.initialMinValue,
                        rangeValue2: this.initialValue,
                        seriesName: this.options.seriesName,
                        point: this,
                        originalMinValue: this.originalMinValue,
                        originalValue: this.originalValue,
                        originalArgument: this.originalArgument
                    }
            },
            hasValue: function() {
                return this.initialValue !== null && this.initialMinValue !== null
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file bubblePoint.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            statesConsts = series.consts.states,
            formatHelper = DX.formatHelper,
            BasePoint = series.BasePoint;
        var BubblePoint = BasePoint.inherit({
                ctor: function(data) {
                    this.callBase(data);
                    this.size = this.initialSize = data.size;
                    this.labelFormatObject.size = this.initialSize
                },
                correctCoordinates: function(radius) {
                    this.bubbleSize = radius
                },
                drawMarker: function(renderer, group, animationEnabled) {
                    if (!this.hasValue())
                        return;
                    var marker = renderer.createCircle(this.x, this.y, this.bubbleSize, this.options.attributes).append(group);
                    this.graphic = marker;
                    this._checkState();
                    if (animationEnabled)
                        this.graphic.applySettings({
                            scale: {
                                x: 0.01,
                                y: 0.01
                            },
                            translateX: this.x,
                            translateY: this.y
                        })
                },
                drawTrackerMarker: function(renderer, trackerGroup) {
                    if (!this.hasValue())
                        return;
                    var point = this,
                        options = point.options,
                        trackerCircle = renderer.createCircle(point.x, point.y, point.bubbleSize, point._trackerAttrs);
                    trackerCircle.append(trackerGroup);
                    trackerCircle.data({point: this})
                },
                getTooltipCoords: function() {
                    if (this.graphic)
                        return {
                                x: this.x,
                                y: this.y,
                                offset: 0
                            }
                },
                correctLabelPosition: function() {
                    if (this.options.label.position === 'outside')
                        this.callBase();
                    else {
                        var bbox = this.insideLabelGroup.getBBox(),
                            bboxgraphic = this.graphic ? this.graphic.getBBox() : {
                                x: this.x,
                                y: this.y,
                                height: 0,
                                width: 0
                            },
                            x = 0,
                            y = 0;
                        if (bboxgraphic.isEmpty)
                            bboxgraphic = {
                                x: this.x,
                                y: this.y,
                                height: 0,
                                width: 0
                            };
                        y += bboxgraphic.y + bboxgraphic.height / 2 - bbox.y - bbox.height / 2;
                        x += this.options.label.horizontalOffset;
                        y += this.options.label.verticalOffset;
                        this.checkLabelPosition({
                            x: bbox.x + x,
                            y: bbox.y + y,
                            height: bbox.height,
                            width: bbox.width
                        }, x, y)
                    }
                },
                applyNormalStyle: function() {
                    if (this.graphic) {
                        var normal = $.extend(true, {}, this.options.states.normal);
                        delete normal.opacity;
                        this.graphic.applySettings(normal)
                    }
                    return this
                },
                animate: function(complete) {
                    if (!this.graphic) {
                        complete && complete();
                        return
                    }
                    this.graphic.animate({
                        scale: {
                            x: 1,
                            y: 1
                        },
                        translate: {
                            x: 0,
                            y: 0
                        }
                    }, {}, complete)
                }
            });
        series.BubblePoint = BubblePoint
    })(jQuery, DevExpress);
    /*! Module viz-core, file pointFactory.js */
    (function($, DX) {
        var series = DX.viz.charts.series;
        series.pointFactory = {createPoint: function(seriesType, pointOptions) {
                seriesType = (seriesType || '').toLowerCase();
                switch (seriesType) {
                    case'line':
                        return new series.BasePoint(pointOptions);
                    case'stackedline':
                        return new series.BasePoint(pointOptions);
                    case'fullstackedline':
                        return new series.BasePoint(pointOptions);
                    case'area':
                        return new series.BasePoint(pointOptions);
                    case'stackedarea':
                        return new series.BasePoint(pointOptions);
                    case'fullstackedarea':
                        return new series.BasePoint(pointOptions);
                    case'bar':
                        return new series.BarPoint(pointOptions);
                    case'stackedbar':
                        return new series.BarPoint(pointOptions);
                    case'fullstackedbar':
                        return new series.BarPoint(pointOptions);
                    case'spline':
                        return new series.BasePoint(pointOptions);
                    case'splinearea':
                        return new series.BasePoint(pointOptions);
                    case'scatter':
                        return new series.BasePoint(pointOptions);
                    case'candlestick':
                        return new series.OhlcPoint(pointOptions);
                    case'stock':
                        return new series.StockPoint(pointOptions);
                    case'rangearea':
                        return new series.RangePoint(pointOptions);
                    case'rangesplinearea':
                        return new series.RangePoint(pointOptions);
                    case'rangebar':
                        return new series.RangeBarPoint(pointOptions);
                    case'pie':
                        return new series.PiePoint(pointOptions);
                    case'doughnut':
                        return new series.PiePoint(pointOptions);
                    case'stepline':
                        return new series.BasePoint(pointOptions);
                    case'steparea':
                        return new series.BasePoint(pointOptions);
                    case'bubble':
                        return new series.BubblePoint(pointOptions);
                    default:
                        return null
                }
            }}
    })(jQuery, DevExpress);
    /*! Module viz-core, file baseSeries.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            eventsConsts = series.consts.events,
            statesConsts = series.consts.states,
            utils = DX.utils,
            core = DX.viz.core,
            ParseUtils = core.ParseUtils,
            SERIES_VALUE_MARGIN_PRIORITY = 20,
            FULLSTACKED_SERIES_VALUE_MARGIN_PRIORITY = 15,
            SERIES_LABEL_VALUE_MARGIN = 0.3,
            ALL_SERIES_POINTS_MODE = 'allseriespoints',
            INCLUDE_POINTS_MODE = 'includepoints',
            HOVER_CHECK = 0,
            SELECTION_CHECK = 1,
            BAR_ZERO_VALUE_MARGIN_PRIORITY = 20;
        series.BaseSeries = DX.Class.inherit({
            ctor: function(renderer, options, isRangeSeries) {
                var _this = this;
                _this.type = options.specificType || 'unknown';
                _this.isRangeSeries = isRangeSeries;
                _this.renderer = renderer;
                _this.isIE8 = DX.browser.msie && DX.browser.version < 9;
                _this.points = [];
                _this.originalPoints = [];
                _this._parseOptions(options);
                _this._parsedUserOptions = $.extend(true, {}, options);
                _this.userOptions = options;
                _this.tag = options.tag
            },
            dispose: function() {
                var _this = this;
                _this.off();
                $.each(_this.points || [], function(_, point) {
                    point.dispose()
                });
                _this.points = null;
                $.each(_this.trackerElements || [], function(_, tracker) {
                    tracker.removeData()
                });
                _this.trackerElements = null;
                _this.hoverPattern = null;
                _this.selectedPattern = null;
                _this.seriesGroup = null;
                _this.pointsByArgument = null;
                _this.segments = null;
                _this.preparedSegments = null;
                _this.renderer = null;
                _this._rawData = null;
                _this._parsedUserOptions = null;
                _this.options = null;
                _this.userOptions = null;
                _this.tag = null;
                _this.rangeData = null;
                _this.translator = null;
                _this.styles = null;
                _this.legend = null;
                if (_this.markerPatterns) {
                    $.each(_this.markerPatterns, function(_, p) {
                        p.dispose && p.dispose()
                    });
                    _this.markerPatterns = null
                }
            },
            getRangeData: function(visibleRange, calcInterval) {
                var self = this,
                    options = self.options,
                    argumentCategories = options.argumentCategories,
                    discreteArgumentAxis = options.argumentAxisType === 'discrete',
                    argumentType = options.argumentType,
                    valueCategories = options.valueCategories,
                    discreteValueAxis = options.valueAxisType === 'discrete',
                    valueType = options.valueType,
                    rangeData = {
                        visibleValCategories: [],
                        categoriesVal: [],
                        categoriesArg: []
                    },
                    points = self.points,
                    pointsLength = points && points.length,
                    lastVisibleIndex,
                    intervalVal,
                    intervalArg;
                function addToVisibleVal(val) {
                    if (discreteValueAxis) {
                        if ($.inArray(val, rangeData.visibleValCategories) === -1)
                            rangeData.visibleValCategories.push(val)
                    }
                    else {
                        if (val < rangeData.minVisibleVal || !utils.isDefined(rangeData.minVisibleVal))
                            rangeData.minVisibleVal = val;
                        if (val > rangeData.maxVisibleVal || !utils.isDefined(rangeData.maxVisibleVal))
                            rangeData.maxVisibleVal = val
                    }
                }
                var processArgument = function(arg, prevArg) {
                        var interval;
                        if (arg < rangeData.minArg || !utils.isDefined(rangeData.minArg))
                            rangeData.minArg = arg;
                        if (arg > rangeData.maxArg || !utils.isDefined(rangeData.maxArg))
                            rangeData.maxArg = arg;
                        if (utils.isDefined(prevArg))
                            interval = Math.abs(calcInterval ? calcInterval(arg, prevArg) : arg - prevArg);
                        if (utils.isDefined(interval) && (interval < rangeData.minIntervalArg || !utils.isDefined(rangeData.minIntervalArg)))
                            rangeData.minIntervalArg = interval
                    };
                var processValue = function(val, minVal, prevVal, prevMinVal) {
                        var interval;
                        if (val < rangeData.minVal || !utils.isDefined(rangeData.minVal))
                            rangeData.minVal = val;
                        if (val > rangeData.maxVal || !utils.isDefined(rangeData.maxVal))
                            rangeData.maxVal = val;
                        if (self.isRangeSeries) {
                            if (minVal < rangeData.minVal || !utils.isDefined(rangeData.minVal))
                                rangeData.minVal = minVal;
                            if (minVal > rangeData.maxVal || !utils.isDefined(rangeData.maxVal))
                                rangeData.maxVal = minVal
                        }
                        if (utils.isDefined(prevVal))
                            interval = Math.abs(val - prevVal);
                        if (self.isRangeSeries && utils.isDefined(prevMinVal))
                            interval = Math.min(interval, Math.abs(minVal - prevMinVal));
                        if (utils.isDefined(interval) && (interval < rangeData.minIntervalVal || !utils.isDefined(rangeData.minIntervalVal)))
                            rangeData.minIntervalVal = interval
                    };
                function unique(array, field) {
                    var values = {};
                    return $.map(array, function(item) {
                            var value = item[field];
                            var result = !values[value] ? value : null;
                            values[value] = true;
                            return result
                        })
                }
                if (discreteArgumentAxis) {
                    rangeData.categoriesArg = unique(points, 'argument');
                    processArgument = $.noop
                }
                if (discreteValueAxis) {
                    rangeData.categoriesVal = unique(points, 'value');
                    processValue = $.noop
                }
                if (pointsLength) {
                    $.each(points, function(i, point) {
                        var prevPoint,
                            val = point.value,
                            minVal = point.minValue,
                            arg = point.argument,
                            prevVal,
                            prevMinVal,
                            prevArg;
                        if (i !== 0) {
                            prevPoint = points[i - 1];
                            prevVal = prevPoint.value;
                            prevMinVal = prevPoint.minValue;
                            prevArg = prevPoint.argument
                        }
                        if (point.hasValue())
                            processValue(val, minVal, prevVal, prevMinVal);
                        processArgument(arg, prevArg);
                        if (discreteArgumentAxis || !visibleRange || arg < visibleRange.minArg || arg > visibleRange.maxArg)
                            return;
                        if (!utils.isDefined(rangeData.minVisibleVal) && i)
                            if (prevPoint.hasValue()) {
                                addToVisibleVal(prevVal);
                                if (self.isRangeSeries)
                                    addToVisibleVal(prevMinVal)
                            }
                        if (point.hasValue()) {
                            lastVisibleIndex = i;
                            addToVisibleVal(val);
                            if (self.isRangeSeries)
                                addToVisibleVal(minVal)
                        }
                    });
                    if (utils.isDefined(lastVisibleIndex) && lastVisibleIndex < pointsLength - 1)
                        if (points[lastVisibleIndex + 1].hasValue()) {
                            addToVisibleVal(points[lastVisibleIndex + 1].value);
                            if (self.isRangeSeries)
                                addToVisibleVal(points[lastVisibleIndex + 1].minValue)
                        }
                    if (!self.options.rotated) {
                        if (utils.isDefined(rangeData.minVal)) {
                            rangeData.minY = rangeData.minVal;
                            rangeData.maxY = rangeData.maxVal;
                            rangeData.intervalY = undefined
                        }
                        if (utils.isDefined(rangeData.minArg)) {
                            rangeData.minX = rangeData.minArg;
                            rangeData.maxX = rangeData.maxArg;
                            rangeData.intervalX = rangeData.minIntervalArg
                        }
                        if (rangeData.categoriesArg.length)
                            rangeData.categoriesX = rangeData.categoriesArg.slice(0);
                        if (rangeData.categoriesVal.length)
                            rangeData.categoriesY = rangeData.categoriesVal.slice(0);
                        if (rangeData.visibleValCategories.length)
                            rangeData.visibleCategoriesY = rangeData.visibleValCategories.slice(0);
                        rangeData.minVisibleY = rangeData.minVisibleVal;
                        rangeData.maxVisibleY = rangeData.maxVisibleVal
                    }
                    else {
                        if (utils.isDefined(rangeData.minVal)) {
                            rangeData.minX = rangeData.minVal;
                            rangeData.maxX = rangeData.maxVal;
                            rangeData.intervalX = undefined
                        }
                        if (utils.isDefined(rangeData.minArg)) {
                            rangeData.minY = rangeData.minArg;
                            rangeData.maxY = rangeData.maxArg;
                            rangeData.intervalY = rangeData.minIntervalArg
                        }
                        if (rangeData.categoriesArg.length)
                            rangeData.categoriesY = rangeData.categoriesArg.slice(0);
                        if (rangeData.categoriesVal.length)
                            rangeData.categoriesX = rangeData.categoriesVal.slice(0);
                        if (rangeData.visibleValCategories.length)
                            rangeData.visibleCategoriesX = rangeData.visibleValCategories.slice(0);
                        rangeData.minVisibleX = rangeData.minVisibleVal;
                        rangeData.maxVisibleX = rangeData.maxVisibleVal
                    }
                }
                delete rangeData.minArg;
                delete rangeData.maxArg;
                delete rangeData.minVal;
                delete rangeData.maxVal;
                delete rangeData.minIntervalArg;
                delete rangeData.minIntervalVal;
                delete rangeData.minVisibleVal;
                delete rangeData.maxVisibleVal;
                delete rangeData.visibleValCategories;
                delete rangeData.categoriesArg;
                delete rangeData.categoriesVal;
                rangeData = this.addLabelPaddingsToRange(rangeData);
                rangeData = this.processRangeForFullStackedSeries(rangeData);
                this.rangeData = rangeData;
                rangeData = this.getRangeMinValue(rangeData);
                return rangeData
            },
            getRangeMinValue: function(range) {
                if (this.type.slice(-3) === "bar" || this.type.slice(-4) === "area") {
                    if (!range)
                        return range;
                    if (this.isRangeSeries)
                        return range;
                    if (!this.options.rotated)
                        range.keepValueMarginsX = true;
                    else
                        range.keepValueMarginsY = true;
                    if (range.minY !== undefined && !this.options.rotated && this.options.valueAxisType !== 'logarithmic') {
                        range.minY = range.minY > 0 ? 0 : range.minY;
                        this.setZeroPadding(range, range.minY, 'minValueMarginY');
                        range.maxY = range.maxY < 0 ? 0 : range.maxY;
                        if (range.maxY === 0 || range.maxY > 0 && range.minY < 0) {
                            range.minValueMarginY = range.maxValueMarginY;
                            range.minValueMarginYPriority = range.maxValueMarginYPriority
                        }
                        this.setZeroPadding(range, range.maxY, 'maxValueMarginY')
                    }
                    else if (range.minX !== undefined && this.options.rotated && this.options.valueAxisType !== 'logarithmic') {
                        range.minX = range.minX > 0 ? 0 : range.minX;
                        this.setZeroPadding(range, range.minX, 'minValueMarginX');
                        range.maxX = range.maxX < 0 ? 0 : range.maxX;
                        if (range.maxX === 0 || range.maxX > 0 && range.minX < 0) {
                            range.minValueMarginX = range.maxValueMarginX;
                            range.minValueMarginXPriority = range.maxValueMarginXPriority
                        }
                        this.setZeroPadding(range, range.maxX, 'maxValueMarginX')
                    }
                }
                return range
            },
            setZeroPadding: function(range, val, prefix) {
                if (val === 0)
                    this.setPadding(range, prefix, 0, BAR_ZERO_VALUE_MARGIN_PRIORITY)
            },
            setPadding: function(range, prefix, val, priority) {
                range[prefix] = val;
                range[prefix + 'Priority'] = priority
            },
            addLabelPaddingsToRange: function(rangeData) {
                var series = this;
                if (series.areLabelsVisible() && series.styles.point.label.position !== 'inside')
                    if (!series.options.rotated) {
                        this.setPadding(rangeData, 'maxValueMarginY', SERIES_LABEL_VALUE_MARGIN, SERIES_VALUE_MARGIN_PRIORITY);
                        if (series.isRangeSeries)
                            this.setPadding(rangeData, 'minValueMarginY', SERIES_LABEL_VALUE_MARGIN, SERIES_VALUE_MARGIN_PRIORITY)
                    }
                    else {
                        this.setPadding(rangeData, 'maxValueMarginX', SERIES_LABEL_VALUE_MARGIN, SERIES_VALUE_MARGIN_PRIORITY);
                        if (series.isRangeSeries)
                            this.setPadding(rangeData, 'minValueMarginX', SERIES_LABEL_VALUE_MARGIN, SERIES_VALUE_MARGIN_PRIORITY)
                    }
                return rangeData
            },
            isFullStackedSeries: function() {
                return this.type.indexOf('fullstacked') === 0
            },
            isStackedSeries: function() {
                return this.type.indexOf('stacked') === 0
            },
            processRangeForFullStackedSeries: function(rangeData) {
                var self = this,
                    indentName,
                    isRangeEmpty = $.isEmptyObject(rangeData);
                if (self.isFullStackedSeries())
                    if (!self.options.rotated) {
                        self.setPadding(rangeData, 'minValueMarginY', 0, FULLSTACKED_SERIES_VALUE_MARGIN_PRIORITY);
                        self.setPadding(rangeData, 'maxValueMarginY', 0, FULLSTACKED_SERIES_VALUE_MARGIN_PRIORITY);
                        !isRangeEmpty && (rangeData.minY = 0)
                    }
                    else {
                        self.setPadding(rangeData, 'minValueMarginX', 0, FULLSTACKED_SERIES_VALUE_MARGIN_PRIORITY);
                        self.setPadding(rangeData, 'maxValueMarginX', 0, FULLSTACKED_SERIES_VALUE_MARGIN_PRIORITY);
                        !isRangeEmpty && (rangeData.minX = 0)
                    }
                return rangeData
            },
            _applyClippings: function(seriesElementsOptions, seriesMarkersOptions, labelsGroupOptions) {
                if (this.paneClipRectID) {
                    seriesElementsOptions.clipId = this.paneClipRectID;
                    labelsGroupOptions.clipId = this.paneClipRectID;
                    if (this.forceClipping)
                        seriesMarkersOptions.clipId = this.paneClipRectID
                }
            },
            _applyTrackersClippings: function() {
                var _this = this,
                    options = _this.options;
                if (_this.paneClipRectID) {
                    options.seriesTrackerGroup.applySettings({clipId: _this.paneClipRectID});
                    if (_this.forceClipping)
                        options.markerTrackerGroup.applySettings({clipId: _this.paneClipRectID})
                }
            },
            _drawTrackersForSegment: function(index, segment) {
                this.drawPointTrackers(segment)
            },
            drawTrackers: function() {
                var _this = this;
                if (!_this.segments)
                    return;
                _this.trackerElements = [];
                $.each(_this.segments, function(index, segment) {
                    _this._drawTrackersForSegment(index, segment)
                });
                _this._applyTrackersClippings()
            },
            draw: function(translator, animationEnabled) {
                var seriesContainerOptions = {'class': 'dxc-series'},
                    seriesElementsOptions = {'class': 'dxc-elements'},
                    seriesMarkersOptions = $.extend({'class': 'dxc-markers'}, this.styles.point.states.normal),
                    labelsGroupOptions = {'class': 'dxc-series-labels'},
                    seriesElementsGroup,
                    seriesMarkersGroup,
                    labelsGroup;
                if (!translator) {
                    throw new Error('Translator was not initialized before call Series Draw()');
                    return
                }
                this.translator = translator;
                this._translateCoors();
                this._applyClippings(seriesElementsOptions, seriesMarkersOptions, labelsGroupOptions);
                if (!this.seriesGroup)
                    this.seriesGroup = this.renderer.createGroup(seriesContainerOptions);
                else
                    this.seriesGroup.clear();
                seriesElementsGroup = this.renderer.createGroup(seriesElementsOptions).append(this.seriesGroup);
                seriesMarkersGroup = this.renderer.createGroup(seriesMarkersOptions).append(this.seriesGroup);
                this.seriesGroup.append(this.options.seriesGroup);
                labelsGroup = this.renderer.createGroup(labelsGroupOptions).append(this.options.seriesLabelsGroup);
                this.createPatterns();
                this.drawSeriesData(seriesElementsGroup, seriesMarkersGroup, labelsGroup, animationEnabled);
                if (this.isSelected())
                    this.setSelectedState(this.lastSelectionMode);
                else if (this.isHovered())
                    this.setHoverState(this.lastHoverdMode);
                else
                    this.fullState = statesConsts.normalMark;
                return this
            },
            createPatterns: function() {
                var self = this,
                    hover = self.styles.states.hover,
                    selected = self.styles.states.selected;
                if (!self.hoverPatternColor) {
                    self.hoverPatternColor = hover.fill;
                    self.selectedPatternColor = selected.fill
                }
                if (!self.hoverPattern) {
                    self.hoverPattern = self.renderer.createPattern(self.hoverPatternColor, hover.hatching);
                    self.selectedPattern = self.renderer.createPattern(self.selectedPatternColor, selected.hatching)
                }
                self.hoverPattern.append();
                self.selectedPattern.append();
                self.styles.pointStyles = self.styles.pointStyles || [];
                $.each(self.styles.pointStyles, function(_, style) {
                    if (style) {
                        var pointHover = style.states.hover,
                            pointSelected = style.states.selected;
                        if (!style.hoverPatternColor) {
                            style.hoverPatternColor = pointHover.fill;
                            style.selectedPatternColor = pointSelected.fill
                        }
                        if (!style.hoverPattern) {
                            style.hoverPattern = self.renderer.createPattern(style.hoverPatternColor, pointHover.hatching);
                            style.selectedPattern = self.renderer.createPattern(style.selectedPatternColor, pointSelected.hatching)
                        }
                        style.hoverPattern.append();
                        style.selectedPattern.append()
                    }
                })
            },
            areLabelsVisible: function() {
                var series = this;
                return series.styles.point.label.visible && (!utils.isDefined(series.styles.maxLabelCount) || series.points.length <= series.styles.maxLabelCount)
            },
            getPoints: function() {
                return this.points
            },
            getOriginalPoints: function() {
                return this.originalPoints
            },
            getValueFields: function() {
                var _this = this;
                return _this.isRangeSeries ? [_this.options.rangeValue1Field, _this.options.rangeValue2Field] : [_this.options.valueField]
            },
            getTeamplatedFields: function() {
                var _this = this,
                    fields = this.getValueFields(),
                    teampleteFields = [];
                fields.push(this.getTagField());
                $.each(fields, function(_, field) {
                    var fieldsObject = {};
                    fieldsObject.teamplateField = field + _this.name;
                    fieldsObject.originalField = field;
                    teampleteFields.push(fieldsObject)
                });
                return teampleteFields
            },
            getArgumentField: function() {
                return this.options.argumentField
            },
            getTagField: function() {
                return this.options.tagField
            },
            updateTeamplateFieldNames: function() {
                var _this = this;
                if (_this.isRangeSeries) {
                    _this.options.rangeValue1Field = _this.options.rangeValue1Field + _this.name;
                    _this.options.rangeValue2Field = _this.options.rangeValue2Field + _this.name
                }
                else
                    _this.options.valueField = _this.options.valueField + _this.name;
                _this.options.tagField = _this.options.tagField + _this.name
            },
            _updateDataType: function(options) {
                var _this = this;
                _this.options.argumentType = options.argumentType;
                _this.options.valueType = options.valueType;
                _this.options.argumentAxisType = options.argumentAxisType;
                _this.options.valueAxisType = options.valueAxisType
            },
            select: function() {
                this.options.seriesGroup && this.options.seriesGroup.trigger(new $.Event(eventsConsts.selectSeries, {target: this}), this.options.selectionMode);
                this.seriesGroup && this.seriesGroup.toForeground();
                if (this.trackerElements && this.trackerElements.length)
                    $.each(this.trackerElements, function(_, element) {
                        element.toBackground()
                    })
            },
            clearSelection: function clearSelection() {
                this.options.seriesGroup && this.options.seriesGroup.trigger(new $.Event(eventsConsts.deselectSeries, {target: this}), this.options.selectionMode)
            },
            selectPoint: function(point) {
                this.options.seriesGroup && this.options.seriesGroup.trigger(new $.Event(eventsConsts.selectPoint), point)
            },
            deselectPoint: function(point) {
                this.options.seriesGroup && this.options.seriesGroup.trigger(new $.Event(eventsConsts.deselectPoint), point)
            },
            showPointTooltip: function(point) {
                this.options.seriesGroup && this.options.seriesGroup.trigger(new $.Event(eventsConsts.showPointTooltip), point)
            },
            hidePointTooltip: function(point) {
                this.options.seriesGroup && this.options.seriesGroup.trigger(new $.Event(eventsConsts.hidePointTooltip), point)
            },
            getAllPoints: function() {
                return this.originalPoints.slice()
            },
            getPointByPos: function(pos) {
                return this.points && this.points[pos]
            },
            getPointByArg: function(arg) {
                return this.pointsByArgument[arg.valueOf()] || null
            },
            on: function(events, data, handler) {
                $(this).on(events, data, handler);
                return this
            },
            off: function(events) {
                $(this).off(events);
                return this
            },
            setHoverState: function(mode) {
                this.fullState = this.fullState | statesConsts.hoverMark;
                mode = mode || this.options.hoverMode;
                this.lastHoverMode = mode;
                if (!this._checkBehavior(mode, HOVER_CHECK))
                    return;
                this.applyHoverStyle(mode);
                if (this.legend)
                    this.legend.applyHoverStyle(this)
            },
            releaseHoverState: function() {
                var mode = this.lastHoverMode || this.options.hoverMode;
                this.fullState = this.fullState & ~statesConsts.hoverMark;
                delete this.lastHoverMode;
                if (!this._checkBehavior(mode, HOVER_CHECK))
                    return;
                this.applyNormalStyle(mode);
                if (this.legend)
                    this.legend.applyNormalStyle(this)
            },
            setSelectedState: function(mode) {
                this.fullState = this.fullState | statesConsts.selectedMark;
                this.lastSelectionMode = mode;
                if (!this._checkBehavior(mode, SELECTION_CHECK))
                    return;
                if (this.lastHoverMode === ALL_SERIES_POINTS_MODE || this.lastHoverMode === INCLUDE_POINTS_MODE)
                    this.applyNormalStyle(INCLUDE_POINTS_MODE);
                mode = mode || this.options.selectionMode;
                this.applySelectionStyle(mode);
                if (this.legend)
                    this.legend.applySelectionStyle(this)
            },
            releaseSelectedState: function() {
                var mode = this.lastSelectionMode || this.options.selectionMode;
                this.fullState = this.fullState & ~statesConsts.selectedMark;
                if (!this._checkBehavior(mode, SELECTION_CHECK))
                    return;
                if (this.isHovered()) {
                    if ((mode === INCLUDE_POINTS_MODE || mode === ALL_SERIES_POINTS_MODE) && (this.lastHoverMode !== INCLUDE_POINTS_MODE || this.lastHoverMode === ALL_SERIES_POINTS_MODE)) {
                        this.applyNormalStyle(mode);
                        if (this.legend)
                            this.legend.applyNormalStyle(this)
                    }
                    this.applyHoverStyle(this.lastHoverMode);
                    if (this.legend)
                        this.legend.applyHoverStyle(this)
                }
                else {
                    this.applyNormalStyle(mode);
                    if (this.legend)
                        this.legend.applyNormalStyle(this)
                }
                delete this.lastSelectionMode
            },
            _checkBehavior: function(mode, behavior) {
                if (mode === 'none')
                    return false;
                switch (behavior) {
                    case HOVER_CHECK:
                        if (!this.isSelected() || this.options.selectionMode === 'none')
                            return true;
                        return false;
                    case SELECTION_CHECK:
                        return true
                }
                return false
            },
            setPointHoverState: function(point) {
                point.fullState = point.fullState | statesConsts.hoverMark;
                if (!(this.isSelected() && (this.lastSelectionMode === ALL_SERIES_POINTS_MODE || this.lastSelectionMode === INCLUDE_POINTS_MODE)) && !point.isSelected())
                    point.applyHoverStyle()
            },
            releasePointHoverState: function(point) {
                point.fullState = point.fullState & ~statesConsts.hoverMark;
                if (!(this.isSelected() && (this.lastSelectionMode === ALL_SERIES_POINTS_MODE || this.lastSelectionMode === INCLUDE_POINTS_MODE)) && !point.isSelected())
                    if (!(this.isHovered() && (this.lastSelectionMode === ALL_SERIES_POINTS_MODE || this.lastSelectionMode === INCLUDE_POINTS_MODE)))
                        point.applyNormalStyle()
            },
            setPointSelectedState: function(point) {
                point.fullState = point.fullState | statesConsts.selectedMark;
                point.applySelectionStyle()
            },
            releasePointSelectedState: function(point) {
                point.fullState = point.fullState & ~statesConsts.selectedMark;
                if (this.isHovered() && (this.lastHoverMode === ALL_SERIES_POINTS_MODE || this.lastHoverMode === INCLUDE_POINTS_MODE) || point.isHovered())
                    point.applyHoverStyle();
                else if (this.isSelected() && (this.lastSelectionMode === ALL_SERIES_POINTS_MODE || this.lastSelectionMode === INCLUDE_POINTS_MODE))
                    point.applySelectionStyle();
                else
                    point.applyNormalStyle()
            },
            isHovered: function() {
                return !!(this.fullState & statesConsts.hoverMark)
            },
            isSelected: function() {
                return !!(this.fullState & statesConsts.selectedMark)
            },
            _translateCoors: function() {
                var series = this;
                var tr = series.translator;
                $.each(series.points, function(i, p) {
                    p.translate(tr)
                })
            },
            _getTicksForAggregation: function(min, max, screenDelta, pointSize) {
                return core.tickProvider.getTicks({
                        min: min,
                        max: max,
                        screenDelta: screenDelta,
                        gridSpacingFactor: pointSize
                    })
            },
            getStackName: function() {
                if (this.type === 'stackedbar' || this.type === 'fullstackedbar')
                    return this.stackName;
                return null
            },
            resamplePoints: function(translator, min, max) {
                var _this = this,
                    minI,
                    maxI,
                    i;
                if (!_this.getOriginalPoints().length)
                    return;
                $.each(_this.getOriginalPoints(), function(i, point) {
                    minI = point.argument - min <= 0 ? i : minI;
                    if (!maxI)
                        maxI = point.argument - max > 0 ? i : null
                });
                minI = minI ? minI : 1;
                maxI = utils.isDefined(maxI) ? maxI : _this.getOriginalPoints().length - 1;
                min = _this.getOriginalPoints()[minI - 1].argument;
                max = _this.getOriginalPoints()[maxI].argument;
                _this.translator = translator;
                var sizePoint = _this._getPointSize(),
                    ticks;
                if (_this.options.argumentAxisType !== 'discrete' && _this.options.valueAxisType !== 'discrete')
                    ticks = _this._getTicksForAggregation(min, max, _this.translator.width, sizePoint);
                else
                    ticks = _this.translator.width / sizePoint;
                _this.points = _this._resample(ticks, ticks.tickInterval);
                _this._segmentPoints()
            },
            reinitData: function(data) {
                var self = this,
                    createPoint = series.pointFactory.createPoint,
                    rotated = self.options.rotated,
                    pointStyle,
                    i,
                    curPoint,
                    point,
                    valueField,
                    rangeValue1Field,
                    rangeValue2Field,
                    options = self.options,
                    argumentField = options.argumentField,
                    tagField = options.tagField,
                    customizePoint = self.options.customizePoint;
                self.styles.pointStyles = [];
                if (data && data.length)
                    self._canRenderCompleteHandle = true;
                self.pointsByArgument = {};
                self.segments = [];
                self.points = [];
                if (!data)
                    return;
                if (!self.isRangeSeries) {
                    valueField = options.valueField || 'val';
                    for (i = 0; i < data.length; i++) {
                        curPoint = data[i];
                        if (curPoint[argumentField] === null || curPoint[argumentField] === undefined || curPoint[valueField] === undefined)
                            continue;
                        pointStyle = self._getPointStyle(self.styles.point, i, curPoint[argumentField], curPoint[valueField], undefined, curPoint[tagField]);
                        point = createPoint(self.type, {
                            value: curPoint[valueField],
                            argument: curPoint[argumentField],
                            originalValue: curPoint['original' + valueField],
                            originalArgument: curPoint['original' + argumentField],
                            rotated: rotated,
                            options: pointStyle,
                            tag: curPoint[tagField],
                            series: self
                        });
                        self.points.push(point);
                        self.pointsByArgument[point.argument.valueOf()] = self.pointsByArgument[point.argument.valueOf()] || point
                    }
                }
                else {
                    rangeValue1Field = options.rangeValue1Field || 'val1';
                    rangeValue2Field = options.rangeValue2Field || 'val2';
                    for (i = 0; i < data.length; i++) {
                        curPoint = data[i];
                        if (curPoint[argumentField] === null || curPoint[argumentField] === undefined || curPoint[rangeValue1Field] === undefined || curPoint[rangeValue2Field] === undefined)
                            continue;
                        pointStyle = self._getPointStyle(self.styles.point, i, curPoint[argumentField], curPoint[rangeValue1Field], curPoint[rangeValue2Field], curPoint[tagField]);
                        point = createPoint(self.type, {
                            minValue: curPoint[rangeValue1Field],
                            value: curPoint[rangeValue2Field],
                            argument: curPoint[argumentField],
                            originalMinValue: curPoint['original' + rangeValue1Field],
                            originalValue: curPoint['original' + rangeValue2Field],
                            originalArgument: curPoint['original' + argumentField],
                            rotated: rotated,
                            options: pointStyle,
                            tag: curPoint[tagField],
                            series: self
                        });
                        self.pointsByArgument[point.argument.valueOf()] = self.pointsByArgument[point.argument.valueOf()] || point;
                        self.points.push(point)
                    }
                }
                self.originalPoints = self.points;
                self._segmentPoints()
            },
            _preparePointStyle: function(options) {
                var self = this,
                    type = self.type,
                    defaultPointOptions = self.userOptions.point,
                    defaultPointStyle = self.styles.point,
                    isBar = ~type.indexOf('bar'),
                    style,
                    mainColor = options.color && new DX.Color(options.color),
                    func;
                options.border = options.border || {};
                options.border.color = options.border.color || options.color;
                options.hoverStyle = options.hoverStyle || {};
                options.hoverStyle.color = options.hoverStyle.color || self.isIE8 && mainColor && mainColor.highlight(20) || isBar && options.color || undefined;
                options.hoverStyle.border = options.hoverStyle.border || {};
                options.hoverStyle.border.color = options.hoverStyle.border.color || options.color;
                options.selectionStyle = options.selectionStyle || {};
                options.selectionStyle.color = options.selectionStyle.color || self.isIE8 && mainColor && mainColor.highlight(20) || isBar && options.color || undefined;
                options.selectionStyle.border = options.selectionStyle.border || {};
                options.selectionStyle.border.color = options.selectionStyle.border.color || options.color;
                options = $.extend(true, {}, defaultPointOptions, options);
                style = self._parsePointStyleOptions(options, type);
                style.attributes.inh = false;
                style.label = $.extend(true, {}, self.styles.point.label);
                if (isBar) {
                    func = function(mode) {
                        if (!mode)
                            return false;
                        switch (mode.toLowerCase()) {
                            case"allseriespoints":
                            case"allargumentpoints":
                            case"none":
                                return true
                        }
                    };
                    style.attributes = $.extend(true, {}, defaultPointStyle.attributes, style.attributes);
                    style.states.normal = $.extend(true, {}, defaultPointStyle.states.normal, style.states.normal);
                    style.states.hover = $.extend(true, {}, defaultPointStyle.states.hover, style.states.hover);
                    style.states.selected = $.extend(true, {}, defaultPointStyle.states.selected, style.states.selected);
                    style.attributes.r = style.states.normal.r = style.states.hover.r = style.states.selected.r = defaultPointStyle.attributes.r;
                    style.hoverMode = func(self.options.hoverMode) && self.options.hoverMode;
                    style.selectionMode = func(self.options.selectionMode) && self.options.selectionMode;
                    style.visible = true
                }
                return style
            },
            _getPointStyle: function(seriesPointStyle, index, argument, value1, value2, tag) {
                var self = this,
                    customizePointObject,
                    currentPointOptions,
                    currentPointStyle,
                    customizePoint = self.options.customizePoint;
                customizePointObject = {
                    index: index,
                    argument: argument,
                    seriesName: self.name,
                    tag: tag
                };
                if (value2) {
                    customizePointObject.rangeValue1 = value1;
                    customizePointObject.rangeValue2 = value2
                }
                else
                    customizePointObject.value = value1;
                currentPointOptions = customizePoint ? customizePoint.call(customizePointObject, customizePointObject) : {};
                if (!$.isEmptyObject(currentPointOptions)) {
                    currentPointStyle = self._preparePointStyle(currentPointOptions);
                    self.styles.pointStyles.push(currentPointStyle);
                    return currentPointStyle
                }
                else
                    return seriesPointStyle
            },
            _segmentPoints: function() {
                var _this = this,
                    segment = [];
                _this.segments = [];
                $.each(_this.points, function(_, point) {
                    if (point.hasValue())
                        segment.push(point);
                    else if (segment.length !== 0) {
                        _this.segments.push(segment);
                        segment = []
                    }
                });
                if (segment.length)
                    _this.segments.push(segment)
            },
            _parseOptions: function(options) {
                this.options = {
                    incidentOccured: options.incidentOccured,
                    rotated: !!options.rotated,
                    seriesGroup: options.seriesGroup,
                    seriesLabelsGroup: options.seriesLabelsGroup,
                    seriesTrackerGroup: options.seriesTrackerGroup,
                    markerTrackerGroup: options.markerTrackerGroup,
                    argumentCategories: options.argumentCategories,
                    argumentAxisType: options.argumentAxisType,
                    argumentType: options.argumentType,
                    argumentField: options.specificType === 'candlestick' || options.specificType === 'stock' ? options.argumentField || 'date' : options.argumentField || 'arg',
                    valueCategories: options.valueCategories,
                    valueAxisType: options.valueAxisType,
                    valueType: options.valueType,
                    valueField: options.valueField || 'val',
                    rangeValue1Field: options.rangeValue1Field || 'val1',
                    rangeValue2Field: options.rangeValue2Field || 'val2',
                    tagField: options.tagField || 'tag',
                    sizeField: options.sizeField || 'size',
                    openValueField: options.openValueField || 'open',
                    closeValueField: options.closeValueField || 'close',
                    highValueField: options.highValueField || 'high',
                    lowValueField: options.lowValueField || 'low',
                    selectionMode: (options.selectionMode || '').toLowerCase(),
                    hoverMode: (options.hoverMode || '').toLowerCase(),
                    showInLegend: options.showInLegend !== undefined ? options.showInLegend : true,
                    customizePoint: $.isFunction(options.customizePoint) ? options.customizePoint : undefined
                };
                if (!$.isFunction(this.options.incidentOccured))
                    this.options.incidentOccured = $.noop;
                this.name = options.name;
                this.axis = options.axis;
                this.pane = options.pane;
                this.styles = this.parseStyleOptions(options);
                if (this.adjustOptions)
                    this.adjustOptions()
            },
            _createPointState: function(options, needInh, needHatching) {
                var border = options.border,
                    state = {
                        strokeWidth: border.visible ? border.width || 0 : 0,
                        stroke: border.visible && border.width ? border.color : 'none',
                        fill: options.color,
                        r: options.size + (border.visible && options.size !== 0 ? ~~(border.width / 2) || 0 : 0)
                    };
                if (needInh)
                    state.inh = true;
                if (needHatching) {
                    state.hatching = {};
                    state.hatching = {
                        direction: options.hatching && options.hatching.direction,
                        width: options.hatching && options.hatching.width,
                        step: options.hatching && options.hatching.step,
                        opacity: options.hatching && options.hatching.opacity
                    }
                }
                return state
            },
            _createSeriesState: function(options, needRadius, needHatching, dashStyle) {
                var border = options.border,
                    state = {
                        strokeWidth: border.visible ? border.width || 0 : 0,
                        stroke: border.visible && border.width ? border.color : 'none',
                        fill: options.color,
                        dashStyle: options.dashStyle || dashStyle,
                        lineWidth: options.width,
                        opacity: options.opacity
                    };
                if (needRadius)
                    state.r = options.cornerRadius;
                if (needHatching) {
                    state.hatching = {};
                    state.hatching = {
                        direction: options.hatching.direction,
                        width: options.hatching.width,
                        step: options.hatching.step,
                        opacity: options.hatching.opacity
                    }
                }
                return state
            },
            _parsePointStyleOptions: function(options, type) {
                var isBar = type && ~type.indexOf('bar'),
                    pointNormalState = this._createPointState(options, true),
                    pointHoverState = this._createPointState(options.hoverStyle, false, isBar),
                    pointSelectedState = this._createPointState(options.selectionStyle, false, isBar),
                    pointAttr = {},
                    pointAttributes;
                $.each(['align', 'translateX', 'translateY', 'rotate', 'linejoin', 'linecap', 'style'], function(i, val) {
                    if (val in options)
                        pointAttr[val] = options[val]
                });
                pointAttributes = $.extend(true, {}, pointNormalState, pointAttr);
                return {
                        visible: options.visible,
                        symbol: options.symbol,
                        image: options.image,
                        attributes: pointAttributes,
                        seriesName: options.seriesName,
                        selectionMode: (options.selectionMode || '').toLowerCase(),
                        hoverMode: (options.hoverMode || '').toLowerCase(),
                        states: {
                            normal: pointNormalState,
                            hover: pointHoverState,
                            selected: pointSelectedState
                        }
                    }
            },
            _parseLabelStyleOptions: function(options) {
                var labelOptions = options.label,
                    labelFont = labelOptions.font,
                    labelBorder = labelOptions.border,
                    labelConnector = labelOptions.connector,
                    labelAttributes = {
                        align: labelOptions.alignment,
                        font: {
                            color: labelOptions.backgroundColor === 'none' && labelFont.color.toLowerCase() === '#ffffff' && labelOptions.position !== 'inside' ? options.color : labelFont.color,
                            family: labelFont.family,
                            weight: labelFont.weight,
                            size: labelFont.size,
                            opacity: labelFont.opacity
                        },
                        style: labelOptions.style
                    },
                    backgroundAttr = {
                        fill: labelOptions.backgroundColor || options.color,
                        strokeWidth: labelBorder.visible ? labelBorder.width || 0 : 0,
                        stroke: labelBorder.visible && labelBorder.width ? labelBorder.color : 'none',
                        dashStyle: labelBorder.dashStyle
                    },
                    connectorAttr = {
                        stroke: labelConnector.visible && labelConnector.width ? labelConnector.color || options.color : 'none',
                        strokeWidth: labelConnector.visible ? labelConnector.width || 0 : 0
                    };
                return {
                        format: labelOptions.format,
                        argumentFormat: labelOptions.argumentFormat,
                        precision: labelOptions.precision,
                        argumentPrecision: labelOptions.argumentPrecision,
                        percentPrecision: labelOptions.percentPrecision,
                        customizeText: $.isFunction(labelOptions.customizeText) ? labelOptions.customizeText : undefined,
                        attributes: labelAttributes,
                        visible: labelFont.size !== 0 ? labelOptions.visible : false,
                        showForZeroValues: labelOptions.showForZeroValues,
                        horizontalOffset: labelOptions.horizontalOffset,
                        verticalOffset: labelOptions.verticalOffset,
                        radialOffset: labelOptions.radialOffset,
                        background: backgroundAttr,
                        position: labelOptions.position,
                        connector: connectorAttr,
                        rotationAngle: labelOptions.rotationAngle
                    }
            },
            parseStyleOptions: function(options) {
                var self = this,
                    combinedOptions = $.extend(true, {}, this.getDefaultStyleOptions(), options),
                    normalState = self._createSeriesState(combinedOptions, true),
                    hoverState = self._createSeriesState(combinedOptions.hoverStyle, false, true, combinedOptions.dashStyle),
                    selectedState = self._createSeriesState(combinedOptions.selectionStyle, false, true, combinedOptions.dashStyle),
                    attr = {},
                    attributes,
                    commonPointStyle;
                $.each(['align', 'translateX', 'translateY', 'rotate', 'linejoin', 'linecap', 'opacity', 'style'], function(i, val) {
                    if (combinedOptions[val])
                        attr[val] = combinedOptions[val]
                });
                attributes = $.extend(true, {}, normalState, attr);
                commonPointStyle = self._parsePointStyleOptions(combinedOptions.point);
                commonPointStyle.label = self._parseLabelStyleOptions(combinedOptions);
                return {
                        themeColor: combinedOptions.color,
                        attributes: attributes,
                        maxLabelCount: combinedOptions.maxLabelCount,
                        minSegmentSize: combinedOptions.minSegmentSize,
                        minBarSize: combinedOptions.minBarSize,
                        reduction: {
                            color: combinedOptions.reduction.color,
                            level: combinedOptions.reduction.level,
                            innerColor: combinedOptions.innerColor
                        },
                        states: {
                            normal: normalState,
                            hover: hoverState,
                            selected: selectedState
                        },
                        point: commonPointStyle
                    }
            },
            canRenderCompleteHandle: function() {
                var result = this._canRenderCompleteHandle;
                delete this._canRenderCompleteHandle;
                return !!result
            },
            _isTypeSupported: function(data) {
                return utils.isString(data) || utils.isNumber(data) || utils.isDate(data)
            },
            _getPointSize: function() {
                if (this.styles.point.visible)
                    return this.styles.point.attributes.r * 2;
                else
                    return 2
            },
            getDefaultStyleOptions: function() {
                return {
                        color: '#000000',
                        border: {
                            visible: false,
                            width: 1,
                            color: '#000000'
                        },
                        width: 2,
                        dashStyle: 'solid',
                        cornerRadius: 0,
                        innerColor: '#ffffff',
                        reduction: {color: '#FF0000'},
                        maxLabelCount: undefined,
                        minSegmentSize: undefined,
                        minBarSize: undefined,
                        point: {
                            visible: true,
                            symbol: 'circle',
                            color: '#000000',
                            size: 6,
                            seriesName: this.name,
                            border: {
                                visible: false,
                                width: 1,
                                color: '#000000'
                            },
                            hoverStyle: {
                                color: '#000000',
                                border: {
                                    visible: true,
                                    width: 2,
                                    color: '#ffffff'
                                },
                                size: 6
                            },
                            selectionStyle: {
                                color: '#000000',
                                border: {
                                    visible: true,
                                    width: 2,
                                    color: '#ffffff'
                                },
                                size: 6
                            }
                        },
                        label: {
                            visible: false,
                            showForZeroValues: true,
                            alignment: 'center',
                            font: {
                                family: "'SegoeUI', 'Segoe UI', 'HelveticaNeue', 'Helvetica Neue', 'Trebuchet MS', Verdana",
                                weight: 400,
                                color: '#ffffff',
                                size: 14
                            },
                            rotationAngle: 0,
                            horizontalOffset: 0,
                            verticalOffset: 0,
                            radialOffset: 0,
                            format: '',
                            argumentFormat: '',
                            precision: 0,
                            argumentPrecision: 0,
                            position: 'outside',
                            connector: {
                                visible: false,
                                width: 1
                            },
                            border: {
                                visible: false,
                                width: 1,
                                color: '#808080',
                                dashStyle: 'solid'
                            }
                        },
                        hoverStyle: {
                            hatching: {
                                direction: 'none',
                                width: 2,
                                step: 6,
                                opacity: 0.75
                            },
                            color: '#000000',
                            border: {
                                visible: false,
                                width: 1,
                                color: '#000000'
                            },
                            width: 3
                        },
                        selectionStyle: {
                            hatching: {
                                direction: 'right',
                                width: 2,
                                step: 6,
                                opacity: 0.5
                            },
                            color: '#000000',
                            border: {
                                visible: false,
                                width: 1,
                                color: '#000000'
                            },
                            width: 3
                        }
                    }
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file lineSeries.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            animationConst = series.consts.animations;
        series.LineSeries = series.BaseSeries.inherit({
            ctor: function(renderer, options, isRangeSeries) {
                options.specificType = options.specificType || 'line';
                this.callBase(renderer, options, isRangeSeries);
                this.paths = this.paths || []
            },
            dispose: function() {
                this.paths = null;
                this.callBase()
            },
            drawSeriesData: function(seriesElementsGroup, seriesMarkersGroup, labelsGroup, animationEnabled) {
                var self = this;
                if (!self.segments)
                    return;
                self.paths = [];
                if (animationEnabled) {
                    labelsGroup.applySettings(animationConst.hideGroup);
                    seriesMarkersGroup.applySettings(animationConst.hideGroup)
                }
                $.each(self.segments, function(i, segment) {
                    if (self.styles.attributes.strokeWidth > 0)
                        self.drawLine(seriesElementsGroup, animationEnabled ? self.getZeroPathPoints(i) : segment);
                    self.drawPoints(seriesMarkersGroup, labelsGroup, segment)
                });
                animationEnabled && self.animate(function() {
                    seriesMarkersGroup.animate(animationConst.showGroup, animationConst.showDuration);
                    labelsGroup.animate(animationConst.showGroup, animationConst.showDuration)
                })
            },
            _drawTrackersForSegment: function(index, segment) {
                this.drawLineTracker(segment);
                this.callBase(index, segment)
            },
            applyNormalStyle: function(mode) {
                var self = this;
                if (self.paths) {
                    self.applyPathNormalStyle();
                    self.applyPointNormalStyle(mode)
                }
            },
            applyHoverStyle: function(mode) {
                var self = this;
                if (self.paths) {
                    self.applyPathHoverStyle();
                    self.applyPointHoverStyle(mode)
                }
            },
            applySelectionStyle: function(mode) {
                var self = this;
                if (self.paths) {
                    self.applyPathSelectionStyle();
                    self.applyPointSelectionStyle(mode)
                }
            },
            animate: function(complete) {
                this.animatePaths(complete)
            }
        }).include(series.SeriesPointsDrawerMixin).include(series.LineDrawerMixin).include(series.LineSeriesAdjustOptionsMixin).include(series.pointVisualizationMixin).include(series.pathVisualizationMixin).include(series.pointsAnimation).include(series.pathAnimation).include(series.SeriesDataFilterMixin)
    })(jQuery, DevExpress);
    /*! Module viz-core, file areaSeries.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            animationConst = series.consts.animations;
        series.AreaSeries = series.BaseSeries.inherit({
            ctor: function(renderer, options, isRangeSeries) {
                this.type = options.specificType = options.specificType || 'area';
                this.callBase(renderer, options, isRangeSeries);
                this.areaSegments = this.areaSegments || []
            },
            dispose: function() {
                var _this = this;
                _this.areas = null;
                _this.areaSegments = null;
                _this.paths = null;
                _this.callBase()
            },
            drawSeriesData: function(seriesElementsGroup, seriesMarkersGroup, labelsGroup, animationEnabled) {
                var self = this,
                    lineSegment,
                    areaSegment;
                self.paths = [];
                self.areas = [];
                if (!self.segments)
                    return;
                if (animationEnabled) {
                    labelsGroup.applySettings(animationConst.hideGroup);
                    seriesMarkersGroup.applySettings(animationConst.hideGroup)
                }
                $.each(self.segments, function(index, segment) {
                    self.prepareSegments(index);
                    if (animationEnabled) {
                        areaSegment = self.getZeroAreaPoints(index);
                        lineSegment = self.getZeroPathPoints(index)
                    }
                    else {
                        areaSegment = self.areaSegments[index];
                        lineSegment = segment
                    }
                    self.drawPoints(seriesMarkersGroup, labelsGroup, segment);
                    self.drawArea(seriesElementsGroup, index, areaSegment);
                    if (self.styles.attributes.strokeWidth > 0 || self.styles.states.hover.strokeWidth > 0 || self.styles.states.selected.strokeWidth > 0)
                        self.drawLine(seriesElementsGroup, lineSegment)
                });
                animationEnabled && self.animate(function() {
                    seriesMarkersGroup.animate(animationConst.showGroup, animationConst.showDuration);
                    labelsGroup.animate(animationConst.showGroup, animationConst.showDuration)
                })
            },
            _drawTrackersForSegment: function(index, segment) {
                this.drawAreaTracker(index, segment);
                this.callBase(index, segment)
            },
            applyNormalStyle: function(mode) {
                this.applyPointNormalStyle(mode);
                this.applyPathNormalStyle();
                this.applyAreaNormalStyle()
            },
            applyHoverStyle: function(mode) {
                this.applyPointHoverStyle(mode);
                this.applyPathHoverStyle();
                this.applyAreaHoverStyle()
            },
            applySelectionStyle: function(mode) {
                this.applyPointSelectionStyle(mode);
                this.applyPathSelectionStyle();
                this.applyAreaSelectionStyle()
            },
            animate: function(complete) {
                this.animateAreas(complete);
                this.animatePaths()
            }
        }).include(series.AreaDrawerMixin).include(series.SeriesPointsDrawerMixin).include(series.LineDrawerMixin).include(series.AreaSeriesAdjustOptionsMixin).include(series.pointVisualizationMixin).include(series.pathVisualizationMixin).include(series.areaVisualizationMixin).include(series.pointsAnimation).include(series.pathAnimation).include(series.areaAnimation).include(series.specialAreaMethodsMixin).include(series.SeriesDataFilterMixin)
    })(jQuery, DevExpress);
    /*! Module viz-core, file barSeries.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            animationConst = series.consts.animations;
        series.BarSeries = series.BaseSeries.inherit({
            ctor: function(renderer, options, isRangeSeries) {
                options.specificType = options.specificType || 'bar';
                this.callBase(renderer, options, isRangeSeries);
                this.stackName = options.stack || 'default'
            },
            _applyClippings: function(seriesElementsOptions, seriesMarkersOptions, labelsGroupOptions) {
                if (this.paneClipRectID) {
                    seriesElementsOptions.clipId = this.paneClipRectID;
                    labelsGroupOptions.clipId = this.paneClipRectID
                }
            },
            _applyTrackersClippings: function() {
                if (this.paneClipRectID)
                    this.options.markerTrackerGroup.applySettings({clipId: this.paneClipRectID})
            },
            drawSeriesData: function(seriesElementsGroup, seriesMarkersGroup, labelsGroup, animationEnabled) {
                var self = this;
                if (self.points.length && self.hoverPattern) {
                    self.styles.point.states.hover.fill = self.hoverPattern.id;
                    self.styles.point.states.selected.fill = self.selectedPattern.id
                }
                $.each(self.styles.pointStyles, function(_, style) {
                    if (style)
                        if (style.hoverPattern) {
                            style.states.hover.fill = style.hoverPattern.id;
                            style.states.selected.fill = style.selectedPattern.id
                        }
                });
                if (!self.segments)
                    return;
                if (animationEnabled) {
                    if (!this.options.rotated)
                        self.seriesGroup.applySettings({
                            scale: {
                                x: 1,
                                y: 0.001
                            },
                            translateY: this.translator.translateY('canvas_position_default')
                        });
                    else
                        self.seriesGroup.applySettings({
                            scale: {
                                x: 0.001,
                                y: 1
                            },
                            translateX: this.translator.translateX('canvas_position_default')
                        });
                    labelsGroup.applySettings(animationConst.hideGroup)
                }
                $.each(this.segments, function(i, segment) {
                    self.drawPoints(seriesMarkersGroup, labelsGroup, segment)
                });
                animationEnabled && self.animate(function() {
                    labelsGroup.animate(animationConst.showGroup, animationConst.showDuration)
                })
            },
            applyNormalStyle: function(mode) {
                this.applyPointNormalStyle(mode)
            },
            applyHoverStyle: function(mode) {
                this.applyPointHoverStyle(mode)
            },
            applySelectionStyle: function(mode) {
                this.applyPointSelectionStyle(mode)
            },
            animate: function(complete) {
                var _this = this,
                    group = this.seriesGroup;
                group.animate({
                    scale: {
                        x: 1,
                        y: 1
                    },
                    translate: {
                        y: 0,
                        x: 0
                    }
                }, {}, complete)
            }
        }).include(series.SeriesPointsDrawerMixin).include(series.BarSeriesAdjustOptionsMixin).include(series.pointVisualizationMixin).include(series.pointsAnimation).redefine(series.specialBarMethodsMixin).redefine(series.SeriesDataFilterMixin)
    })(jQuery, DevExpress);
    /*! Module viz-core, file candleStickSeries.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            isDefined = DX.utils.isDefined;
        series.CandleStickSeries = series.BaseSeries.inherit({
            ctor: function(renderer, options) {
                options.specificType = options.specificType || 'candlestick';
                this.callBase(renderer, options)
            },
            dispose: function() {
                var _this = this;
                _this.hoverPatternReduction = null;
                _this.selectedPatternReduction = null;
                _this.callBase()
            },
            _applyClippings: function(seriesElementsOptions, seriesMarkersOptions, labelsGroupOptions) {
                if (this.paneClipRectID) {
                    seriesElementsOptions.clipId = this.paneClipRectID;
                    labelsGroupOptions.clipId = this.paneClipRectID;
                    seriesMarkersOptions.clipId = this.paneClipRectID
                }
            },
            _applyTrackersClippings: function() {
                if (this.paneClipRectID)
                    this.options.markerTrackerGroup.applySettings({clipId: this.paneClipRectID})
            },
            drawSeriesData: function(seriesElementsGroup, seriesMarkersGroup, labelsGroup) {
                var self = this,
                    markerGroups = self.createMarkerGroups(seriesMarkersGroup);
                $.each(self.points, function(i, point) {
                    switch (point.pointClassName) {
                        case'dx-candle-reduction':
                            point.options.states.hover.fill = self.hoverPatternReduction.id;
                            point.options.states.selected.fill = self.selectedPatternReduction.id;
                            point.options.states.hover.stroke = self.hoverPatternReduction.id;
                            point.options.states.selected.stroke = self.selectedPatternReduction.id;
                            break;
                        case'dx-candle-default':
                            point.options.states.hover.fill = self.hoverPattern.id;
                            point.options.states.selected.fill = self.selectedPattern.id;
                            point.options.states.hover.stroke = self.hoverPattern.id;
                            point.options.states.selected.stroke = self.selectedPattern.id;
                            break;
                        case'dx-candle-reduction dx-candle-positive':
                            point.options.states.hover.stroke = self.hoverPatternReduction.id;
                            point.options.states.selected.stroke = self.selectedPatternReduction.id;
                            break;
                        default:
                            point.options.states.hover.stroke = self.hoverPattern.id;
                            point.options.states.selected.stroke = self.selectedPattern.id;
                            break
                    }
                });
                self.drawPoints(markerGroups, labelsGroup, self.points);
                return this
            },
            applyNormalStyle: function(mode) {
                this.applyPointNormalStyle(mode)
            },
            applyHoverStyle: function(mode) {
                this.applyPointHoverStyle(mode)
            },
            applySelectionStyle: function(mode) {
                this.applyPointSelectionStyle(mode)
            },
            animate: function() {
                this.animatePoints()
            }
        }).include(series.SeriesPointsDrawerMixin).include(series.CandleStickSeriesAdjustOptionsMixin).include(series.pointVisualizationMixin).include(series.pointsAnimation).redefine(series.specialCandleStickMethodsMixin).include(series.FinancialSeriesDataResamplerMixin)
    })(jQuery, DevExpress);
    /*! Module viz-core, file stockSeries.js */
    (function($, DX) {
        var series = DX.viz.charts.series;
        series.StockSeries = series.BaseSeries.inherit({
            ctor: function(renderer, options) {
                options.specificType = options.specificType || 'stock';
                this.callBase(renderer, options)
            },
            _applyClippings: function(seriesElementsOptions, seriesMarkersOptions, labelsGroupOptions) {
                if (this.paneClipRectID) {
                    seriesElementsOptions.clipId = this.paneClipRectID;
                    labelsGroupOptions.clipId = this.paneClipRectID;
                    seriesMarkersOptions.clipId = this.paneClipRectID
                }
            },
            _applyTrackersClippings: function() {
                if (this.paneClipRectID)
                    this.options.markerTrackerGroup.applySettings({clipId: this.paneClipRectID})
            },
            drawSeriesData: function(seriesElementsGroup, seriesMarkersGroup, labelsGroup) {
                var self = this,
                    hoverStroke = self.styles.states.hover.stroke,
                    selectedStroke = self.styles.states.selected.stroke,
                    normalStroke = self.styles.states.normal.stroke,
                    reductionColor = self.styles.reduction.color,
                    markerGroups = self.createMarkerGroups(seriesMarkersGroup);
                $.each(self.points, function(i, point) {
                    switch (point.pointClassName) {
                        case'dx-candle-reduction':
                        case'dx-candle-reduction dx-candle-positive':
                            point.options.states.hover.stroke = normalStroke === hoverStroke ? reductionColor : hoverStroke;
                            point.options.states.selected.stroke = normalStroke === selectedStroke ? reductionColor : selectedStroke;
                            break;
                        default:
                            point.options.states.hover.stroke = hoverStroke;
                            point.options.states.selected.stroke = selectedStroke;
                            break
                    }
                });
                self.drawPoints(markerGroups, labelsGroup, self.points);
                return this
            },
            applyNormalStyle: function(mode) {
                this.applyPointNormalStyle(mode)
            },
            applyHoverStyle: function(mode) {
                this.applyPointHoverStyle(mode)
            },
            applySelectionStyle: function(mode) {
                this.applyPointSelectionStyle(mode)
            },
            animate: function() {
                this.animatePoints()
            }
        }).include(series.SeriesPointsDrawerMixin).include(series.CandleStickSeriesAdjustOptionsMixin).include(series.pointVisualizationMixin).include(series.pointsAnimation).redefine(series.specialCandleStickMethodsMixin).include(series.FinancialSeriesDataResamplerMixin)
    })(jQuery, DevExpress);
    /*! Module viz-core, file splineSeries.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            animationConst = series.consts.animations;
        series.SplineSeries = series.BaseSeries.inherit({
            ctor: function(renderer, options, isRangeSeries) {
                options.specificType = options.specificType || 'spline';
                this.callBase(renderer, options, isRangeSeries)
            },
            drawSeriesData: function(seriesElementsGroup, seriesMarkersGroup, labelsGroup, animationEnabled) {
                var self = this;
                self.paths = [];
                if (!self.segments)
                    return;
                if (animationEnabled) {
                    labelsGroup.applySettings(animationConst.hideGroup);
                    seriesMarkersGroup.applySettings(animationConst.hideGroup)
                }
                $.each(self.segments, function(index, segment) {
                    self.prepareSegments(index);
                    var s = animationEnabled ? self.getZeroPathPoints(index) : self.preparedSegments[index];
                    if (self.styles.attributes.strokeWidth > 0)
                        self.drawSpline(seriesElementsGroup, index, s);
                    self.drawPoints(seriesMarkersGroup, labelsGroup, segment)
                });
                animationEnabled && self.animate(function() {
                    seriesMarkersGroup.animate(animationConst.showGroup, animationConst.showDuration);
                    labelsGroup.animate(animationConst.showGroup, animationConst.showDuration)
                })
            },
            _drawTrackersForSegment: function(index, segment) {
                this.drawSplineTracker(index);
                this.callBase(index, segment)
            },
            applyNormalStyle: function(mode) {
                var self = this;
                if (self.paths) {
                    self.applyPathNormalStyle();
                    self.applyPointNormalStyle(mode)
                }
            },
            applyHoverStyle: function(mode) {
                var self = this;
                if (self.paths) {
                    self.applyPathHoverStyle();
                    self.applyPointHoverStyle(mode)
                }
            },
            applySelectionStyle: function(mode) {
                var self = this;
                if (self.paths) {
                    self.applyPathSelectionStyle();
                    self.applyPointSelectionStyle(mode)
                }
            },
            animate: function(complete) {
                this.animatePaths(complete)
            }
        }).include(series.SplineDrawerMixin).include(series.SeriesPointsDrawerMixin).include(series.LineSeriesAdjustOptionsMixin).include(series.pointVisualizationMixin).include(series.pathVisualizationMixin).include(series.pointsAnimation).include(series.pathAnimation).include(series.SeriesDataFilterMixin)
    })(jQuery, DevExpress);
    /*! Module viz-core, file splineAreaSeries.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            animationConst = series.consts.animations;
        series.SplineAreaSeries = series.BaseSeries.inherit({
            ctor: function(renderer, options, isRangeSeries) {
                options.specificType = options.specificType || 'splinearea';
                this.callBase(renderer, options, isRangeSeries);
                this.areas = this.areas || [];
                this.areaSegments = this.areaSegments || []
            },
            dispose: function() {
                var _this = this;
                _this.areas = null;
                _this.areaSegments = null;
                _this.paths = null;
                _this.callBase()
            },
            drawSeriesData: function(seriesElementsGroup, seriesMarkersGroup, labelsGroup, animationEnabled) {
                var self = this,
                    pathSegment,
                    areaSegment;
                self.paths = [];
                self.areas = [];
                if (!self.segments)
                    return;
                if (animationEnabled) {
                    labelsGroup.applySettings(animationConst.hideGroup);
                    seriesMarkersGroup.applySettings(animationConst.hideGroup)
                }
                $.each(self.segments, function(index, segment) {
                    self.prepareSegments(index);
                    if (animationEnabled) {
                        pathSegment = self.getZeroPathPoints(index);
                        areaSegment = self.getZeroAreaPoints(index)
                    }
                    else {
                        pathSegment = self.preparedSegments[index];
                        areaSegment = self.areaSegments[index]
                    }
                    self.drawPoints(seriesMarkersGroup, labelsGroup, segment);
                    self.drawSplineArea(seriesElementsGroup, index, areaSegment);
                    if (self.styles.attributes.strokeWidth > 0 || self.styles.states.hover.strokeWidth > 0 || self.styles.states.selected.strokeWidth > 0)
                        self.drawSpline(seriesElementsGroup, index, pathSegment)
                });
                if (self.hoverPattern) {
                    self.styles.area.states.hover.fill = self.hoverPattern.id;
                    self.styles.area.states.selected.fill = self.selectedPattern.id;
                    self.styles.states.hover.fill = 'none';
                    self.styles.states.selected.fill = 'none'
                }
                animationEnabled && self.animate(function() {
                    seriesMarkersGroup.animate(animationConst.showGroup, animationConst.showDuration);
                    labelsGroup.animate(animationConst.showGroup, animationConst.showDuration)
                })
            },
            _drawTrackersForSegment: function(index, segment) {
                this.drawSplineAreaTracker(index, segment);
                this.callBase(index, segment)
            },
            applyNormalStyle: function(mode) {
                this.applyPointNormalStyle(mode);
                this.applyPathNormalStyle();
                this.applyAreaNormalStyle()
            },
            applyHoverStyle: function(mode) {
                this.applyPointHoverStyle(mode);
                this.applyPathHoverStyle();
                this.applyAreaHoverStyle()
            },
            applySelectionStyle: function(mode) {
                this.applyPointSelectionStyle(mode);
                this.applyPathSelectionStyle();
                this.applyAreaSelectionStyle()
            },
            animate: function(complete) {
                this.animateAreas(complete);
                this.animatePaths()
            }
        }).include(series.SplineDrawerMixin).include(series.SeriesPointsDrawerMixin).redefine(series.SplineAreaDrawerMixin).include(series.AreaSeriesAdjustOptionsMixin).include(series.pointVisualizationMixin).include(series.pathVisualizationMixin).include(series.areaVisualizationMixin).include(series.pointsAnimation).include(series.pathAnimation).include(series.splineAreaAnimation).include(series.specialAreaMethodsMixin).include(series.SeriesDataFilterMixin)
    })(jQuery, DevExpress);
    /*! Module viz-core, file scatterSeries.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            animationConst = series.consts.animations;
        series.ScatterSeries = series.BaseSeries.inherit({
            ctor: function(renderer, options) {
                options.specificType = options.specificType || 'scatter';
                this.callBase(renderer, options)
            },
            drawSeriesData: function(seriesElementsGroup, seriesMarkersGroup, labelsGroup, animationEnabled) {
                var self = this;
                if (!self.segments)
                    return;
                if (animationEnabled)
                    labelsGroup.applySettings(animationConst.hideGroup);
                $.each(this.segments, function(i, segment) {
                    self.drawPoints(seriesMarkersGroup, labelsGroup, segment, animationEnabled)
                });
                animationEnabled && self.animate(function() {
                    labelsGroup.animate(animationConst.showGroup, animationConst.showDuration)
                })
            },
            applyNormalStyle: function(mode) {
                this.applyPointNormalStyle(mode)
            },
            applyHoverStyle: function(mode) {
                this.applyPointHoverStyle(mode)
            },
            applySelectionStyle: function(mode) {
                this.applyPointSelectionStyle(mode)
            },
            animate: function(complete) {
                this.animatePoints(complete)
            }
        }).include(series.SeriesPointsDrawerMixin).include(series.pointVisualizationMixin).include(series.pointsAnimation).include(series.SeriesDataFilterMixin)
    })(jQuery, DevExpress);
    /*! Module viz-core, file rangeAreaSeries.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            animationConst = series.consts.animations;
        series.RangeAreaSeries = series.BaseSeries.inherit({
            ctor: function(renderer, options) {
                options.specificType = options.specificType || 'rangearea';
                this.callBase(renderer, options, true);
                this.areaSegments = this.areaSegments || []
            },
            drawSeriesData: function(seriesElementsGroup, seriesMarkersGroup, labelsGroup, animationEnabled) {
                var self = this;
                self.areas = [];
                if (!self.segments)
                    return;
                if (animationEnabled) {
                    labelsGroup.applySettings(animationConst.hideGroup);
                    seriesMarkersGroup.applySettings(animationConst.hideGroup)
                }
                $.each(self.segments, function(index, segment) {
                    self.prepareSegments(index);
                    self.drawPoints(seriesMarkersGroup, labelsGroup, segment);
                    self.drawArea(seriesElementsGroup, index, animationEnabled ? self.getZeroAreaPoints(index) : self.areaSegments[index])
                });
                animationEnabled && self.animate(function() {
                    seriesMarkersGroup.animate(animationConst.showGroup, animationConst.showDuration);
                    labelsGroup.animate(animationConst.showGroup, animationConst.showDuration)
                })
            },
            _drawTrackersForSegment: function(index, segment) {
                this.drawAreaTracker(index, segment);
                this.callBase(index, segment)
            },
            applyNormalStyle: function(mode) {
                this.applyPointNormalStyle(mode);
                this.applyAreaNormalStyle()
            },
            applyHoverStyle: function(mode) {
                this.applyPointHoverStyle(mode);
                this.applyAreaHoverStyle()
            },
            applySelectionStyle: function(mode) {
                this.applyPointSelectionStyle(mode);
                this.applyAreaSelectionStyle()
            },
            animate: function(complete) {
                this.animateAreas(complete)
            }
        }).include(series.AreaDrawerMixin).include(series.SeriesPointsDrawerMixin).include(series.AreaSeriesAdjustOptionsMixin).include(series.pointVisualizationMixin).include(series.areaVisualizationMixin).include(series.pointsAnimation).include(series.areaAnimation).include(series.specialAreaMethodsMixin).include(series.RangeSeriesDataFilterMixin)
    })(jQuery, DevExpress);
    /*! Module viz-core, file rangeBarSeries.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            animationConst = series.consts.animations;
        series.RangeBarSeries = series.BaseSeries.inherit({
            ctor: function(renderer, options) {
                options.specificType = options.specificType || 'rangebar';
                this.callBase(renderer, options, true)
            },
            _applyClippings: function(seriesElementsOptions, seriesMarkersOptions, labelsGroupOptions) {
                if (this.paneClipRectID) {
                    seriesElementsOptions.clipId = this.paneClipRectID;
                    labelsGroupOptions.clipId = this.paneClipRectID
                }
            },
            _applyTrackersClippings: function() {
                if (this.paneClipRectID)
                    this.options.markerTrackerGroup.applySettings({clipId: this.paneClipRectID})
            },
            drawSeriesData: function(seriesElementsGroup, seriesMarkersGroup, labelsGroup, animationEnabled) {
                var self = this;
                if (self.points.length && self.hoverPattern) {
                    self.styles.point.states.hover.fill = self.hoverPattern.id;
                    self.styles.point.states.selected.fill = self.selectedPattern.id
                }
                $.each(self.styles.pointStyles, function(_, style) {
                    if (style)
                        if (style.hoverPattern) {
                            style.states.hover.fill = style.hoverPattern.id;
                            style.states.selected.fill = style.selectedPattern.id
                        }
                });
                if (!self.segments)
                    return;
                if (animationEnabled) {
                    if (!this.options.rotated)
                        self.seriesGroup.applySettings({
                            scale: {
                                x: 1,
                                y: 0.001
                            },
                            translateY: this.translator.translateY('canvas_position_default')
                        });
                    else
                        self.seriesGroup.applySettings({
                            scale: {
                                x: 0.001,
                                y: 1
                            },
                            translateX: this.translator.translateX('canvas_position_default')
                        });
                    labelsGroup.applySettings(animationConst.hideGroup)
                }
                $.each(this.segments, function(i, segment) {
                    self.drawPoints(seriesMarkersGroup, labelsGroup, segment)
                });
                animationEnabled && self.animate(function() {
                    labelsGroup.animate(animationConst.showGroup, animationConst.showDuration)
                })
            },
            applyNormalStyle: function(mode) {
                this.applyPointNormalStyle(mode)
            },
            applyHoverStyle: function(mode) {
                this.applyPointHoverStyle(mode)
            },
            applySelectionStyle: function(mode) {
                this.applyPointSelectionStyle(mode)
            },
            animate: function(complete) {
                this.seriesGroup.animate({
                    scale: {
                        x: 1,
                        y: 1
                    },
                    translate: {
                        y: 0,
                        x: 0
                    }
                }, {}, complete)
            }
        }).include(series.SeriesPointsDrawerMixin).include(series.BarSeriesAdjustOptionsMixin).include(series.pointVisualizationMixin).include(series.pointsAnimation).include(series.RangeSeriesDataFilterMixin)
    })(jQuery, DevExpress);
    /*! Module viz-core, file piePoint.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            statesConsts = series.consts.states,
            round = Math.round,
            getCosAndSin = DX.utils.getCosAndSin;
        series.PiePoint = series.BasePoint.inherit({
            ctor: function(data) {
                this.centerX = 300;
                this.centerY = 150;
                this.radiusOuter = 120;
                this.radiusInner = 0;
                this.INDENT_FROM_PIE = 30;
                this.CONNECTOR_LENGTH = 20;
                this.setLabelEllipsis = false;
                this.callBase(data);
                this.minValue = 0;
                this.tag = data.tag;
                this._pieTrackerAttrs = $.extend({}, this._trackerAttrs, {
                    inh: false,
                    fill: 'grey'
                })
            },
            translate: function(translator) {
                var self = this;
                self.translator = translator = translator || self.translator;
                if (!self.translator)
                    return;
                self.fromAngle = translator.translate(self.minValue);
                self.toAngle = translator.translate(self.value);
                self.middleAngle = translator.translate((self.value - self.minValue) / 2 + self.minValue)
            },
            correctValue: function(correction, percent) {
                var self = this;
                self.value += correction;
                self.minValue += correction;
                self.percent = percent;
                self.labelFormatObject.percent = percent
            },
            getTooltipCoords: function() {
                var angleFunctions = getCosAndSin(this.middleAngle);
                return {
                        x: this.centerX + (this.radiusInner + (this.radiusOuter - this.radiusInner) / 2) * angleFunctions.cos,
                        y: this.centerY - (this.radiusInner + (this.radiusOuter - this.radiusInner) / 2) * angleFunctions.sin,
                        offset: 0
                    }
            },
            correctPosition: function(correction) {
                var self = this;
                self.radiusInner = correction.radiusInner;
                self.radiusOuter = correction.radiusOuter;
                self.centerX = correction.centerX;
                self.centerY = correction.centerY
            },
            drawMarker: function(renderer, group, animationEnabled) {
                this.options.attributes.inh = false;
                var attr = animationEnabled ? $.extend({
                        scale: {
                            x: 0,
                            y: 0
                        },
                        translateX: this.centerX,
                        translateY: this.centerY
                    }, this.options.attributes) : this.options.attributes;
                this.graphic = renderer.createArc(this.centerX, this.centerY, this.radiusOuter, this.radiusInner, this.toAngle, this.fromAngle, attr).append(group);
                this._checkState()
            },
            drawTrackerMarker: function(renderer, trackerGroup) {
                this.trackerGraphic = renderer.createArc(this.centerX, this.centerY, this.radiusOuter, this.radiusInner, this.toAngle, this.fromAngle, this._pieTrackerAttrs).append(trackerGroup);
                this.trackerGraphic.data({point: this})
            },
            correctLabel: function() {
                this.correctLabelPosition();
                this.checkEllipsis();
                this.correctBackgroundPosition();
                this.rotateLabel();
                this.checkLabelPosition()
            },
            correctLabelPosition: function() {
                var bbox = this.label.getBBox(),
                    labelOptions = this.options.label,
                    angleFunctions = getCosAndSin(this.middleAngle),
                    align = 'center',
                    rad = this.radiusOuter + labelOptions.radialOffset,
                    x,
                    y;
                switch (labelOptions.position) {
                    case'outside':
                        rad += this.INDENT_FROM_PIE;
                        if (angleFunctions.cos > 0.1)
                            align = 'left';
                        else if (angleFunctions.cos < -0.1)
                            align = 'right';
                        x = this.centerX + rad * angleFunctions.cos;
                        break;
                    case'inside':
                        rad -= this.INDENT_FROM_PIE;
                        x = this.centerX + rad * angleFunctions.cos;
                        break;
                    case'columns':
                        rad += this.CONNECTOR_LENGTH;
                        if (angleFunctions.cos > 0) {
                            align = 'right';
                            x = this.series.canvas.width - this.series.canvas.right
                        }
                        else if (angleFunctions.cos < 0) {
                            align = 'left';
                            x = this.series.canvas.left
                        }
                        break
                }
                y = round(this.label.settings.y + this.centerY - rad * angleFunctions.sin - bbox.y - bbox.height / 2);
                this.label.applySettings({
                    x: x,
                    y: y,
                    align: align
                })
            },
            correctConnectorPosition: function() {
                if (this.options.label.position === 'inside')
                    return;
                if (!this.connector)
                    return;
                var angleFunctions = getCosAndSin(round(this.middleAngle)),
                    attributes = this.series.styles.attributes,
                    borderWidth = this.series.userOptions.containerBackgroundColor === attributes.stroke ? ~~(attributes.strokeWidth / 2) : ~~(-attributes.strokeWidth / 2),
                    rad = this.radiusOuter,
                    x1 = round(this.centerX + (rad - borderWidth) * angleFunctions.cos),
                    y1 = round(this.centerY - (rad - borderWidth) * angleFunctions.sin),
                    x2,
                    y2,
                    x3,
                    y3,
                    box,
                    labelOptions = this.options.label,
                    connector;
                x2 = round(this.centerX + (rad + labelOptions.radialOffset + this.CONNECTOR_LENGTH) * angleFunctions.cos);
                if (labelOptions.position === 'outside') {
                    y2 = round(this.centerY - (rad + labelOptions.radialOffset + this.CONNECTOR_LENGTH) * angleFunctions.sin);
                    this.connector.applySettings({points: [x1, y1, x2, y2]})
                }
                if (labelOptions.position === 'columns') {
                    box = this.insideLabelGroup.getBBox();
                    box.x = box.x + (this.insideLabelGroup.settings.translateX || 0);
                    box.y = box.y + (this.insideLabelGroup.settings.translateY || 0);
                    y2 = box.y + box.height / 2;
                    if (this.labelBackground)
                        x3 = box.x + box.width / 2;
                    else if (angleFunctions.cos < 0)
                        x3 = box.x + box.width;
                    else if (angleFunctions.cos > 0)
                        x3 = box.x;
                    y3 = y2;
                    this.connector.applySettings({points: [{
                                x: x1,
                                y: y1
                            }, {
                                x: x2,
                                y: y2
                            }, {
                                x: x3,
                                y: y3
                            }]})
                }
            },
            rotateLabel: function() {
                var labelOptions = this.options.label,
                    rad = this.radiusOuter + labelOptions.radialOffset,
                    angleFunctions = getCosAndSin(this.middleAngle),
                    x,
                    y,
                    box = this.insideLabelGroup.getBBox();
                switch (labelOptions.position) {
                    case'outside':
                        x = this.centerX + (rad + labelOptions.radialOffset + this.CONNECTOR_LENGTH) * angleFunctions.cos;
                        y = this.centerY - (rad + labelOptions.radialOffset + this.CONNECTOR_LENGTH) * angleFunctions.sin;
                        break;
                    case'inside':
                        x = box.x + box.width / 2;
                        y = box.y + box.height / 2;
                        break;
                    case'columns':
                        x = box.x + box.width / 2;
                        y = box.y + box.height / 2;
                        break
                }
                this.insideLabelGroup.applySettings({
                    x: x,
                    y: y,
                    rotate: labelOptions.rotationAngle
                })
            },
            checkEllipsis: function() {
                var self = this,
                    i,
                    LABEL_OFFSET = 10,
                    labelBox,
                    text,
                    textLength = 0,
                    linesLength = [],
                    numLastSpan = [],
                    maxLength,
                    numSpan,
                    index,
                    x,
                    y,
                    width,
                    rotationAngleFunction = getCosAndSin(self.options.label.rotationAngle),
                    canvas = self.series.canvas,
                    labelOptions = this.options.label,
                    angleFunctions = getCosAndSin(this.middleAngle),
                    borderX = this.centerX + (this.radiusOuter + this.CONNECTOR_LENGTH) * angleFunctions.cos;
                if (!self.label.tspans || !self.setLabelEllipsis)
                    return;
                labelBox = self.label.getBBox();
                x = labelBox.x + labelBox.width < self.centerX ? labelBox.x + labelBox.width : labelBox.x;
                y = labelBox.y + labelBox.height / 2;
                width = labelBox.x + labelBox.width < self.centerX ? -labelBox.width : labelBox.width;
                if (y + width * rotationAngleFunction.sin > canvas.height - canvas.bottom + LABEL_OFFSET || y + width * rotationAngleFunction.sin < canvas.top - LABEL_OFFSET || x + width * rotationAngleFunction.cos < canvas.left - LABEL_OFFSET || x + width * rotationAngleFunction.cos > canvas.width - canvas.right + LABEL_OFFSET || labelOptions.position === 'columns' && (angleFunctions.cos < 0 && borderX < x || angleFunctions.cos > 0 && borderX > x))
                    for (i = 0; i < self.label.tspans.length; i++) {
                        textLength += self.label.tspans[i].element.getNumberOfChars();
                        if (!self.label.tspans[i + 1] || self.label.tspans[i + 1].settings.dy > 0) {
                            linesLength.push(textLength);
                            numLastSpan.push(i);
                            textLength = 0
                        }
                    }
                while (y + width * rotationAngleFunction.sin > canvas.height - canvas.bottom + LABEL_OFFSET || y + width * rotationAngleFunction.sin < canvas.top - LABEL_OFFSET || x + width * rotationAngleFunction.cos < canvas.left - LABEL_OFFSET || x + width * rotationAngleFunction.cos > canvas.width - canvas.right + LABEL_OFFSET || labelOptions.position === 'columns' && (angleFunctions.cos < 0 && borderX < x || angleFunctions.cos > 0 && borderX > x)) {
                    maxLength = Math.max.apply(null, linesLength);
                    if (maxLength === 0)
                        break;
                    index = $.inArray(maxLength, linesLength);
                    numSpan = numLastSpan[index];
                    if (self.label.tspans[numSpan].element.textContent === "...") {
                        if (self.label.tspans[numSpan].settings.dy > 0 || !self.label.tspans[numSpan - 1])
                            linesLength[index] = 0;
                        else if (self.label.tspans[numSpan - 1]) {
                            self.label.tspans[numSpan].element.textContent = '';
                            numLastSpan[index] -= 1;
                            self.label.tspans[numSpan - 1].element.textContent += "..."
                        }
                    }
                    else {
                        text = self.label.tspans[numSpan].element.textContent;
                        text = text.substr(0, text.length - 1 - 3) + "...";
                        self.label.tspans[numSpan].element.textContent = text;
                        linesLength[index] -= 1
                    }
                    labelBox = self.label.getBBox();
                    x = labelBox.x + labelBox.width < self.centerX ? labelBox.x + labelBox.width : labelBox.x;
                    y = labelBox.y + labelBox.height / 2;
                    width = labelBox.x + labelBox.width < self.centerX ? -labelBox.width : labelBox.width
                }
            },
            checkLabelPosition: function() {
                var self = this,
                    groupBox = self.insideLabelGroup.getBBox(),
                    canvas = self.series.canvas;
                if (groupBox.y + groupBox.height > canvas.height - canvas.bottom)
                    self.insideLabelGroup.move(0, canvas.height - groupBox.y - groupBox.height - canvas.bottom);
                else if (groupBox.y < canvas.top)
                    self.insideLabelGroup.move(0, canvas.top - groupBox.y);
                if (groupBox.x + groupBox.width > canvas.width - canvas.right)
                    self.insideLabelGroup.move(canvas.width - canvas.right - groupBox.x - groupBox.width, 0);
                else if (groupBox.x < canvas.left)
                    self.insideLabelGroup.move(canvas.left - groupBox.x, 0)
            },
            isInVisibleArea: function() {
                return true
            },
            _populatePointShape: function(target, deltaRadius) {
                var self = this,
                    angleFunctions = DX.utils.getCosAndSin(this.middleAngle);
                target.x = this.centerX - ~~(deltaRadius * angleFunctions.cos);
                target.y = this.centerY + ~~(deltaRadius * angleFunctions.sin);
                target.outerRadius = this.radiusOuter + deltaRadius;
                target.innerRadius = this.radiusInner;
                target.startAngle = this.toAngle;
                target.endAngle = this.fromAngle
            },
            applyHoverStyle: function() {
                if (this.graphic) {
                    this._populatePointShape(this.options.states.hover, 0);
                    this.graphic.applySettings(this.options.states.hover);
                    this.graphic.toForeground();
                    this.graphic.addClass('dx-chart-hovered-point')
                }
                if (this.legend)
                    this.legend.applyHoverStyle(this);
                return this
            },
            applyNormalStyle: function() {
                if (this.graphic) {
                    this._populatePointShape(this.options.states.normal, 0);
                    this.graphic.applySettings(this.options.states.normal)
                }
                if (this.legend)
                    this.legend.applyNormalStyle(this);
                return this
            },
            applySelectionStyle: function() {
                if (this.graphic) {
                    this._populatePointShape(this.options.states.selected, 0);
                    this.graphic.applySettings(this.options.states.selected);
                    this.graphic.toForeground();
                    this.graphic.addClass('dx-chart-selected-point')
                }
                if (this.legend)
                    this.legend.applySelectionStyle(this);
                return this
            },
            animate: function(complete, duration, step) {
                this.graphic.animate({
                    scale: {
                        x: 1,
                        y: 1
                    },
                    translate: {
                        y: 0,
                        x: 0
                    }
                }, {
                    partitionDuration: duration,
                    step: step
                }, complete)
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file pieSeries.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            HOVERING_SPACING = 20,
            LABEL_SPACING = 80,
            animationConst = series.consts.animations;
        series.PieSeries = series.BaseSeries.inherit({
            ctor: function(renderer, options) {
                options.specificType = options.specificType || 'pie';
                this.callBase(renderer, options);
                this.labelSpace = this.styles.point.label.visible ? LABEL_SPACING : 0;
                this.hoverSpace = 0 && this.styles.point.states.enableHover ? HOVERING_SPACING : 0;
                this.innerRadius = this.type === 'pie' ? 0 : options.innerRadius;
                this.outerRadius = options.radius;
                this.redraw = false
            },
            createPatterns: function() {
                var renderer = this.renderer;
                $.each(this.points, function(i, point) {
                    if (!point.hoverPatternColor) {
                        point.hoverPatternColor = point.options.states.hover.fill;
                        point.selectedPatternColor = point.options.states.selected.fill
                    }
                    if (!point.hoverPattern) {
                        point.hoverPattern = renderer.createPattern(point.hoverPatternColor, point.options.states.hover.hatching);
                        point.selectedPattern = renderer.createPattern(point.selectedPatternColor, point.options.states.selected.hatching)
                    }
                    point.hoverPattern.append();
                    point.selectedPattern.append();
                    point.options.states.hover.fill = point.hoverPattern.id;
                    point.options.states.selected.fill = point.selectedPattern.id
                })
            },
            drawSeriesData: function(seriesElementsGroup, seriesMarkersGroup, labelsGroup, animationEnabled) {
                var labelSpace,
                    bbox,
                    paneSpaceHeight,
                    paneSpaceWidth,
                    min;
                this.drawPoints(seriesMarkersGroup, labelsGroup, this.points, animationEnabled);
                if (animationEnabled)
                    labelsGroup.applySettings(animationConst.hideGroup);
                if (this.styles.point.label.visible) {
                    labelSpace = 0;
                    if (this.styles.point.label.position === 'columns') {
                        $.each(this.points, function(i, point) {
                            point.setLabelEllipsis = true;
                            bbox = point.insideLabelGroup.getBBox();
                            labelSpace = Math.max(bbox.width + point.INDENT_FROM_PIE + point.options.label.radialOffset, labelSpace)
                        });
                        this.redraw = true;
                        paneSpaceHeight = this.canvas.height - this.canvas.top - this.canvas.bottom;
                        paneSpaceWidth = this.canvas.width - this.canvas.left - this.canvas.right;
                        min = paneSpaceWidth < paneSpaceHeight ? paneSpaceWidth : paneSpaceHeight;
                        if (labelSpace > min / 2 - labelSpace)
                            this.labelSpace = min / 2;
                        else
                            this.labelSpace = 2 * labelSpace
                    }
                    else
                        $.each(this.points, function(i, point) {
                            point.setLabelEllipsis = true;
                            point.correctLabel()
                        })
                }
                animationEnabled && this.animate(function() {
                    labelsGroup.animate(animationConst.showGroup, animationConst.showDuration)
                });
                return this
            },
            drawTrackers: function() {
                this.drawPointTrackers(this.points)
            },
            applyNormalStyle: function(mode) {
                this.applyPointNormalStyle(mode)
            },
            applyHoverStyle: function(mode) {
                this.applyPointHoverStyle(mode)
            },
            applySelectionStyle: function(mode) {
                this.applyPointSelectionStyle(mode)
            },
            animate: function(complete) {
                this.sequentialAnimatePoints(complete)
            }
        }).include(series.SeriesPointsDrawerMixin).include(series.BarSeriesAdjustOptionsMixin).include(series.pointVisualizationMixin).include(series.pointsAnimation).redefine(series.specialPieMethodsMixin)
    })(jQuery, DevExpress);
    /*! Module viz-core, file stepLineSeries.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            animationConst = series.consts.animations;
        series.StepLineSeries = series.BaseSeries.inherit({
            ctor: function(renderer, options, isRangeSeries) {
                this.type = options.specificType = options.specificType || 'stepline';
                this.callBase(renderer, options, isRangeSeries)
            },
            drawSeriesData: function(seriesElementsGroup, seriesMarkersGroup, labelsGroup, animationEnabled) {
                var self = this;
                if (!self.segments)
                    return;
                self.paths = [];
                if (animationEnabled) {
                    labelsGroup.applySettings(animationConst.hideGroup);
                    seriesMarkersGroup.applySettings(animationConst.hideGroup)
                }
                $.each(self.segments, function(index, segment) {
                    self.prepareSegments(index);
                    var s = animationEnabled ? self.getZeroPathPoints(index) : self.preparedSegments[index];
                    self.drawStepLine(seriesElementsGroup, index, s);
                    self.drawPoints(seriesMarkersGroup, labelsGroup, segment)
                });
                animationEnabled && self.animate(function() {
                    seriesMarkersGroup.animate(animationConst.showGroup, animationConst.showDuration);
                    labelsGroup.animate(animationConst.showGroup, animationConst.showDuration)
                })
            },
            _drawTrackersForSegment: function(index, segment) {
                this.drawStepLineTracker(index, segment);
                this.callBase(index, segment)
            },
            applyNormalStyle: function(mode) {
                var self = this;
                if (self.paths) {
                    self.applyPathNormalStyle();
                    self.applyPointNormalStyle(mode)
                }
            },
            applyHoverStyle: function(mode) {
                var self = this;
                if (self.paths) {
                    self.applyPathHoverStyle();
                    self.applyPointHoverStyle(mode)
                }
            },
            applySelectionStyle: function(mode) {
                var self = this;
                if (self.paths) {
                    self.applyPathSelectionStyle();
                    self.applyPointSelectionStyle(mode)
                }
            },
            animate: function(complete) {
                this.animatePaths(complete)
            }
        }).include(series.SeriesPointsDrawerMixin).include(series.StepLineDrawerMixin).include(series.LineSeriesAdjustOptionsMixin).include(series.pointVisualizationMixin).include(series.pathVisualizationMixin).include(series.pointsAnimation).include(series.pathAnimation).include(series.SeriesDataFilterMixin)
    })(jQuery, DevExpress);
    /*! Module viz-core, file stepAreaSeries.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            animationConst = series.consts.animations;
        series.StepAreaSeries = series.BaseSeries.inherit({
            ctor: function(renderer, options, isRangeSeries) {
                this.type = options.specificType = options.specificType || 'steparea';
                this.areaSegments = this.areaSegments || [];
                this.callBase(renderer, options, isRangeSeries)
            },
            drawSeriesData: function(seriesElementsGroup, seriesMarkersGroup, labelsGroup, animationEnabled) {
                var self = this,
                    areaSegment,
                    lineSegment;
                self.paths = [];
                self.areas = [];
                if (!self.segments)
                    return;
                if (animationEnabled) {
                    labelsGroup.applySettings(animationConst.hideGroup);
                    seriesMarkersGroup.applySettings(animationConst.hideGroup)
                }
                $.each(self.segments, function(index, segment) {
                    self.prepareSegments(index);
                    if (animationEnabled) {
                        areaSegment = self.getZeroAreaPoints(index);
                        lineSegment = self.getZeroPathPoints(index)
                    }
                    else {
                        lineSegment = self.preparedSegments[index];
                        areaSegment = self.areaSegments[index]
                    }
                    self.drawPoints(seriesMarkersGroup, labelsGroup, segment);
                    self.drawStepArea(seriesElementsGroup, index, areaSegment);
                    if (self.styles.attributes.strokeWidth > 0 || self.styles.states.hover.strokeWidth > 0 || self.styles.states.selected.strokeWidth > 0)
                        self.drawStepLine(seriesElementsGroup, index, lineSegment)
                });
                animationEnabled && self.animate(function() {
                    seriesMarkersGroup.animate(animationConst.showGroup, animationConst.showDuration);
                    labelsGroup.animate(animationConst.showGroup, animationConst.showDuration)
                })
            },
            _drawTrackersForSegment: function(index, segment) {
                this.drawStepAreaTrackers(index, segment);
                this.callBase(index, segment)
            },
            applyNormalStyle: function(mode) {
                this.applyPointNormalStyle(mode);
                this.applyPathNormalStyle();
                this.applyAreaNormalStyle()
            },
            applyHoverStyle: function(mode) {
                this.applyPointHoverStyle(mode);
                this.applyPathHoverStyle();
                this.applyAreaHoverStyle()
            },
            applySelectionStyle: function(mode) {
                this.applyPointSelectionStyle(mode);
                this.applyPathSelectionStyle();
                this.applyAreaSelectionStyle()
            },
            animate: function(complete) {
                this.animateAreas(complete);
                this.animatePaths()
            }
        }).include(series.SeriesPointsDrawerMixin).include(series.StepLineDrawerMixin).redefine(series.StepAreaDrawerMixin).include(series.AreaSeriesAdjustOptionsMixin).include(series.pointVisualizationMixin).include(series.pathVisualizationMixin).include(series.areaVisualizationMixin).include(series.pointsAnimation).include(series.pathAnimation).include(series.areaAnimation).include(series.specialAreaMethodsMixin).include(series.SeriesDataFilterMixin)
    })(jQuery, DevExpress);
    /*! Module viz-core, file bubbleSeries.js */
    (function($, DX) {
        var series = DX.viz.charts.series,
            isDefined = DX.utils.isDefined,
            utils = DX.utils,
            BaseSeries = series.BaseSeries,
            animationConst = series.consts.animations;
        var BubbleSeries = BaseSeries.inherit({
                ctor: function(renderer, options) {
                    options.specificType = options.specificType || 'bubble';
                    this.callBase(renderer, options)
                },
                _applyClippings: function(seriesElementsOptions, seriesMarkersOptions, labelsGroupOptions) {
                    if (this.paneClipRectID) {
                        seriesElementsOptions.clipId = this.paneClipRectID;
                        labelsGroupOptions.clipId = this.paneClipRectID;
                        seriesMarkersOptions.clipId = this.paneClipRectID
                    }
                },
                drawSeriesData: function(seriesElementsGroup, seriesMarkersGroup, labelsGroup, animationEnabled) {
                    if (this.points.length && this.hoverPattern) {
                        this.styles.point.states.hover.fill = this.hoverPattern.id;
                        this.styles.point.states.selected.fill = this.selectedPattern.id
                    }
                    if (animationEnabled)
                        labelsGroup.applySettings(animationConst.hideGroup);
                    this.drawPoints(seriesMarkersGroup, labelsGroup, this.points, animationEnabled);
                    animationEnabled && this.animate(function() {
                        labelsGroup.animate(animationConst.showGroup, animationConst.showDuration)
                    })
                },
                _applyTrackersClippings: function() {
                    if (this.paneClipRectID)
                        this.options.markerTrackerGroup.applySettings({clipId: this.paneClipRectID})
                },
                drawTrackers: function() {
                    this.trackerElements = [];
                    this.drawPointTrackers(this.points);
                    this._applyTrackersClippings()
                },
                applyNormalStyle: function(mode) {
                    this.applyPointNormalStyle(mode)
                },
                applyHoverStyle: function(mode) {
                    this.applyPointHoverStyle(mode)
                },
                applySelectionStyle: function(mode) {
                    this.applyPointSelectionStyle(mode)
                },
                animate: function(complete) {
                    this.animatePoints(complete)
                }
            }).include(series.SeriesPointsDrawerMixin).include(series.pointVisualizationMixin).redefine(series.specialBubbleMethodsMixin).include(series.BubleSeriesAdjustOptionsMixin).include(series.pointsAnimation).include(series.BubbleSeriesDataResamplerMixin);
        series.BubbleSeries = BubbleSeries
    })(jQuery, DevExpress);
    /*! Module viz-core, file seriesFamily.js */
    (function($, DX, undefined) {
        DX.viz.charts.series.SeriesFamily = DX.Class.inherit(function() {
            var ctor = function(options) {
                    var debug = DX.utils.debug;
                    debug.assert(options.type, 'type was not passed or empty');
                    var self = this,
                        stubFunction = $.noop;
                    $.extend(self, options);
                    self.type = self.type.toLowerCase();
                    self.series = [];
                    switch (self.type) {
                        case'bar':
                            self.adjustSeriesDimensions = adjustBarSeriesDimensions;
                            self.adjustSeriesValues = stubFunction;
                            self.updateSeriesValues = updateBarSeriesValues;
                            self.preparePointsForSharedTooltip = preparePointsForSharedTooltip;
                            break;
                        case'rangebar':
                            self.adjustSeriesDimensions = adjustBarSeriesDimensions;
                            self.adjustSeriesValues = stubFunction;
                            self.updateSeriesValues = stubFunction;
                            self.preparePointsForSharedTooltip = preparePointsForSharedTooltip;
                            break;
                        case'fullstackedbar':
                            self.fullStacked = true;
                            self.adjustSeriesDimensions = adjustStackedBarSeriesDimensions;
                            self.adjustSeriesValues = adjustStackedSeriesValues;
                            self.updateSeriesValues = updateStackedSeriesValues;
                            self.preparePointsForSharedTooltip = preparePointsForSharedTooltip;
                            break;
                        case'stackedbar':
                            self.adjustSeriesDimensions = adjustStackedBarSeriesDimensions;
                            self.adjustSeriesValues = adjustStackedSeriesValues;
                            self.updateSeriesValues = updateStackedSeriesValues;
                            self.preparePointsForSharedTooltip = preparePointsForSharedTooltip;
                            break;
                        case'fullstackedarea':
                        case'fullstackedline':
                            self.fullStacked = true;
                            self.adjustSeriesDimensions = stubFunction;
                            self.adjustSeriesValues = adjustStackedSeriesValues;
                            self.updateSeriesValues = stubFunction;
                            self.preparePointsForSharedTooltip = preparePointsForSharedTooltip;
                            break;
                        case'stackedarea':
                        case'stackedline':
                            self.adjustSeriesDimensions = stubFunction;
                            self.adjustSeriesValues = adjustStackedSeriesValues;
                            self.updateSeriesValues = stubFunction;
                            self.preparePointsForSharedTooltip = preparePointsForSharedTooltip;
                            break;
                        case'candlestick':
                        case'stock':
                            self.adjustSeriesDimensions = adjuistCandlestickSeriesDimensions;
                            self.adjustSeriesValues = stubFunction;
                            self.updateSeriesValues = stubFunction;
                            self.preparePointsForSharedTooltip = preparePointsForSharedTooltip;
                            break;
                        case'bubble':
                            self.adjustSeriesDimensions = adjustBubbleSeriesDimensions;
                            self.adjustSeriesValues = stubFunction;
                            self.updateSeriesValues = stubFunction;
                            self.preparePointsForSharedTooltip = preparePointsForSharedTooltip;
                            break;
                        default:
                            self.adjustSeriesDimensions = stubFunction;
                            self.adjustSeriesValues = stubFunction;
                            self.updateSeriesValues = stubFunction;
                            self.preparePointsForSharedTooltip = preparePointsForSharedTooltip;
                            break
                    }
                };
            var dispose = function() {
                    this.series = null;
                    this.translator = null
                };
            var add = function(series) {
                    var self = this,
                        singleSeries,
                        i;
                    if (!$.isArray(series))
                        series = [series];
                    for (i = 0; i < series.length; i++) {
                        singleSeries = series[i];
                        if (singleSeries.type.toLowerCase() === self.type)
                            self.series.push(singleSeries)
                    }
                };
            var adjustBarSeriesDimensionsCore = function(series, interval, stackCount, equalBarWidth, seriesStackIndexCallback) {
                    var spacing,
                        width,
                        maxWidth,
                        middleIndex,
                        stackIndex,
                        i,
                        point,
                        points,
                        seriesOffset,
                        stackName,
                        argumentsKeeper = {},
                        stackKeepers = {},
                        stacksWithArgument,
                        count,
                        round = Math.round;
                    if (equalBarWidth) {
                        width = equalBarWidth.width && equalBarWidth.width < 0 ? 0 : equalBarWidth.width;
                        spacing = equalBarWidth.spacing && equalBarWidth.spacing < 0 ? 0 : equalBarWidth.spacing;
                        if (width && !spacing)
                            if (stackCount > 1) {
                                spacing = round((interval * 0.7 - width * stackCount) / (stackCount - 1));
                                if (spacing < 1)
                                    spacing = 1
                            }
                            else
                                spacing = 0;
                        else if (spacing && !width) {
                            width = round((interval * 0.7 - spacing * (stackCount - 1)) / stackCount);
                            if (width < 2)
                                width = 2
                        }
                        else if (!spacing && !width) {
                            if (stackCount > 1) {
                                spacing = round(interval * 0.7 / stackCount * 0.2);
                                if (spacing < 1)
                                    spacing = 1
                            }
                            else
                                spacing = 0;
                            width = round((interval * 0.7 - spacing * (stackCount - 1)) / stackCount);
                            if (width < 2)
                                width = 2
                        }
                        if (width * stackCount + spacing * (stackCount - 1) > interval) {
                            spacing = round((interval * 0.7 - width * stackCount) / (stackCount - 1));
                            if (spacing < 1) {
                                spacing = 1;
                                maxWidth = round((interval * 0.7 - spacing * (stackCount - 1)) / stackCount)
                            }
                        }
                        middleIndex = stackCount / 2;
                        for (i = 0; i < series.length; i++) {
                            stackIndex = seriesStackIndexCallback(i);
                            points = series[i].getPoints();
                            seriesOffset = (stackIndex - middleIndex + 0.5) * (maxWidth || width) - (middleIndex - stackIndex - 0.5) * spacing;
                            $.each(points, function(_, point) {
                                point.correctCoordinates({
                                    width: width,
                                    offset: seriesOffset
                                })
                            })
                        }
                    }
                    else {
                        $.each(series, function(i, singleSeries) {
                            stackName = singleSeries.getStackName && singleSeries.getStackName();
                            stackName = stackName || i.toString();
                            if (!stackKeepers[stackName])
                                stackKeepers[stackName] = [];
                            stackKeepers[stackName].push(singleSeries)
                        });
                        $.each(series, function(i, singleSeries) {
                            $.each(singleSeries.getPoints(), function(_, point) {
                                var argument = point.argument;
                                if (!argumentsKeeper.hasOwnProperty(argument))
                                    argumentsKeeper[argument] = 1
                            })
                        });
                        for (var argument in argumentsKeeper) {
                            if (!argumentsKeeper.hasOwnProperty(argument))
                                continue;
                            stacksWithArgument = [];
                            $.each(stackKeepers, function(stackName, seriesInStack) {
                                $.each(seriesInStack, function(i, singleSeries) {
                                    point = singleSeries.getPointByArg(argument);
                                    if (point && point.value) {
                                        stacksWithArgument.push(stackName);
                                        return false
                                    }
                                })
                            });
                            count = stacksWithArgument.length;
                            spacing = round(interval * 0.7 / count * 0.2);
                            if (spacing < 1)
                                spacing = 1;
                            width = round((interval * 0.7 - spacing * (count - 1)) / count);
                            if (width < 2)
                                width = 2;
                            middleIndex = count / 2;
                            $.each(stackKeepers, function(stackName, seriesInStack) {
                                stackIndex = $.inArray(stackName, stacksWithArgument);
                                if (stackIndex === -1)
                                    return;
                                seriesOffset = (stackIndex - middleIndex + 0.5) * width - (middleIndex - stackIndex - 0.5) * spacing;
                                $.each(seriesInStack, function(i, singleSeries) {
                                    var point = singleSeries.getPointByArg(argument);
                                    if (point && point.value)
                                        point.correctCoordinates({
                                            width: width,
                                            offset: seriesOffset
                                        })
                                })
                            })
                        }
                    }
                };
            var adjustBarSeriesDimensions = function(translator) {
                    var debug = DX.utils.debug;
                    debug.assert(translator, 'translator was not passed or empty');
                    var self = this,
                        series = self.series,
                        equalBarWidth = self.equalBarWidth,
                        interval;
                    self.translator = translator;
                    interval = setInterval(self);
                    adjustBarSeriesDimensionsCore(series, interval, series.length, equalBarWidth, function(seriesIndex) {
                        return seriesIndex
                    })
                };
            var adjustStackedBarSeriesDimensions = function(translator) {
                    var debug = DX.utils.debug;
                    debug.assert(translator, 'translator was not passed or empty');
                    var self = this,
                        interval,
                        series = self.series,
                        stackIndexes = {},
                        stackCount = 0,
                        equalBarWidth = self.equalBarWidth;
                    $.each(series, function() {
                        var stackName = this.getStackName();
                        if (!stackIndexes.hasOwnProperty(stackName))
                            stackIndexes[stackName] = stackCount++
                    });
                    self.translator = translator;
                    interval = setInterval(self);
                    adjustBarSeriesDimensionsCore(series, interval, stackCount, equalBarWidth, function(seriesIndex) {
                        return stackIndexes[series[seriesIndex].getStackName()]
                    })
                };
            var adjustStackedSeriesValues = function() {
                    var self = this,
                        series = self.series,
                        stackKeepers = {
                            positive: {},
                            negative: {}
                        };
                    $.each(series, function(_, singleSeries) {
                        var points = singleSeries.getPoints();
                        $.each(points, function(index, point) {
                            var value = point.value,
                                argument = point.argument,
                                stackName = singleSeries.getStackName ? singleSeries.getStackName() : 'default',
                                valueType = value >= 0 ? 'positive' : 'negative',
                                currentStack;
                            stackKeepers[valueType][stackName] = stackKeepers[valueType][stackName] || {};
                            currentStack = stackKeepers[valueType][stackName];
                            if (currentStack[argument.valueOf()]) {
                                points[index].correctValue(currentStack[argument.valueOf()]);
                                currentStack[argument.valueOf()] += value
                            }
                            else
                                currentStack[argument.valueOf()] = value
                        })
                    });
                    setPercentStackedValues(series, stackKeepers, self.fullStacked)
                };
            var setPercentStackedValues = function(series, stackKeepers, fullStacked) {
                    $.each(series, function(_, singleSeries) {
                        var points = singleSeries.getPoints();
                        $.each(points, function(index, point) {
                            var value = point.value,
                                stackName = singleSeries.getStackName ? singleSeries.getStackName() : 'default',
                                valueType = value >= 0 ? 'positive' : 'negative',
                                currentStack;
                            stackKeepers[valueType][stackName] = stackKeepers[valueType][stackName] || {};
                            currentStack = stackKeepers[valueType][stackName];
                            points[index].setPercentValue(currentStack[point.argument.valueOf()], fullStacked)
                        })
                    })
                };
            var getMinShownBusinessValue = function(self, translator, minBarSize) {
                    var rotated = self.rotated,
                        canvas = translator.getCanvasVisibleArea();
                    if (minBarSize && !rotated)
                        return Math.abs(translator.untranslateY(canvas.minY) - translator.untranslateY(canvas.minY + minBarSize));
                    else if (minBarSize && rotated)
                        return Math.abs(translator.untranslateX(canvas.minX) - translator.untranslateX(canvas.minX + minBarSize))
                };
            var updateStackedSeriesValues = function(translator) {
                    var self = this,
                        series = self.series,
                        stackKeepers = {
                            positive: {},
                            negative: {}
                        };
                    $.each(series, function(_, singleSeries) {
                        var points = singleSeries.getPoints(),
                            minBarSize = singleSeries.styles && singleSeries.styles.minBarSize;
                        $.each(points, function(index, point) {
                            var value = point.value,
                                minValue = point.minValue,
                                argument = point.argument,
                                updateValue,
                                pointSize,
                                minShownBusinessValue,
                                stackName = singleSeries.getStackName ? singleSeries.getStackName() : 'default',
                                valueType = value >= 0 ? 'positive' : 'negative',
                                currentStack;
                            minShownBusinessValue = getMinShownBusinessValue(self, translator, minBarSize);
                            stackKeepers[valueType][stackName] = stackKeepers[valueType][stackName] || {};
                            currentStack = stackKeepers[valueType][stackName];
                            if (currentStack[argument.valueOf()]) {
                                pointSize = Math.abs(minValue - value);
                                if (minShownBusinessValue && pointSize < minShownBusinessValue && pointSize !== 0)
                                    updateValue = minShownBusinessValue;
                                else
                                    updateValue = Math.abs(value - minValue);
                                points[index].minValue = currentStack[argument.valueOf()];
                                points[index].value = currentStack[argument.valueOf()] + updateValue;
                                currentStack[argument.valueOf()] += updateValue
                            }
                            else {
                                pointSize = value;
                                if (minShownBusinessValue && pointSize < minShownBusinessValue && pointSize !== 0)
                                    updateValue = minShownBusinessValue;
                                else
                                    updateValue = value;
                                points[index].value = updateValue;
                                currentStack[argument.valueOf()] = updateValue
                            }
                        })
                    });
                    if (self.fullStacked)
                        updateFullStackedSeriesValues(series, stackKeepers)
                };
            var updateFullStackedSeriesValues = function(series, stackKeepers) {
                    $.each(series, function(_, singleSeries) {
                        var stackName = singleSeries.getStackName ? singleSeries.getStackName() : 'default',
                            points = singleSeries.getPoints();
                        $.each(points, function(index, point) {
                            var value = point.value,
                                argument = point.argument,
                                valueType = value >= 0 ? 'positive' : 'negative',
                                currentStack;
                            stackKeepers[valueType][stackName] = stackKeepers[valueType][stackName] || {};
                            currentStack = stackKeepers[valueType][stackName];
                            points[index].value = points[index].value / currentStack[argument.valueOf()] || 0;
                            if (DX.utils.isNumber(points[index].minValue))
                                points[index].minValue = points[index].minValue / currentStack[argument.valueOf()] || 0
                        })
                    })
                };
            var updateBarSeriesValues = function(translator) {
                    var self = this,
                        series = self.series,
                        rotated = self.rotated,
                        canvas = translator.getCanvasVisibleArea();
                    $.each(series, function(_, singleSeries) {
                        var points = singleSeries.getPoints(),
                            minBarSize = singleSeries.styles && singleSeries.styles.minBarSize;
                        $.each(points, function(index, point) {
                            var value = point.value,
                                updateValue,
                                pointSize,
                                minShownBusinessValue;
                            minShownBusinessValue = getMinShownBusinessValue(self, translator, minBarSize);
                            pointSize = Math.abs(value);
                            if (minShownBusinessValue && pointSize < minShownBusinessValue && pointSize !== 0)
                                updateValue = value > 0 ? minShownBusinessValue : -minShownBusinessValue;
                            else
                                updateValue = value;
                            points[index].value = updateValue
                        })
                    })
                };
            var adjuistCandlestickSeriesDimensions = function(translator) {
                    var debug = DX.utils.debug;
                    debug.assert(translator, 'translator was not passed or empty');
                    var self = this,
                        series = self.series,
                        interval;
                    self.translator = translator;
                    interval = setInterval(self);
                    adjustBarSeriesDimensionsCore(series, interval, series.length, true, function(seriesIndex) {
                        return seriesIndex
                    })
                };
            var setInterval = function(self) {
                    if (!self.rotated)
                        self.interval = self.translator.getIntervalX();
                    else
                        self.interval = self.translator.getIntervalY();
                    return self.interval
                };
            var adjustBubbleSeriesDimensions = function(translator) {
                    var debug = DX.utils.debug;
                    debug.assert(translator, 'translator was not passed or empty');
                    var self = this,
                        series = self.series,
                        points,
                        i,
                        minSize = 2,
                        maxSize = 0,
                        pointSize,
                        visibleArea = translator.getCanvasVisibleArea(),
                        min = Math.min(visibleArea.maxX - visibleArea.minX, visibleArea.maxY - visibleArea.minY);
                    for (i = 0; i < series.length; i++) {
                        points = series[i].getPoints();
                        $.each(points, function(_, point) {
                            maxSize = maxSize > point.size ? maxSize : point.size
                        })
                    }
                    for (i = 0; i < series.length; i++) {
                        points = series[i].getPoints();
                        $.each(points, function(_, point) {
                            pointSize = ~~(point.size * min * 0.1 / maxSize);
                            point.correctCoordinates(minSize < pointSize ? pointSize : minSize)
                        })
                    }
                };
            var preparePointsForSharedTooltip = function(tooltipOption) {
                    var stackPoints = [];
                    if (!tooltipOption.shared)
                        return;
                    $.each(this.series, function(i, singleSeries) {
                        var points = singleSeries.getPoints(),
                            stackName = singleSeries.getStackName();
                        $.each(points, function(index, point) {
                            var argument = point.argument,
                                argumentWithStackName = argument.valueOf() + ' ' + stackName;
                            if (!DX.utils.isArray(stackPoints[argumentWithStackName]))
                                stackPoints[argumentWithStackName] = [];
                            stackPoints[argumentWithStackName].push(point);
                            point.stackPoints = stackPoints[argumentWithStackName];
                            point.stackPoints.stackName = stackName
                        })
                    })
                };
            return {
                    ctor: ctor,
                    dispose: dispose,
                    add: add
                }
        }())
    })(jQuery, DevExpress);
    /*! Module viz-core, file factory.js */
    (function($, DX) {
        var viz = DX.viz,
            core = viz.core,
            charts = viz.charts,
            series = charts.series;
        charts.factory = function() {
            var createSeries = function(seriesType, renderer, options) {
                    options = options || {};
                    options.specificType = null;
                    seriesType = (String(seriesType) || '').toLowerCase();
                    switch (seriesType.toLowerCase()) {
                        case'line':
                            return new series.LineSeries(renderer, options);
                        case'fullstackedline':
                            options.specificType = 'fullstackedline';
                            return new series.LineSeries(renderer, options);
                        case'stackedline':
                            options.specificType = 'stackedline';
                            return new series.LineSeries(renderer, options);
                        case'area':
                            return new series.AreaSeries(renderer, options);
                        case'fullstackedarea':
                            options.specificType = 'fullstackedarea';
                            return new series.AreaSeries(renderer, options);
                        case'stackedarea':
                            options.specificType = 'stackedarea';
                            return new series.AreaSeries(renderer, options);
                        case'bar':
                            return new series.BarSeries(renderer, options);
                        case'fullstackedbar':
                            options.specificType = 'fullstackedbar';
                            return new series.BarSeries(renderer, options);
                        case'stackedbar':
                            options.specificType = 'stackedbar';
                            return new series.BarSeries(renderer, options);
                        case'spline':
                            return new series.SplineSeries(renderer, options);
                        case'splinearea':
                            return new series.SplineAreaSeries(renderer, options);
                        case'scatter':
                            return new series.ScatterSeries(renderer, options);
                        case'candlestick':
                            return new series.CandleStickSeries(renderer, options);
                        case'stock':
                            return new series.StockSeries(renderer, options);
                        case'rangearea':
                            return new series.RangeAreaSeries(renderer, options);
                        case'rangebar':
                            return new series.RangeBarSeries(renderer, options);
                        case'pie':
                            return new series.PieSeries(renderer, options);
                        case'doughnut':
                        case'donut':
                            options.specificType = 'doughnut';
                            return new series.PieSeries(renderer, options);
                        case'stepline':
                            return new series.StepLineSeries(renderer, options);
                        case'steparea':
                            return new series.StepAreaSeries(renderer, options);
                        case'bubble':
                            return new series.BubbleSeries(renderer, options);
                        default:
                            return null
                    }
                };
            var createSeriesFamily = function(options) {
                    return new series.SeriesFamily(options)
                };
            var createAxis = function(renderer, options) {
                    return new charts.Axis(renderer, options)
                };
            var createRenderer = function(options) {
                    return new viz.renderers.Renderer(options)
                };
            var createThemeManager = function(options, groupName) {
                    return new charts.ThemeManager(options, groupName)
                };
            var createLegend = function(options, group, trackerGroup) {
                    return new charts.Legend(options, group, trackerGroup)
                };
            var createTooltip = function(options, group) {
                    return new charts.Tooltip(options, group)
                };
            var createLoadIndicator = function(options, group) {
                    return new charts.LoadIndicator(options, group)
                };
            var createDataValidator = function(data, groups, incidentOccured, dataPrepareOptions) {
                    return new charts.DataValidator(data, groups, incidentOccured, dataPrepareOptions)
                };
            var createTracker = function(options) {
                    return new charts.Tracker(options)
                };
            var createTitle = function(renderer, canvas, options, group) {
                    return new charts.ChartTitle(renderer, canvas, options, group)
                };
            var createChartLayoutManager = function() {
                    return new charts.LayoutManager
                };
            var getAxisTickProvider = function() {
                    return core.tickProvider
                };
            return {
                    createSeries: createSeries,
                    createSeriesFamily: createSeriesFamily,
                    createAxis: createAxis,
                    getAxisTickProvider: getAxisTickProvider,
                    createRenderer: createRenderer,
                    createThemeManager: createThemeManager,
                    createLegend: createLegend,
                    createTooltip: createTooltip,
                    createLoadIndicator: createLoadIndicator,
                    createDataValidator: createDataValidator,
                    createTracker: createTracker,
                    createChartLayoutManager: createChartLayoutManager,
                    createTitle: createTitle
                }
        }()
    })(jQuery, DevExpress);
    DevExpress.MOD_VIZ_CORE = true
}