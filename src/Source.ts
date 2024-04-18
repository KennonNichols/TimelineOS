
class Timeline {


    constructor(canvasElement : HTMLCanvasElement) {
        this.canvas = canvasElement;
        // @ts-ignore
        this.context = canvasElement.getContext('2d');
        //this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('click', (event: MouseEvent) => {
            this.handleClick(event)
        });
        this.canvas.addEventListener('mousemove', (event: MouseEvent) => {
            this.handleMouseMove(event)
        });
        this.canvas.addEventListener('mouseup', (event: any) => {
            this.handleMouseUp(event)
        });
        this.canvas.addEventListener('mousedown', (event: any) => {
            this.handleMouseDown(event)
        });
        this.canvas.addEventListener('mouseout', (event: any) => {
            this.handleMouseOut(event)
        });

        this.canvas.addEventListener("dblclick", (event: MouseEvent) => {
            this.handleDoubleClick(event)
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

    configure(json : string) {
        let needsResetting: boolean = this.timelineConfig.reconfigure(json);
        this.reloadTimeline(needsResetting, needsResetting);
    }

    public resize() {
        this.resizeEvents();
        this.reloadTimeline(true, true);
    }

    get resolutionScale(): number {
        return this.timelineConfig.resolutionScale;
    }

    canvas : HTMLCanvasElement;
    context : CanvasRenderingContext2D;
    //The events on the timeline
    events : TimelineEvent[] = [];
    //The points at which the events are drawn
    points : Point[] = [];
    //The total width of the timeline
    totalWidth: number = 0;
    totalHeight: number = 0;

    //Create default TimelineConfig
    timelineConfig : TimelineConfig = new TimelineConfig();
    //This is how far along the timeline you are
    shift: Point = new Point(0, 0);

    // This does nothing but draw a rectangle on your canvas, padded by "edge" amount of pixels.
    drawTest(edge: number) {
        this.context.fillStyle = '#05EFFF';
        this.context.fillRect(this.getLeft() + edge, this.getTop() + edge, this.getWidth() - (edge * 4), this.getHeight() - (edge * 4));
    }

    //region basic getters for dimensioning
    // Get the rectangle that bounds the canvas.
    getBoundingRectangle() {
        return this.canvas.getBoundingClientRect();
    }

    getWidth() : number {
        return this.getBoundingRectangle().width;
    }

    getHeight() : number {
        return this.getBoundingRectangle().height;
    }

    getLeft() : number {
        return this.getBoundingRectangle().left;
    }

    getTop() : number {
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
        const height = this.getHeight()


        // Clear the canvas
        context.clearRect(0, 0, width * this.resolutionScale, height * this.resolutionScale);
        context.lineWidth = 1;

        if (this.events.length > 0) {


            // Draw the line from the first node to the last node
            drawLine(context, this.resolutionScale, this.points[0].x  + this.shift.x, this.points[0].y + this.shift.y, this.points[this.points.length - 1].x + this.shift.x, this.points[this.points.length - 1].y + this.shift.y);

            const drawnEvents : TimelineEvent[] = [];

            //for (const eventIndex in this.events) {
            for (let eventIndex = 0; eventIndex < this.events.length; eventIndex++) {
                let event: TimelineEvent = this.events[eventIndex];
                let x: number = this.points[eventIndex].x + this.shift.x;
                let y: number = this.points[eventIndex].y + this.shift.y;

                //If we are off the left side or top, don't draw it
                if (x <= - this.getStandardXStep() || y <= - this.getStandardYStep()) {
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
    addEvent(title : string, body : string, date : string | String | Date = "", titleTranslations : string = "{}", translations : string = "{}") {
        let parsedDate: ParsedDate;

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

        let titleTranslationDictionary : object = JSON.parse(titleTranslations);
        let translationDictionary : object = JSON.parse(translations);

        let timelineEvent = new TimelineEvent(body, title, parsedDate, titleTranslationDictionary, translationDictionary);
        timelineEvent.height = this.getHeight() / 3;
        this.events.push(timelineEvent);
        this.reloadTimeline(false, true);
    }




    //Remove ALL events with a title matching <title>.
    removeEvent(title : string) {
        this.events = this.events.filter(function(timelineEvent : TimelineEvent){return timelineEvent.getTitle(null) !== title});
        this.reloadTimeline(true, true);
    }

    private scaleCanvas() {
        this.canvas.style.width = this.getWidth() + 'px';
        this.canvas.style.height = this.getHeight() + 'px';
        this.canvas.width = this.getWidth() * this.resolutionScale;
        this.canvas.height = this.getHeight() * this.resolutionScale;
    }


    private mouseHeld : boolean = false;
    private clickOriginX : number = 0;
    private clickOriginY : number = 0;

    // Function to handle click events
    private handleClick(e : any) {
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

    private clampShift() {
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

    private handleMouseMove(e : MouseEvent) {
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

    private handleMouseDown(e : any) {
        let mouseX = e.clientX - this.getLeft();
        let mouseY = e.clientY - this.getTop();


        //If the mouse went down in the canvas
        if (
            mouseX > 0 &&
            mouseX < this.getWidth() &&
            mouseY > 0 &&
            mouseY < this.getHeight()
        ) {
            //Start dragging
            this.mouseHeld = true;
            this.clickOriginX = mouseX;
            this.clickOriginY = mouseY;
        }
    }

    private handleMouseUp(e : any) {
        this.mouseHeld = false;
    }

    private handleMouseOut(event: any) {
        this.mouseHeld = false;
    }

    private atStart: boolean = true;
    private savedPoint: Point = new Point(0, 0);

    private handleDoubleClick(event: MouseEvent) {
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
        this.draw()
    }

    private sort() {
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

    private reloadTimeline(reset: boolean = false, reposition: boolean = false) {
        this.sort();

        if (reset) {
            //Navigate back to the start of the timeline
            this.shift = new Point(0, 0)
            this.savedPoint = new Point(0, 0)
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

    private resizeEvents() {
        //Add the equivalent of 3 events of whitespace
        let width: number= this.getWidth() / (this.timelineConfig.eventCount + 3);
        if (this.timelineConfig.layoutTechnique == "mixed") {
            //Double wide if we are using mixed layout
            width = width * 2;
        }

        for (let e of this.events) {
            e.width = width;
        }
    }

    private repositionTimeline() {

        let startingPoint: Point;

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