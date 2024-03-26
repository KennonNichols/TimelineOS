"use strict";
function drawWrappedText(ctx, text, x, y, maxWidth, maxHeight, padding, color, fontSize) {
    if (padding === void 0) { padding = 3; }
    if (color === void 0) { color = 'black'; }
    if (fontSize === void 0) { fontSize = 16; }
    var words = text.split(' ');
    var lines = [];
    var totalHeight = 0;
    while (fontSize > 0) {
        var line = '';
        ctx.font = fontSize + 'px Arial'; // set font size
        ctx.textBaseline = 'top';
        totalHeight = fontSize;
        for (var i = 0; i < words.length; i++) {
            var testLine = line + words[i] + ' ';
            var metrics = ctx.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth - padding * 2 && i > 0) {
                lines.push(line);
                totalHeight += fontSize;
                if (totalHeight >= maxHeight - padding * 2) {
                    lines = [];
                    break;
                }
                line = words[i] + ' ';
            }
            else {
                line = testLine;
            }
        }
        lines.push(line);
        // Check if totalHeight exceeds maxHeight
        if (totalHeight <= maxHeight - padding * 2)
            break;
        // Decrease font size and clear lines array
        fontSize--;
        lines = [];
    }
    // Calculate the vertical position to center the text vertically
    var startY = y + (maxHeight - totalHeight) / 2 + padding;
    // Draw lines centered vertically
    for (var i = 0; i < lines.length; i++) {
        var lineY = startY + i * fontSize;
        ctx.fillText(lines[i], x + padding, lineY);
    }
}
var Timeline = /** @class */ (function () {
    function Timeline(canvasElement) {
        var _this = this;
        //TimelineEvent[]
        this.events = [];
        //Create default TimelineConfig
        this.timelineConfig = new TimelineConfig();
        //This is how far along the timeline you are
        this.xShift = 0;
        this.mouseHeld = false;
        this.clickOriginX = 0;
        this.clickOriginY = 0;
        this.canvas = canvasElement;
        // @ts-ignore
        this.context = canvasElement.getContext('2d');
        //this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('click', function (event) {
            _this.handleClick(event);
        });
        this.canvas.addEventListener('mousemove', function (event) {
            _this.handleMouseMove(event);
        });
        this.canvas.addEventListener('mouseup', function (event) {
            _this.handleMouseUp(event);
        });
        this.canvas.addEventListener('mousedown', function (event) {
            _this.handleMouseDown(event);
        });
        this.canvas.addEventListener('mouseout', function (event) {
            _this.handleMouseOut(event);
        });
    }
    Timeline.prototype.configure = function (json) {
        this.timelineConfig.reconfigure(json);
        this.reloadTimeline();
    };
    // This does nothing but draw a rectangle on your canvas, padded by "edge" amount of pixels.
    Timeline.prototype.drawTest = function (edge) {
        this.context.fillStyle = '#05EFFF';
        this.context.fillRect(this.getLeft() + edge, this.getTop() + edge, this.getWidth() - (edge * 4), this.getHeight() - (edge * 4));
    };
    //region basic getters for dimensioning
    // Get the rectangle that bounds the canvas.
    Timeline.prototype.getBoundingRectangle = function () {
        return this.canvas.getBoundingClientRect();
    };
    Timeline.prototype.getWidth = function () {
        return this.getBoundingRectangle().width;
    };
    Timeline.prototype.getHeight = function () {
        return this.getBoundingRectangle().height;
    };
    Timeline.prototype.getLeft = function () {
        return this.getBoundingRectangle().left;
    };
    Timeline.prototype.getTop = function () {
        return this.getBoundingRectangle().top;
    };
    //endregion
    Timeline.prototype.draw = function () {
        var width = this.getWidth();
        var y = this.getHeight() / 2;
        var xStep = width / this.timelineConfig.eventCount;
        //x starts at half a step to prevent any large blank space, then add the xShift;
        var x = xStep / 2 + this.xShift;
        var context = this.context;
        // Clear the canvas
        context.clearRect(0, 0, width, this.getHeight());
        // Draw the line from the first node to the last node
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + xStep * (this.events.length - 1), y);
        context.stroke();
        for (var _i = 0, _a = this.events; _i < _a.length; _i++) {
            var event_1 = _a[_i];
            event_1.draw(context, this.timelineConfig, x, y);
            if (x >= width) {
                return;
            }
            x += xStep;
        }
    };
    //Add a simple text-only event to the timeline.
    Timeline.prototype.addEvent = function (title, body, date) {
        if (date === void 0) { date = ""; }
        var timelineEvent = new TimelineEvent(body, title, parseDate(date));
        //Add the equivalent of 3 events of whitespace
        timelineEvent.width = this.getWidth() / (this.timelineConfig.eventCount + 3);
        timelineEvent.height = this.getHeight() / 3;
        this.events.push(timelineEvent);
        this.reloadTimeline();
    };
    //Remove ALL events with a title matching "title".
    Timeline.prototype.removeEvent = function (title) {
        this.events = this.events.filter(function (timelineEvent) { return timelineEvent.getTitle() !== title; });
        this.reloadTimeline();
    };
    // Function to handle click events
    Timeline.prototype.handleClick = function (e) {
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
    };
    Timeline.prototype.clampXShift = function () {
        var minShift = -this.getWidth() / this.timelineConfig.eventCount * (this.events.length - this.timelineConfig.eventCount);
        if (this.xShift < minShift) {
            this.xShift = minShift;
        }
        if (this.xShift > 0) {
            this.xShift = 0;
        }
    };
    Timeline.prototype.handleMouseMove = function (e) {
        if (this.mouseHeld) {
            //Calculate how far the mouse was dragged
            var mouseX = e.clientX - this.getLeft();
            var xChange = mouseX - this.clickOriginX;
            //Record new X position
            this.clickOriginX = mouseX;
            //Shift the timeline
            this.xShift += xChange;
            this.reloadTimeline();
        }
    };
    Timeline.prototype.handleMouseDown = function (e) {
        var mouseX = e.clientX - this.getLeft();
        var mouseY = e.clientY - this.getTop();
        //If the mouse went down in the canvas
        if (mouseX > this.getLeft() &&
            mouseX < this.getLeft() + this.getWidth() &&
            mouseY > this.getTop() &&
            mouseY < this.getTop() + this.getHeight()) {
            //Start dragging
            this.mouseHeld = true;
            this.clickOriginX = mouseX;
            this.clickOriginY = mouseY;
        }
    };
    Timeline.prototype.handleMouseUp = function (e) {
        this.mouseHeld = false;
    };
    Timeline.prototype.handleMouseOut = function (event) {
        this.mouseHeld = false;
    };
    Timeline.prototype.sort = function () {
        if (this.timelineConfig.dateSort) {
            this.events = this.events.sort(function (a, b) {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                // Compare years
                var aYear = (_a = a.date.year) !== null && _a !== void 0 ? _a : 0;
                var bYear = (_b = b.date.year) !== null && _b !== void 0 ? _b : 0;
                if (a.date.year !== b.date.year) {
                    return aYear - bYear;
                }
                // Compare months, treating null as 0
                var aMonth = (_c = a.date.month) !== null && _c !== void 0 ? _c : 0;
                var bMonth = (_d = b.date.month) !== null && _d !== void 0 ? _d : 0;
                if (aMonth !== bMonth) {
                    return aMonth - bMonth;
                }
                // Compare days, treating null as 0
                var aDay = (_e = a.date.day) !== null && _e !== void 0 ? _e : 0;
                var bDay = (_f = b.date.day) !== null && _f !== void 0 ? _f : 0;
                if (aDay !== bDay) {
                    return aDay - bDay;
                }
                // Compare hours, treating null as 0
                var aHour = (_g = a.date.hour) !== null && _g !== void 0 ? _g : 0;
                var bHour = (_h = b.date.hour) !== null && _h !== void 0 ? _h : 0;
                if (aHour !== bHour) {
                    return aHour - bHour;
                }
                // Finally, compare minutes, treating null as 0
                var aMinute = (_j = a.date.minute) !== null && _j !== void 0 ? _j : 0;
                var bMinute = (_k = b.date.minute) !== null && _k !== void 0 ? _k : 0;
                return aMinute - bMinute;
            });
        }
    };
    Timeline.prototype.reloadTimeline = function () {
        this.clampXShift();
        this.sort();
        this.draw();
    };
    return Timeline;
}());
var TimelineConfig = /** @class */ (function () {
    function TimelineConfig() {
        this.configurableFields = ["eventCount", "actualScale", "padding", "drawDividerLine", "highlightColor", "dateSort"];
        this.eventCount = 5;
        this.actualScale = false;
        this.padding = 3;
        this.drawDividerLine = true;
        this.highlightColor = "red";
        this.dateSort = true;
    }
    //Example JSON:
    /*
    {
        "eventCount" : 3,
        "actualScale" : false,
        "padding" : 4,
        "drawDividerLine" : false,
        "highlightColor" : "blue",
        "dateSort" : false
    }
    */
    TimelineConfig.prototype.reconfigure = function (json) {
        var _this = this;
        var jsonConfiguration = JSON.parse(json);
        this.configurableFields.forEach(function (fieldName) {
            _this.addConfigurationItem(jsonConfiguration, fieldName);
        });
        return this;
    };
    TimelineConfig.prototype.addConfigurationItem = function (jsonObject, name) {
        if (name in jsonObject) {
            // The compiler hates this, but I checked it, so it will work
            // @ts-ignore
            this[name] = jsonObject[name];
        }
    };
    return TimelineConfig;
}());
var TimelineEvent = /** @class */ (function () {
    function TimelineEvent(text, title, date) {
        this.width = 0;
        this.height = 0;
        this.text = text;
        this.title = title;
        this.date = date;
    }
    TimelineEvent.prototype.getTitle = function () {
        return this.title;
    };
    TimelineEvent.prototype.draw = function (context, timelineConfig, x, y) {
        var padding = 3;
        var leftBound = x - (this.width / 2);
        var topBound = y + 10;
        //1/4 of the box is header
        var headerHeight = this.height / 4;
        var bodyHeight = this.height * 3 / 4;
        // Draw event circle
        context.beginPath();
        context.arc(x, y, 5, 0, Math.PI * 2);
        context.fillStyle = timelineConfig.highlightColor;
        context.fill();
        context.font = 'bold';
        // Draw date
        if (timelineConfig.dateSort) {
            drawWrappedText(context, readDate(this.date), leftBound, y - 50, this.width, headerHeight, timelineConfig.padding);
            //drawWrappedText(context, "readDate(this.date)", leftBound, topBound, this.width, y - 20, timelineConfig.padding);
        }
        // Draw header
        drawWrappedText(context, this.title, leftBound, topBound, this.width, headerHeight, timelineConfig.padding);
        // Draw body text
        drawWrappedText(context, this.text, leftBound, topBound + headerHeight, this.width, bodyHeight, timelineConfig.padding);
        // Draw divider line
        if (timelineConfig.drawDividerLine) {
            context.fillStyle = "black";
            context.beginPath();
            context.moveTo(leftBound + padding, topBound + headerHeight);
            context.lineTo(leftBound + this.width - padding, topBound + headerHeight);
            context.stroke();
        }
        // Draw event box
        context.beginPath();
        context.rect(leftBound, topBound, this.width, this.height);
        context.fillStyle = 'black';
        context.stroke();
    };
    return TimelineEvent;
}());
function readDate(date) {
    var started = false;
    var dateWord = "";
    //Month
    if (date.month != null) {
        if (started) {
            dateWord += '/';
        }
        started = true;
        dateWord += date.month;
    }
    //Day
    if (date.day != null) {
        if (started) {
            dateWord += '/';
        }
        started = true;
        dateWord += date.day;
    }
    //Year
    if (date.year != null) {
        if (started) {
            dateWord += '/';
        }
        started = true;
        if (date.year >= 0) {
            dateWord += date.year;
        }
        else {
            dateWord += "b.c " + -date.year;
        }
    }
    //Time
    if (date.hour != null && date.minute != null) {
        if (started) {
            dateWord += ' ';
        }
        started = true;
        if (date.minute >= 10) {
            dateWord += date.hour + ":" + date.minute;
        }
        else {
            dateWord += date.hour + ":0" + date.minute;
        }
    }
    return dateWord;
}
function parseDate(input) {
    var result = {
        year: null,
        month: null,
        day: null,
        hour: null,
        minute: null
    };
    // Regular expressions for matching different date and time components
    var monthRegex = /(\d{1,2})m/;
    var dayRegex = /(\d{1,2})d/;
    var timeRegex = /(\d{1,2}):(\d{1,2})t/;
    // Extract year in it's own separate function because it's a tad too complex for a single regex match
    result.year = extractYear(input);
    // Match month
    var monthMatch = input.match(monthRegex);
    if (monthMatch) {
        result.month = parseInt(monthMatch[1]);
    }
    // Match day
    var dayMatch = input.match(dayRegex);
    if (dayMatch) {
        result.day = parseInt(dayMatch[1]);
    }
    // Match time (hour and minute)
    var timeMatch = input.match(timeRegex);
    if (timeMatch) {
        result.hour = parseInt(timeMatch[1]);
        result.minute = parseInt(timeMatch[2]);
    }
    return result;
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
    var yIndex = input.indexOf('y');
    var isNegative = false;
    console.log(yIndex);
    if (yIndex === -1) {
        return null; //Return null if 'y' is not found
    }
    //Traverse backward from 'y' position to find BC suffix or start of number sequence
    var startIndex = yIndex;
    startIndex--;
    while (startIndex >= 0) {
        var char = input[startIndex];
        //Test if current character is a digit.
        if (/\d/.test(char)) {
            console.log("We found a number. Scrolling back.");
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
            console.log("End of number string. Testing for bc prefix");
            var possiblePrefix = input.slice(Math.max(0, startIndex - 5), startIndex + 1);
            console.log(possiblePrefix);
            //Check for BC prefix
            var bcMatch = containsBCPrefix(possiblePrefix);
            if (bcMatch) {
                console.log("We found bc prefix. Mark number as negative and finish.");
                isNegative = true;
                break;
            }
            else {
                console.log("No bc prefix. Finishing.");
                break;
            }
        }
    }
    //Extract the substring containing the year and BC suffix (if any)
    var yearString = input.slice(startIndex + 1, yIndex + 1).trim();
    //Parse the year string and handle BC suffix
    var yearValue = parseInt(yearString);
    if (isNegative) {
        yearValue *= -1;
    }
    return yearValue;
}
//ChatGPT wrote this, I'm not even gonna lie. RegEx is hard :(
// ^ my IDE is complaining that my comments are too "informal"??? Bruh, that's what comments ARE!
function containsBCPrefix(possiblePrefix) {
    // Regular expression pattern to match any valid form of "bc"
    var bcRegex = /b(?:\.c(?:\.e?)?)?/i;
    return bcRegex.test(possiblePrefix);
}
