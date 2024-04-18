"use strict";
var Justify;
(function (Justify) {
    Justify[Justify["LEFT"] = 0] = "LEFT";
    Justify[Justify["RIGHT"] = 1] = "RIGHT";
    Justify[Justify["CENTER"] = 2] = "CENTER";
})(Justify || (Justify = {}));
var LineSide;
(function (LineSide) {
    LineSide[LineSide["TOP"] = 0] = "TOP";
    LineSide[LineSide["BOTTOM"] = 1] = "BOTTOM";
})(LineSide || (LineSide = {}));
function minimumParcelizedBox(startingWidth, startingHeight, ctx, scale, fontSizeGoal, expansionCheckMultiplier, padding, text) {
    let width = startingWidth;
    let height = startingHeight;
    let outgoingLines;
    const words = text.split(" ");
    ctx.font = fontSizeGoal * 2 + 'px Arial'; // set font size
    const metrics = ctx.measureText("");
    const lineHeight = (metrics.fontBoundingBoxDescent + metrics.fontBoundingBoxAscent + padding) / scale;
    while (true) {
        let totalHeight = { value: lineHeight };
        outgoingLines = splitByLines(ctx, scale, padding, totalHeight, words, width);
        // Check if totalHeight fits within
        if (totalHeight.value <= height - padding * 2) {
            return {
                height: height,
                width: width,
                text: {
                    fullTextLines: outgoingLines,
                    compressedTextLines: outgoingLines,
                    lineHeight: lineHeight,
                    compressed: false,
                    fontSize: fontSizeGoal
                }
            };
        }
        //Increase size slightly
        else {
            height *= expansionCheckMultiplier;
            width *= expansionCheckMultiplier;
        }
    }
}
function parcelizeText(ctx, scale, text, maxWidth, maxHeight, padding = 3, maxFontSize, minFontSize) {
    let words = text.split(' ');
    let lines = [];
    let totalHeight = { value: 0 };
    let fontSize = maxFontSize;
    while (fontSize > 0) {
        ctx.font = fontSize * 2 + 'px Arial'; // set font size
        totalHeight.value = fontSize;
        lines = splitByLines(ctx, scale, padding, totalHeight, words, maxWidth);
        // Check if totalHeight exceeds maxHeight
        if (totalHeight.value <= maxHeight - padding * 2)
            break;
        // Decrease font size and clear lines array
        fontSize--;
        lines = [];
    }
    const metrics = ctx.measureText("");
    const lineHeight = (metrics.fontBoundingBoxDescent + metrics.fontBoundingBoxAscent + padding) / scale;
    let compressedLines = [];
    let compressed = fontSize < minFontSize;
    if (compressed) {
        //We run it back, but it's only minimum size
        ctx.font = minFontSize * 2 + 'px Arial'; // set font size
        totalHeight.value = minFontSize;
        compressedLines = splitByLines(ctx, scale, padding, totalHeight, words, maxWidth, maxHeight);
    }
    else {
        compressedLines = lines;
    }
    return {
        compressed: compressed,
        compressedTextLines: compressedLines,
        fullTextLines: lines,
        lineHeight: lineHeight,
        fontSize: fontSize
    };
}
function splitByLines(ctx, scale, padding, totalHeight, words, maxWidth, maxHeight = -1) {
    let lines = [];
    let line = "";
    for (let i = 0; i < words.length; i++) {
        let testLine = line + words[i] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width / scale;
        const lineHeight = (metrics.fontBoundingBoxDescent + metrics.fontBoundingBoxAscent + padding) / scale;
        if (testWidth > maxWidth - padding * 2 && i > 0) {
            totalHeight.value += lineHeight;
            lines.push(line.trim());
            //If we have broken our line constraints
            if (maxHeight > 0 && totalHeight.value >= maxHeight) {
                line = line.slice(0, -3).trim() + "...";
                lines.pop();
                break;
            }
            line = words[i] + ' ';
        }
        else {
            line = testLine;
        }
    }
    lines.push(line.trim());
    return lines;
}
//For if we have already separately calculated text size and spacing
function drawWrappedTextPrecalculated(ctx, scale, x, y, maxWidth, maxHeight, parcel, padding = 3, justify = Justify.LEFT, verticalJustify = Justify.LEFT, lineSide = LineSide.TOP, color = 'black') {
    //console.log("Font size is: " + parcel.fontSize);
    //console.log("Is parcel compressed: " + parcel.compressed);
    ctx.font = parcel.fontSize * 2 + 'px Arial'; // set font size
    ctx.textBaseline = (lineSide == LineSide.TOP) ? "top" : "bottom";
    // Calculate the vertical position to center the text vertically
    //let startY = y + (maxHeight - totalHeight) / 2 + padding;
    let startY = y + padding;
    // Draw lines centered vertically, and justified by our justify
    for (let i = 0; i < parcel.compressedTextLines.length; i++) {
        let lineX;
        switch (justify) {
            case Justify.LEFT: {
                lineX = x + padding;
                break;
            }
            case Justify.RIGHT: {
                lineX = x + maxWidth - padding;
                break;
            }
            case Justify.CENTER: {
                lineX = x + maxWidth / 2 - ctx.measureText(parcel.compressedTextLines[i]).width / scale / 2;
                break;
            }
        }
        let lineY = startY + i * parcel.lineHeight;
        ctx.fillText(parcel.compressedTextLines[i], lineX * scale, lineY * scale);
    }
}
function drawWrappedText(ctx, scale, text, x, y, maxWidth, maxHeight, padding = 3, justify = Justify.LEFT, verticalJustify = Justify.LEFT, lineSide = LineSide.TOP, fontSize = 16, minFontSize = 0, color = 'black') {
    let parcel = parcelizeText(ctx, scale, text, maxWidth, maxHeight, padding, fontSize, minFontSize);
    drawWrappedTextPrecalculated(ctx, scale, x, y, maxWidth, maxHeight, parcel, padding, justify, verticalJustify, lineSide, color);
    return parcel;
}
function drawLinePoint(ctx, scale, start, end) {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
}
function drawLine(ctx, scale, startX, startY, endX, endY) {
    ctx.beginPath();
    ctx.moveTo(startX * scale, startY * scale);
    ctx.lineTo(endX * scale, endY * scale);
    ctx.stroke();
}
class ParsedDate {
    get minute() {
        return this._minute;
    }
    set minute(value) {
        this.needsRecalculating = true;
        this._minute = value;
    }
    get hour() {
        return this._hour;
    }
    set hour(value) {
        this.needsRecalculating = true;
        this._hour = value;
    }
    get day() {
        return this._day;
    }
    set day(value) {
        this.needsRecalculating = true;
        this._day = value;
    }
    get month() {
        return this._month;
    }
    set month(value) {
        this.needsRecalculating = true;
        this._month = value;
    }
    get year() {
        return this._year;
    }
    set year(value) {
        this.needsRecalculating = true;
        this._year = value;
    }
    constructor(year = null, month = null, day = null, hour = null, minute = null) {
        this.timeInMinutes = 0n;
        this.needsRecalculating = true;
        this._year = null;
        this._month = null;
        this._day = null;
        this._hour = null;
        this._minute = null;
        this._year = year;
        this._month = month;
        this._day = day;
        this._hour = hour;
        this._minute = minute;
    }
    getTimeInMinutes() {
        // If we haven't changed since we were last checked, recalculate and save values
        if (this.needsRecalculating) {
            this.needsRecalculating = false;
            //Start with minutes in a year
            let timeMin = multiplyBigIntByNumber(BigInt((this._year || 0)), 525948.768);
            let jsDate = new Date(0, (this._month || 0) + 1, (this._day || 0), (this._hour || 0), (this._minute || 0));
            //Add millisSinceEpoch, then convert to minutes
            let minutesSince0 = BigInt(Math.round((jsDate.getTime() + 2209050000000) / 60000));
            this.timeInMinutes = minutesSince0 + timeMin;
        }
        return this.timeInMinutes;
    }
    getMonth() {
        if (this._month == null) {
            return "";
        }
        let jsDate = new Date();
        jsDate.setMonth(this._month - 1);
        return jsDate.toLocaleString('default', { month: 'short' });
    }
    getFullMonth() {
        if (this._month == null) {
            return "";
        }
        let jsDate = new Date();
        jsDate.setMonth(this._month - 1);
        return jsDate.toLocaleString('default', { month: 'long' });
    }
    //This determines how many contiguous "levels" deep the date goes.
    getGranularityLevels() {
        let granularityLevels = 0n;
        let started = false;
        let levels = ["year", "month", "day", "hour"];
        //Don't change this to of, please.
        for (const level of levels) {
            // @ts-ignore
            if (this[level] != null) {
                started = true;
            }
            //If we started, but then hit a null value, end the search
            else if (started) {
                return granularityLevels;
            }
            granularityLevels++;
        }
        return granularityLevels;
    }
    asReadable(timelineConfig) {
        let dateWord = "";
        let started = false;
        //granularityLevels is used to determine whether we are done writing the date
        //If we have already finished writing the date (as in the date parser encountered a null value) we do not continue writing
        //This prevents wonky formats like "day/year" or specifying time down to the minute when the user didn't input a month or day
        //Each value will be checked to make sure it's allowed within the granularityScope of the date
        let granularityLevels = this.getGranularityLevels();
        //This just tells us how many levels deep into a date each level is
        let granularityIndex = new Map();
        granularityIndex.set("year", 1n);
        granularityIndex.set("month", 2n);
        granularityIndex.set("day", 3n);
        granularityIndex.set("hour", 4n);
        //formatSequence represents the different levels of the date in order to write it out as plain text
        let formatSequence;
        if (timelineConfig.metricDateFormat) {
            //Format order for weird people like Europeans (and Africans (and Asians (and Australians (and Canadians (and South Americans (and Mexicans (and Central Americans (and Caribbean Islanders sometimes. idk about Jamaica and Haiti and Cuba and the other Caribbean Islands, but I know Puerto Ricans use both (and scientists and engineers and doctors and nerds))))))))) but other than those people NOBODY uses this GROSS format
            formatSequence = ["day", "month", "year"];
        }
        else {
            //Format order for normal people. Like Americans. And Saudi Arabians and Filipinos sometimes (bet you weren't expecting to learn something from code comments today, were you?).
            formatSequence = ["month", "day", "year"];
        }
        for (let level of formatSequence) {
            // @ts-ignore
            //If we are deeper than the granularity scope, skip this level
            if (granularityIndex.get(level) > granularityLevels) {
                continue;
            }
            //We first check if there is a value. Since the user can leave levels blank, we don't want to show those levels
            // @ts-ignore
            if (this[level] != null) {
                //If we have already started writing the date, add the slash to separate date levels in numerical or a space in text
                if (started) {
                    dateWord += timelineConfig.languageDateFormat ? ' ' : '/';
                }
                else {
                    started = true;
                }
                // @ts-ignore
                // If we are adding negative year, add bc suffix
                if (this[level] < 0 && level == "year") {
                    // @ts-ignore
                    dateWord += -this[level] + " b.c.";
                }
                // If we are adding a month in language
                else if (timelineConfig.languageDateFormat && level == "month") {
                    dateWord += this.getMonth();
                }
                else {
                    // @ts-ignore
                    dateWord += this[level];
                }
            }
        }
        //Time
        // @ts-ignore
        if (this._hour != null && this._minute != null && granularityIndex.get("hour") <= granularityLevels) {
            if (started) {
                dateWord += ' ';
            }
            if (timelineConfig.metricTimeFormat) {
                //24-hour time formatting
                dateWord += `${this._hour}:${this._minute.toString().padStart(2, '0')}`;
            }
            else {
                //12-hour time formatting (weird, gross, inconvenient, inconsistent, and more work for me :( )
                dateWord += `${(this._hour % 12 || 12)}:${this._minute.toString().padStart(2, '0')} ${this._hour < 12 ? 'a.m.' : 'p.m.'}`;
            }
        }
        if (timelineConfig.languageDateFormat) {
            //If it's just the name of the month, return full name instead
            if (dateWord == this.getMonth()) {
                return this.getFullMonth();
            }
        }
        return dateWord;
    }
}
function multiplyBigIntByNumber(a, b) {
    let shiftCount = 0;
    let maxSize = Number.MAX_SAFE_INTEGER / b;
    while (a > maxSize) {
        shiftCount++;
        a = a >> 1n;
        if (shiftCount > 50) {
            return 0n;
        }
    }
    let val = BigInt(Math.round(Number(a) * b));
    for (let i = 0; i < shiftCount; i++) {
        val = val << 1n;
    }
    return val;
}
function parseDate(input) {
    const result = new ParsedDate();
    // Regular expressions for matching different date and time components
    const monthRegex = /(\d{1,2})m/;
    const dayRegex = /(\d{1,2})d/;
    const timeRegex = /(\d{1,2}):(\d{1,2})t/;
    // Extract year in its own separate function because it's a tad too complex for a single regex match
    result.year = extractYear(input);
    // Match month
    const monthMatch = input.match(monthRegex);
    if (monthMatch) {
        result.month = parseInt(monthMatch[1]);
    }
    // Match day
    const dayMatch = input.match(dayRegex);
    if (dayMatch) {
        result.day = parseInt(dayMatch[1]);
    }
    // Match time (hour and minute)
    const timeMatch = input.match(timeRegex);
    if (timeMatch) {
        result.hour = parseInt(timeMatch[1]);
        result.minute = parseInt(timeMatch[2]);
    }
    return result;
}
function parseDateFromJavascript(input) {
    return new ParsedDate(input.getFullYear(), 
    //Month must be incremented
    input.getMonth() + 1, input.getDate(), input.getHours(), input.getMinutes());
}
/*function extractYear(input: string): number | null {
    // Regular expression for matching the year with optional BC suffix
    const yearRegex = /(?:^|\s)(?:b\.c\.?e?|bce?|bc)?\s*(\d+)\s*y/i;

    const yearMatch = input.match(yearRegex);
    if (yearMatch) {
        let yearValue = parseInt(yearMatch[1]);
        // If BC suffix is found, convert the year to negative
        if (/b\.c\.?e?|bce?|bc/i.test(yearMatch[0])) {
            yearValue *= -1;
        }
        return yearValue;
    }

    return null; // Return null if no year is found
}*/
function extractYear(input) {
    //Find the position of the first 'y' character
    const yIndex = input.indexOf('y');
    let isNegative = false;
    if (yIndex === -1) {
        return null; //Return null if 'y' is not found
    }
    //Traverse backward from 'y' position to find BC suffix or start of number sequence
    let startIndex = yIndex;
    startIndex--;
    while (startIndex >= 0) {
        const char = input[startIndex];
        //Test if current character is a digit.
        if (/\d/.test(char)) {
            //Start of number sequence found, continue until non-digit character is encountered
            while (startIndex >= 0 && /\d/.test(input[startIndex])) {
                startIndex--;
            }
            //Test if current character is a number
        }
        else if (/\s/.test(char)) {
            // Skip whitespace characters
            startIndex--;
        }
        else {
            let possiblePrefix = input.slice(Math.max(0, startIndex - 5), startIndex + 1);
            //Check for BC prefix
            const bcMatch = containsBCPrefix(possiblePrefix);
            if (bcMatch) {
                isNegative = true;
                break;
            }
            else {
                break;
            }
        }
    }
    //Extract the substring containing the year and BC suffix (if any)
    const yearString = input.slice(startIndex + 1, yIndex + 1).trim();
    //Parse the year string and handle BC suffix
    let yearValue = parseInt(yearString);
    if (isNegative) {
        yearValue *= -1;
    }
    return yearValue;
}
//ChatGPT wrote this, I'm not even gonna lie. RegEx is hard :(
// ^ my IDE is complaining that my comments are too "informal"??? Bruh, that's what comments ARE!
function containsBCPrefix(possiblePrefix) {
    // Regular expression pattern to match any valid form of "bc"
    const bcRegex = /b(?:\.c(?:\.e?)?)?/i;
    return bcRegex.test(possiblePrefix);
}
class Point {
    constructor(x, y) {
        this.x = Number(x);
        this.y = Number(y);
    }
    static add(a, b) {
        return new Point(a.x + b.x, a.y + b.y);
    }
}
Point.prototype.toString = function pointToString() {
    return `(${this.x}, ${this.y})`;
};
function bigint_min(...args) {
    if (args.length < 1) {
        throw 'Min of empty list';
    }
    let m = args[0];
    args.forEach(a => { if (a < m) {
        m = a;
    } });
    return m;
}
function bigint_max(...args) {
    if (args.length < 1) {
        throw 'Max of empty list';
    }
    let m = args[0];
    args.forEach(a => { if (a > m) {
        m = a;
    } });
    return m;
}
class LayoutManager {
    static setScaledEventPositions(timeline, startingPoint) {
        //console.log("Recalculating");
        let points = [startingPoint];
        let widthSum;
        let heightSum;
        let trueWidthSum = 0;
        let trueHeightSum = 0;
        const standardYStep = timeline.getStandardYStep();
        const standardXStep = timeline.getStandardXStep();
        const events = timeline.events;
        const timelineConfig = timeline.timelineConfig;
        if (timeline.events.length > 1) {
            widthSum = standardXStep * (events.length - 1);
            heightSum = standardYStep * (events.length - 1);
        }
        else {
            widthSum = standardXStep;
            heightSum = standardYStep;
        }
        if (timelineConfig.dateSort && events.length > 1) {
            // When dateSort is true, calculate proportional distances
            // Find the min and max times to understand the timeline span
            const times = events.map(e => e.date.getTimeInMinutes());
            const minTime = bigint_min(...times);
            const maxTime = bigint_max(...times);
            const timeSpan = maxTime - minTime;
            let currentTime = minTime;
            let step = startingPoint;
            // Calculate positions based on time proportion (we start at 1 because startingPoint is standard)
            for (let i = 1; i < events.length; i++) {
                let timeGap = events[i].date.getTimeInMinutes() - currentTime;
                currentTime += timeGap;
                const timeProportion = Number(timeGap) / Number(timeSpan);
                //Do not go under standard x step
                const jump = new Point(timelineConfig.verticalLayout ? 0 : Math.max((widthSum * timeProportion), standardXStep), timelineConfig.verticalLayout ? Math.max((heightSum * timeProportion), standardYStep) : 0);
                step = Point.add(step, jump);
                points.push(step);
            }
            trueWidthSum = step.x;
            trueHeightSum = step.y;
        }
        else {
            // Use fixed spacing as before
            let step = new Point(timelineConfig.verticalLayout ? 0 : standardXStep, timelineConfig.verticalLayout ? standardYStep : 0);
            for (let i = 1; i < events.length; i++) {
                let lastPoint = points[points.length - 1];
                points.push(Point.add(lastPoint, step));
                trueWidthSum += step.x;
                trueHeightSum += step.y;
            }
        }
        if (points.length < events.length) {
            throw new Error(`Less points than events! ${points.length} instead of ${events.length}.`);
        }
        timeline.points = points;
        timeline.totalWidth = trueWidthSum - standardXStep * (timelineConfig.eventCount - 1);
        timeline.totalHeight = trueHeightSum - standardYStep * (timelineConfig.eventCount - 1);
    }
}
class Timeline {
    constructor(canvasElement) {
        //The events on the timeline
        this.events = [];
        //The points at which the events are drawn
        this.points = [];
        //The total width of the timeline
        this.totalWidth = 0;
        this.totalHeight = 0;
        //Create default TimelineConfig
        this.timelineConfig = new TimelineConfig();
        //This is how far along the timeline you are
        this.shift = new Point(0, 0);
        this.mouseHeld = false;
        this.clickOriginX = 0;
        this.clickOriginY = 0;
        this.atStart = true;
        this.savedPoint = new Point(0, 0);
        this.canvas = canvasElement;
        // @ts-ignore
        this.context = canvasElement.getContext('2d');
        //this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('click', (event) => {
            this.handleClick(event);
        });
        this.canvas.addEventListener('mousemove', (event) => {
            this.handleMouseMove(event);
        });
        this.canvas.addEventListener('mouseup', (event) => {
            this.handleMouseUp(event);
        });
        this.canvas.addEventListener('mousedown', (event) => {
            this.handleMouseDown(event);
        });
        this.canvas.addEventListener('mouseout', (event) => {
            this.handleMouseOut(event);
        });
        this.canvas.addEventListener("dblclick", (event) => {
            this.handleDoubleClick(event);
        });
        this.scaleCanvas();
        this.reloadTimeline(true, true);
        /*let query = {
        "q": [
            "This should translate automatically."
        ],
        "target" : "${this.timelineConfig.userLanguage}"
        
        };

        let apiUrl = 'https://translation.googleapis.com/language/translate/v2';

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(query);
        })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error('Error:', error));

        //console.log()*/
    }
    configure(json) {
        let needsResetting = this.timelineConfig.reconfigure(json);
        this.reloadTimeline(needsResetting, needsResetting);
    }
    resize() {
        this.resizeEvents();
        this.reloadTimeline(true, true);
    }
    get resolutionScale() {
        return this.timelineConfig.resolutionScale;
    }
    // This does nothing but draw a rectangle on your canvas, padded by "edge" amount of pixels.
    drawTest(edge) {
        this.context.fillStyle = '#05EFFF';
        this.context.fillRect(this.getLeft() + edge, this.getTop() + edge, this.getWidth() - (edge * 4), this.getHeight() - (edge * 4));
    }
    //region basic getters for dimensioning
    // Get the rectangle that bounds the canvas.
    getBoundingRectangle() {
        return this.canvas.getBoundingClientRect();
    }
    getWidth() {
        return this.getBoundingRectangle().width;
    }
    getHeight() {
        return this.getBoundingRectangle().height;
    }
    getLeft() {
        return this.getBoundingRectangle().left;
    }
    getTop() {
        return this.getBoundingRectangle().top;
    }
    //endregion
    getStandardXStep() {
        return (this.getWidth() / this.timelineConfig.eventCount);
    }
    getStandardYStep() {
        return (this.getHeight() / this.timelineConfig.eventCount);
    }
    draw() {
        let context = this.context;
        const width = this.getWidth();
        const height = this.getHeight();
        // Clear the canvas
        context.clearRect(0, 0, width * this.resolutionScale, height * this.resolutionScale);
        context.lineWidth = 1;
        if (this.events.length > 0) {
            // Draw the line from the first node to the last node
            drawLine(context, this.resolutionScale, this.points[0].x + this.shift.x, this.points[0].y + this.shift.y, this.points[this.points.length - 1].x + this.shift.x, this.points[this.points.length - 1].y + this.shift.y);
            const drawnEvents = [];
            //for (const eventIndex in this.events) {
            for (let eventIndex = 0; eventIndex < this.events.length; eventIndex++) {
                let event = this.events[eventIndex];
                let x = this.points[eventIndex].x + this.shift.x;
                let y = this.points[eventIndex].y + this.shift.y;
                //If we are off the left side or top, don't draw it
                if (x <= -this.getStandardXStep() || y <= -this.getStandardYStep()) {
                    continue;
                }
                event.draw(context, this, x, y);
                drawnEvents.push(event);
                //If we are off the right side or bottom, stop drawing
                if (x >= width || y >= height - this.getTop()) {
                    break;
                }
            }
            for (let event of drawnEvents) {
                event.drawLate(context, this);
            }
        }
    }
    //Add a simple text-only event to the timeline.
    addEvent(title, body, date = "", titleTranslations = "{}", translations = "{}") {
        let parsedDate;
        //Javascript you scare me sometimes :(
        if (typeof date === "string") {
            parsedDate = parseDate(date);
        }
        else if (date instanceof String) {
            parsedDate = parseDate(date.toString());
        }
        else {
            parsedDate = parseDateFromJavascript(date);
        }
        let titleTranslationDictionary = JSON.parse(titleTranslations);
        let translationDictionary = JSON.parse(translations);
        let timelineEvent = new TimelineEvent(body, title, parsedDate, titleTranslationDictionary, translationDictionary);
        timelineEvent.height = this.getHeight() / 3;
        this.events.push(timelineEvent);
        this.reloadTimeline(false, true);
    }
    //Remove ALL events with a title matching <title>.
    removeEvent(title) {
        this.events = this.events.filter(function (timelineEvent) { return timelineEvent.getTitle(null) !== title; });
        this.reloadTimeline(true, true);
    }
    scaleCanvas() {
        this.canvas.style.width = this.getWidth() + 'px';
        this.canvas.style.height = this.getHeight() + 'px';
        this.canvas.width = this.getWidth() * this.resolutionScale;
        this.canvas.height = this.getHeight() * this.resolutionScale;
    }
    // Function to handle click events
    handleClick(e) {
        /*
        //Adjust this by bounding rect
        let mouseX = e.clientX - this.getLeft();
        // Check if right side clicked
        if (mouseX >= this.getWidth() - 150 && mouseX <= this.getWidth()) {
            // Scroll timeline left
            this.xShift -= 120;
            this.clampXShift();
            this.draw();
        }


        // Check if left side clicked
        else if (mouseX >= 0 && mouseX <= 150) {
            // Scroll timeline right
            this.xShift += 120;
            this.clampXShift();
            this.draw();
        }
         */
    }
    clampShift() {
        if (this.timelineConfig.verticalLayout) {
            let minShiftY = -this.totalHeight;
            //clamp y
            if (this.shift.y < minShiftY) {
                this.shift.y = minShiftY;
            }
            else if (this.shift.y > 0) {
                this.shift.y = 0;
            }
        }
        else {
            let minShiftX = -this.totalWidth;
            //clamp x
            if (this.shift.x < minShiftX) {
                this.shift.x = minShiftX;
            }
            else if (this.shift.x > 0) {
                this.shift.x = 0;
            }
        }
    }
    handleMouseMove(e) {
        if (this.mouseHeld) {
            this.atStart = false;
            //Shift the timeline vertically if we are vertical
            if (this.timelineConfig.verticalLayout) {
                //Calculate how far the mouse was dragged horizontally
                let mouseY = e.clientY - this.getTop();
                let yChange = mouseY - this.clickOriginY;
                //Record new Y position
                this.clickOriginY = mouseY;
                this.shift.y += yChange;
            }
            //Horizontally if we are horizontal
            else {
                //Calculate how far the mouse was dragged horizontally
                let mouseX = e.clientX - this.getLeft();
                let xChange = mouseX - this.clickOriginX;
                //Record new X position
                this.clickOriginX = mouseX;
                this.shift.x += xChange;
            }
            this.reloadTimeline();
        }
        for (const event of this.events) {
            event.onMouseMove(e, this);
        }
    }
    handleMouseDown(e) {
        let mouseX = e.clientX - this.getLeft();
        let mouseY = e.clientY - this.getTop();
        //If the mouse went down in the canvas
        if (mouseX > 0 &&
            mouseX < this.getWidth() &&
            mouseY > 0 &&
            mouseY < this.getHeight()) {
            //Start dragging
            this.mouseHeld = true;
            this.clickOriginX = mouseX;
            this.clickOriginY = mouseY;
        }
    }
    handleMouseUp(e) {
        this.mouseHeld = false;
    }
    handleMouseOut(event) {
        this.mouseHeld = false;
    }
    handleDoubleClick(event) {
        if (this.atStart) {
            //Return to saved point
            this.shift = this.savedPoint;
            this.clampShift();
            this.atStart = false;
        }
        else {
            //Go to the start
            this.savedPoint = this.shift;
            this.shift = new Point(0, 0);
            this.atStart = true;
        }
        this.draw();
    }
    sort() {
        if (this.timelineConfig.dateSort) {
            this.events = this.events.sort((a, b) => {
                // Compare years
                /*const aYear = a.date.year ?? 0;
                const bYear = b.date.year ?? 0;
                if (a.date.year !== b.date.year) {
                    return aYear - bYear;
                }

                // Compare months, treating null as 0
                const aMonth = a.date.month ?? 0;
                const bMonth = b.date.month ?? 0;
                if (aMonth !== bMonth) {
                    return aMonth - bMonth;
                }

                // Compare days, treating null as 0
                const aDay = a.date.day ?? 0;
                const bDay = b.date.day ?? 0;
                if (aDay !== bDay) {
                    return aDay - bDay;
                }

                // Compare hours, treating null as 0
                const aHour = a.date.hour ?? 0;
                const bHour = b.date.hour ?? 0;
                if (aHour !== bHour) {
                    return aHour - bHour;
                }

                // Finally, compare minutes, treating null as 0
                const aMinute = a.date.minute ?? 0;
                const bMinute = b.date.minute ?? 0;
                return aMinute - bMinute;*/
                return Number(a.date.getTimeInMinutes() - b.date.getTimeInMinutes());
            });
        }
    }
    reloadTimeline(reset = false, reposition = false) {
        this.sort();
        if (reset) {
            //Navigate back to the start of the timeline
            this.shift = new Point(0, 0);
            this.savedPoint = new Point(0, 0);
            this.atStart = true;
            this.scaleCanvas();
            for (let event of this.events) {
                event.invalidateParcel();
            }
        }
        if (reposition) {
            this.repositionTimeline();
        }
        this.resizeEvents();
        this.clampShift();
        this.draw();
    }
    resizeEvents() {
        //Add the equivalent of 3 events of whitespace
        let width = this.getWidth() / (this.timelineConfig.eventCount + 3);
        if (this.timelineConfig.layoutTechnique == "mixed") {
            //Double wide if we are using mixed layout
            width = width * 2;
        }
        for (let e of this.events) {
            e.width = width;
        }
    }
    repositionTimeline() {
        let startingPoint;
        if (this.timelineConfig.verticalLayout) {
            // Full y step in vertical
            startingPoint = Point.add(this.shift, new Point(this.getWidth() / 2, this.getStandardYStep()));
        }
        else {
            // Only half a step in horizontal
            startingPoint = Point.add(this.shift, new Point(this.getStandardXStep() / 2, this.getHeight() / 2));
        }
        LayoutManager.setScaledEventPositions(this, startingPoint);
    }
}
class TimelineConfig {
    constructor() {
        // Number of events that are shown per canvas width
        this.eventCount = 5;
        // Whether to scale the space between events to match dates
        // TODO implement this
        this.actualScale = false;
        // Whether we are drawing vertically
        this.verticalLayout = false;
        // Padding between wall and text
        this.padding = 3;
        // Whether to draw the line separating the title from the body
        this.drawDividerLine = true;
        // The highlight color of the timeline
        this.highlightColor = "#9c1124";
        // Whether to sort by date, or by entry order
        this.dateSort = true;
        // Whether to use metric or American date format (default: false (American))
        this.metricDateFormat = false;
        // Whether to use metric (24-hour) or American (12-hour) time format (default: true (24-hour))
        this.metricTimeFormat = true;
        // Whether the dates are written in plain language or as a numerical date (default: false (numerical))
        this.languageDateFormat = false;
        // "layoutTechnique" takes one of three values: "normal", "flipped", and "mixed". If it has normal layout, events are drawn below/right of the timeline, flipped is the opposite, and mixed alternates.
        this.layoutTechnique = "normal";
        // How much to multiply canvas contents, since contents are normally grainy and low-resolution (damn you, outdated HTML elements! Damn, you!)
        this.resolutionScale = 2;
        // Yeah, man. This explains itself.
        this.maxFontSize = 16;
        // Same thing.
        this.minFontSize = 12;
        // Time it takes (in milliseconds) for the timeline popups to expand to full size.
        this.popupTime = 500;
        // "Developer" values. These are values that affect internal functions. Improper config can break the site, and it is unlikely you will ever need to tweak these. Here be dragons.
        // This is the factor by which a box is increased to find the box of best fit around text. For example, when finding the smallest possible box that can fit a piece of text.
        // Higher values will make a minor performance improvement, but worse fit. Smaller values will require slightly more calculation the first time a popup is opened, but will make a much cleaner fit.
        // !!! Values less than or equal to '1' will cause an infinite loop and break the site.
        this.fitExpansionRate = 1.01;
        this.configurableFields = ["eventCount", "actualScale", "verticalLayout", "layoutTechnique", "padding", "drawDividerLine", "highlightColor", "dateSort", "metricDateFormat", "metricTimeFormat", "languageDateFormat", "resolutionScale", "maxFontSize", "minFontSize", "popupTime",
            "fitExpansionRate"];
        // Fields that, when changed, force the timeline to reset to prevent it breaking
        this.resettingFields = ["eventCount", "actualScale", "verticalLayout", "dateSort", "layoutTechnique", "resolutionScale", "maxFontSize", "minFontSize"];
        // Nonconfigurables
        this.userLanguage = navigator.language;
    }
    //Example JSON:
    /*
    {
        "eventCount" : 3,
        "actualScale" : false,
        "verticalLayout" : true,
        "layoutTechnique" : "mixed",
        "padding" : 4,
        "drawDividerLine" : false,
        "highlightColor" : "blue",
        "dateSort" : false,
        "metricDateFormat" : true,
        "metricTimeFormat" : true,
        "languageDateFormat" : true,
        "resolutionScale" : 1,
        "maxFontSize" : 20,
        "minFontSize" : 12,
        "popupTime" : 0
    }

    This should NOT be called by the user. call Timeline.configure() instead, to make sure the timeline reloads automatically.

    Returns true if the timeline needs to be reset. For example, if a field like verticalLayout was changed.
    */
    reconfigure(json) {
        const jsonConfiguration = JSON.parse(json);
        let needsResetting = false;
        this.configurableFields.forEach(fieldName => {
            if (this.addConfigurationItem(jsonConfiguration, fieldName)) {
                needsResetting = true;
            }
        });
        return needsResetting;
    }
    addConfigurationItem(jsonObject, name) {
        if (name in jsonObject) {
            // The compiler hates this, but this works as long as the configurableFields is properly written.
            // @ts-ignore
            this[name] = jsonObject[name];
            return this.resettingFields.includes(name, 0);
        }
        return false;
    }
}
class TimelineEvent {
    constructor(text, title, date, titleTranslations, translations) {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.savedParcel = null;
        this.popupParcel = null;
        this.translations = {};
        this.titleTranslations = {};
        //Whether the user is hovering over us
        this.hovered = false;
        this.popup = false;
        this.hoverTimeout = null; // Holds the timeout ID
        // 1 second to start popping out
        this.popupTime = 1000;
        this.animationStartTime = null;
        this.text = text;
        this.title = title;
        this.date = date;
        this.translations = translations;
        this.titleTranslations = titleTranslations;
    }
    //Gets the title, translated into the users local language if possible
    getTitle(language) {
        if (language != null) {
            if (language in this.titleTranslations) {
                // @ts-ignore
                return this.titleTranslations[language];
            }
        }
        return this.title;
    }
    //Gets the body, translated into the users local language if possible
    getBody(language) {
        if (language != null) {
            if (language in this.translations) {
                // @ts-ignore
                return this.translations[language];
            }
        }
        return this.text;
    }
    onMouseMove(event, timeline) {
        let mouseX = event.clientX - timeline.getLeft();
        let mouseY = event.clientY - timeline.getTop();
        let redrawNeeded = false;
        let currentlyHovered = this.checkIfPointInBox(mouseX, mouseY, this.getTrueWidth(timeline.timelineConfig.verticalLayout), this.getTrueHeight(timeline.timelineConfig.verticalLayout));
        if (currentlyHovered && !this.hovered) {
            // Mouse has entered the box, start the timer
            this.hovered = true;
            redrawNeeded = true;
            // Clear any existing timeout to ensure we don't have duplicates
            if (this.hoverTimeout)
                clearTimeout(this.hoverTimeout);
            // Since Javascript browsers have nice support for delayed stuff :)
            this.hoverTimeout = window.setTimeout(() => {
                this.popup = true;
                timeline.draw();
            }, this.popupTime);
        }
        else if (!currentlyHovered && this.hovered) {
            // Reset everything
            this.hovered = false;
            this.popup = false;
            if (this.hoverTimeout) {
                clearTimeout(this.hoverTimeout); // Clear the timer
            }
            this.hoverTimeout = null;
            redrawNeeded = true;
        }
        else if (!currentlyHovered) {
            // Reset animation state after user un-hovered
            this.animationStartTime = null;
        }
        if (redrawNeeded) {
            timeline.draw();
        }
    }
    checkIfPointInBox(x, y, width, height) {
        return (this.x < x && x < this.x + width && this.y < y && y < this.y + height);
    }
    invalidateParcel() {
        this.savedParcel = null;
        this.popupParcel = null;
        //console.log("Killing old parcel for event " + this.getTitle());
    }
    draw(context, timeline, x, y) {
        let timelineConfig = timeline.timelineConfig;
        let width = this.width;
        let height = this.height;
        const scale = timeline.resolutionScale;
        let flip = timelineConfig.layoutTechnique == "flipped";
        if (timelineConfig.layoutTechnique == "mixed") {
            //We determine the flip side via index
            flip = !!(timeline.events.indexOf(this) % 2);
        }
        if (timelineConfig.verticalLayout) {
            // noinspection JSSuspiciousNameCombination
            width = this.height;
            // noinspection JSSuspiciousNameCombination
            height = this.width;
        }
        // Initial setup for horizontal layout
        let leftBound = x - (width / 2);
        let topBound = flip ? y - height - 20 : y + 10; // Adjust based on flip for horizontal layout
        let headerHeight = height / 4;
        let bodyHeight = height * 3 / 4;
        // Adjustments for vertical layout
        if (timelineConfig.verticalLayout) {
            leftBound = flip ? x - width - 10 : x + 10; // Move box to left or right of the timeline based on flip
            topBound = y - (height / 2); // Center box vertically around y
        }
        this.x = leftBound;
        this.y = topBound;
        // Draw event circle
        context.beginPath();
        context.arc(x * scale, y * scale, 5 * scale, 0, Math.PI * 2);
        context.fillStyle = timelineConfig.highlightColor;
        context.fill();
        // Draw date
        if (timelineConfig.dateSort) {
            let dateY;
            let justifyY;
            if (timelineConfig.verticalLayout) {
                dateY = topBound;
                justifyY = LineSide.BOTTOM;
            }
            else {
                dateY = flip ? y + 10 : y - 10;
                justifyY = flip ? LineSide.TOP : LineSide.BOTTOM;
            }
            drawWrappedText(context, scale, this.date.asReadable(timelineConfig), leftBound, dateY, width, headerHeight / 2, 0, Justify.CENTER, Justify.CENTER, justifyY);
        }
        // Draw header
        drawWrappedText(context, scale, this.getTitle(timelineConfig.userLanguage), leftBound, topBound, width, headerHeight, timelineConfig.padding, Justify.CENTER, Justify.CENTER);
        // Draw body text
        // Calculate it if it hasn't already been calculated
        if (this.savedParcel == null) {
            this.savedParcel = drawWrappedText(context, scale, this.getBody(timelineConfig.userLanguage), leftBound, topBound + headerHeight, width, bodyHeight, timelineConfig.padding, Justify.LEFT, Justify.CENTER, LineSide.TOP, timelineConfig.maxFontSize, timelineConfig.minFontSize);
        }
        // Or just use parcel if we have it
        else {
            drawWrappedTextPrecalculated(context, scale, leftBound, topBound + headerHeight, width, bodyHeight, this.savedParcel, timelineConfig.padding);
        }
        //Draw thicker if we are being hovered or popped out
        //context.lineWidth = this.hovered ? 3 : 1;
        context.lineWidth = (this.hovered || this.popup) ? 3 : 1;
        // Draw divider line
        if (timelineConfig.drawDividerLine) {
            drawLine(context, scale, leftBound + timelineConfig.padding, topBound + headerHeight, leftBound + width - timelineConfig.padding, topBound + headerHeight);
        }
        // Draw event box
        context.beginPath();
        context.rect(leftBound * scale, topBound * scale, width * scale, height * scale);
        context.stroke();
    }
    //Draw the popup only after all other things have been drawn
    drawLate(context, timeline) {
        if (this.popup) {
            const config = timeline.timelineConfig;
            const scale = timeline.resolutionScale;
            //Get the parcelized box if we don't already have it
            if (!this.popupParcel) {
                this.popupParcel = minimumParcelizedBox(this.getTrueWidth(config.verticalLayout), this.getTrueHeight(config.verticalLayout), context, scale, config.maxFontSize, config.fitExpansionRate, config.padding, this.getBody(config.userLanguage));
            }
            if (this.animationStartTime === null) {
                this.animationStartTime = performance.now();
            }
            let now = performance.now();
            let elapsed = now - this.animationStartTime;
            let progress = Math.min(elapsed / config.popupTime, 1); // Ensure progress doesn't exceed 1
            let position = this.getPopupPosition(timeline, this.popupParcel);
            let targetWidth = this.popupParcel.width;
            let targetHeight = this.popupParcel.height;
            let currentWidth = targetWidth * progress;
            let currentHeight = targetHeight * progress;
            let truePosition = { x: position.x + (currentWidth * position.horizontalMultiplier), y: position.y + (currentHeight * position.verticalMultiplier) };
            // Draw popup with current size
            context.beginPath();
            context.fillStyle = "white";
            context.fillRect(truePosition.x * scale, truePosition.y * scale, currentWidth * scale, currentHeight * scale);
            context.fillStyle = "black";
            context.strokeRect(truePosition.x * scale, truePosition.y * scale, currentWidth * scale, currentHeight * scale);
            // Continue the animation if not complete
            if (progress < 1) {
                requestAnimationFrame(() => timeline.draw()); // Redraw the canvas
            }
            else {
                context.fillStyle = config.highlightColor;
                drawWrappedTextPrecalculated(context, timeline.resolutionScale, truePosition.x, truePosition.y, this.popupParcel.width, this.popupParcel.height, this.popupParcel.text, config.padding);
            }
        }
        /*const scale = timeline.resolutionScale



        context.fillStyle = "blue";

        // Draw event circle
        context.beginPath();
        context.arc(this.x * scale, this.y * scale, 5 * scale, 0, Math.PI * 2);
        context.fill();
        context.lineWidth = 5;
        context.strokeStyle = "blue";
        context.strokeRect(this.x * scale, this.y * scale, this.width * scale, this.height * scale);*/
    }
    /*is_hovered(x: number, y: number) {
        return (x > this.x - this.width / 2 && x < this.x + this.width / 2 && y > this.y + 10 && y < this.y + this.height + 10);
    }*/
    /*
    private getPopupPositionOld(timeline: Timeline, popupParcel: ParcelizedTextBox): { x: number; y: number } {
        const canvasWidth = timeline.getWidth();
        const canvasHeight = timeline.getHeight();

        // Coordinates of the event card
        const cardTop = this.y;
        const cardBottom = this.y + (timeline.timelineConfig.verticalLayout? this.width: this.height);
        const cardLeft = this.x;
        const cardRight = this.x + (timeline.timelineConfig.verticalLayout? this.height: this.width);

        // Possible positions for the popup
        let bestX = this.x; // Initialize with default as the top-right corner of the card
        let bestY = this.y;

        // Check space on the right side
        if (cardRight + popupParcel.width <= canvasWidth) {
            bestX = cardRight; // Align popup's left edge with card's right edge
            bestY = cardTop;  // Align popup's top edge with card's top edge
        } else if (cardLeft - popupParcel.width >= 0) {
            // Not enough space on the right, check the left side
            bestX = cardLeft - popupParcel.width; // Align popup's right edge with card's left edge
            bestY = cardTop;                      // Align popup's top edge with card's top edge
        } else if (cardBottom + popupParcel.height <= canvasHeight) {
            // Not enough space on the left, check below
            bestX = cardLeft;                    // Align popup's left edge with card's left edge
            bestY = cardBottom;                  // Align popup's top edge with card's bottom edge
        } else if (cardTop - popupParcel.height >= 0) {
            // Not enough space below, check above
            bestX = cardLeft;                    // Align popup's left edge with card's left edge
            bestY = cardTop - popupParcel.height; // Align popup's bottom edge with card's top edge
        }

        // Ensure popup is completely inside the canvas
        bestX = Math.max(0, Math.min(bestX, canvasWidth - popupParcel.width));
        bestY = Math.max(0, Math.min(bestY, canvasHeight - popupParcel.height));

        return { x: bestX, y: bestY };
    }
    */
    getPopupPosition(timeline, popupParcel) {
        const canvasWidth = timeline.getWidth();
        const canvasHeight = timeline.getHeight();
        let posX = this.x + this.getTrueWidth(timeline.timelineConfig.verticalLayout); // Default: to the right of the card
        let posY = this.y; // Aligns top of the popup with top of the card
        let verticalMultiplier = 0; // Default below the card
        let horizontalMultiplier = 0; // Default to the right of the card
        // Check if the popup fits to the right; if not, flip to the left
        if (posX + popupParcel.width > canvasWidth) {
            posX = this.x; // Align the right of the popup with the right of the card
            horizontalMultiplier = -1;
        }
        // Check if the popup fits below; if not, flip above
        if (posY + popupParcel.height > canvasHeight) {
            posY = this.y + this.getTrueHeight(timeline.timelineConfig.verticalLayout); // Align bottom of the popup with bottom of the card
            verticalMultiplier = -1;
        }
        return { x: posX, y: posY, verticalMultiplier: verticalMultiplier, horizontalMultiplier: horizontalMultiplier };
    }
    getTrueHeight(verticalLayout) {
        return (verticalLayout ? this.width : this.height);
    }
    getTrueWidth(verticalLayout) {
        return (verticalLayout ? this.height : this.width);
    }
}
