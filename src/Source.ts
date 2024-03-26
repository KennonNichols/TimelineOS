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

    }

    configure(json : string) {
        this.timelineConfig.reconfigure(json);
        this.reloadTimeline();
    }





    //HTMLCanvasElement
    canvas : HTMLCanvasElement;
    //CanvasRenderingContext2D
    context : CanvasRenderingContext2D;
    //TimelineEvent[]
    events : TimelineEvent[] = [];
    //Create default TimelineConfig
    timelineConfig : TimelineConfig = new TimelineConfig();
    //This is how far along the timeline you are
    xShift = 0;

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

    draw() {
        const width = this.getWidth();

        let y = this.getHeight() / 2;
        let xStep = width / this.timelineConfig.eventCount;
        //x starts at half a step to prevent any large blank space, then add the xShift;
        let x = xStep / 2 + this.xShift;
        let context = this.context;


        // Clear the canvas
        context.clearRect(0, 0, width, this.getHeight());


        // Draw the line from the first node to the last node
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + xStep * (this.events.length - 1), y);
        context.stroke();



        for (const event of this.events) {
            event.draw(context, this.timelineConfig, x, y);

            if (x >= width) {
                return;
            }


            x += xStep;
        }
    }

    //Add a simple text-only event to the timeline.
    addEvent(title : string, body : string, date : string = "") {
        let timelineEvent = new TimelineEvent(body, title, parseDate(date));
        //Add the equivalent of 3 events of whitespace
        timelineEvent.width = this.getWidth() / (this.timelineConfig.eventCount + 3);
        timelineEvent.height = this.getHeight() / 3;
        this.events.push(timelineEvent);
        this.reloadTimeline();
    }





    //Remove ALL events with a title matching "title".
    removeEvent(title : string) {
        this.events = this.events.filter(function(timelineEvent : TimelineEvent){return timelineEvent.getTitle() !== title});
        this.reloadTimeline();
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

    private clampXShift() {
        let minShift = - this.getWidth() / this.timelineConfig.eventCount * (this.events.length - this.timelineConfig.eventCount);

        if (this.xShift < minShift) {
            this.xShift = minShift;
        }

        if (this.xShift > 0) {
            this.xShift = 0;
        }
    }

    private handleMouseMove(e : any) {
        if (this.mouseHeld) {
            //Calculate how far the mouse was dragged
            let mouseX = e.clientX - this.getLeft();
            let xChange = mouseX - this.clickOriginX;

            //Record new X position
            this.clickOriginX = mouseX;

            //Shift the timeline
            this.xShift += xChange;
            this.reloadTimeline();
        }
    }

    private handleMouseDown(e : any) {
        let mouseX = e.clientX - this.getLeft();
        let mouseY = e.clientY - this.getTop();


        //If the mouse went down in the canvas
        if (
            mouseX > this.getLeft() &&
            mouseX < this.getLeft() + this.getWidth() &&
            mouseY > this.getTop() &&
            mouseY < this.getTop() + this.getHeight()
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

    private sort() {
        if (this.timelineConfig.dateSort) {

            this.events = this.events.sort((a, b) => {
                // Compare years
                const aYear = a.date.year ?? 0;
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
                return aMinute - bMinute;
            });





        }
    }

    private reloadTimeline() {
        this.clampXShift();
        this.sort();
        this.draw();
    }
}








