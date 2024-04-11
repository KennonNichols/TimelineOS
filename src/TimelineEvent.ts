class TimelineEvent {
    x : number = 0;
    y : number = 0;
    width : number = 0;
    height : number = 0;
    private readonly text: string;
    private readonly title: string;
    readonly date : ParsedDate;
    private savedParcel : ParcelizedWrappableText | null = null;
    private popupParcel : ParcelizedTextBox | null = null;

    private readonly translations : object = {};
    private readonly titleTranslations : object = {};

    constructor(text : string, title : string, date : ParsedDate, titleTranslations: object, translations: object) {
        this.text = text;
        this.title = title;
        this.date = date;
        this.translations = translations;
        this.titleTranslations = titleTranslations;
    }

    //Gets the title, translated into the users local language if possible
    public getTitle(language: string | null) : string {
        if (language != null) {
            if (language in this.titleTranslations) {
                // @ts-ignore
                return this.titleTranslations[language];
            }
        }
        return this.title;
    }

    //Gets the body, translated into the users local language if possible
    public getBody(language: string | null) : string {
        if (language != null) {
            if (language in this.translations) {
                // @ts-ignore
                return this.translations[language];
            }
        }

        return this.text


    }


    private hovered: boolean = false;


    private popup: boolean = false;
    private hoverTimeout: number | null = null; // Holds the timeout ID

    public onMouseMove(event: MouseEvent, timeline: Timeline) {
        let mouseX = event.clientX - timeline.getLeft();
        let mouseY = event.clientY - timeline.getTop();

        let redrawNeeded: boolean = false;

        let currentlyHovered = this.checkIfPointInBox(mouseX, mouseY);


        if (currentlyHovered && !this.hovered) {
            // Mouse has entered the box, start the timer
            this.hovered = true;
            redrawNeeded = true;
            // Clear any existing timeout to ensure we don't have duplicates
            if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
            // Since Javascript browsers have nice support for delayed stuff :)
            this.hoverTimeout = window.setTimeout(() => {
                console.log("Popping out");
                this.popup = true;
                timeline.draw();
            }, 1500); //Wait for 1.5 seconds
        } else if (!currentlyHovered && this.hovered) {
            // Reset everything
            this.hovered = false;
            this.popup = false;
            if (this.hoverTimeout) {
                clearTimeout(this.hoverTimeout); // Clear the timer
            }
            this.hoverTimeout = null;
            redrawNeeded = true;
        }

        if (redrawNeeded) {
            timeline.draw();
        }
    }

    /*public onMouseMove(event: MouseEvent, timeline : Timeline) {

        let mouseX = event.clientX - timeline.getLeft();
        let mouseY = event.clientY - timeline.getTop();


        let hovered = this.checkIfPointInBox(mouseX, mouseY);
        if (hovered != this.hovered) {
            this.hovered = hovered;
            timeline.draw();
        }
    }*/



    private checkIfPointInBox(x: number, y: number) : boolean {
        return (this.x < x && x < this.x + this.width && this.y < y && y < this.y + this.height);
    }

    public invalidateParcel() {
        this.savedParcel = null;
        this.popupParcel = null;
        //console.log("Killing old parcel for event " + this.getTitle());
    }

    draw(context: CanvasRenderingContext2D, timeline: Timeline, x: number, y: number) {
        let timelineConfig: TimelineConfig = timeline.timelineConfig;
        let width = this.width;
        let height = this.height;
        const scale = timeline.resolutionScale;

        let flip: boolean = timelineConfig.layoutTechnique == "flipped";
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
        let leftBound = x - (this.width / 2);
        let topBound = flip ? y - this.height - 20 : y + 10; // Adjust based on flip for horizontal layout
        let headerHeight = this.height / 4;
        let bodyHeight = this.height * 3 / 4;

        this.x = leftBound;
        this.y = topBound;

        // Adjustments for vertical layout
        if (timelineConfig.verticalLayout) {
            leftBound = flip ? x - width - 10 : x + 10; // Move box to left or right of the timeline based on flip
            topBound = y - (height / 2); // Center box vertically around y
        }

        // Draw event circle
        context.beginPath();
        context.arc(x * scale, y * scale, 5 * scale, 0, Math.PI * 2);
        context.fillStyle = timelineConfig.highlightColor;
        context.fill();

        // Draw date
        if (timelineConfig.dateSort) {
            let dateY: number;
            let justifyY: LineSide;
            if (timelineConfig.verticalLayout) {
                dateY = topBound - 30;
                justifyY = LineSide.BOTTOM;
            }
            else {
                dateY = flip ? y + 10 : y - 10;
                justifyY = flip ? LineSide.TOP : LineSide.BOTTOM;
            }
            drawWrappedText(context, scale, this.date.asReadable(timelineConfig), leftBound, dateY, width, headerHeight / 2, 0, Justify.CENTER, justifyY);
        }

        // Draw header
        drawWrappedText(context, scale, this.getTitle(timelineConfig.userLanguage), leftBound, topBound, width, headerHeight, timelineConfig.padding, Justify.CENTER);

        // Draw body text
        // Calculate it if it hasn't already been calculated
        if (this.savedParcel == null) {
            this.savedParcel = drawWrappedText(
                context,
                scale,
                this.getBody(timelineConfig.userLanguage),
                leftBound,
                topBound + headerHeight,
                width,
                bodyHeight,
                timelineConfig.padding,
                Justify.LEFT,
                LineSide.TOP,
                timelineConfig.maxFontSize,
                timelineConfig.minFontSize,
            );
        }
        // Or just use parcel if we have it
        else {
            drawWrappedTextPrecalculated(
                context,
                scale,
                leftBound,
                topBound + headerHeight,
                width,
                bodyHeight,
                this.savedParcel,
                timelineConfig.padding
            );
        }


        //Draw thicker if we are being hovered
        //context.lineWidth = this.hovered ? 3 : 1;
        context.lineWidth = this.hovered ? (this.popup ? 10 : 3) : 1;


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
    drawLate(context: CanvasRenderingContext2D, timeline: Timeline) {
        console.log(this.popup);
        if (this.popup) {
            const config = timeline.timelineConfig;

            //Get the parcelized box
            if (!this.popupParcel) {
                this.popupParcel = minimumParcelizedBox(
                    config.verticalLayout? this.height: this.width,
                    config.verticalLayout? this.width: this.height,
                    context,
                    timeline.resolutionScale,
                    config.maxFontSize,
                    config.padding,
                    this.getBody(config.userLanguage)
                );
                //this.popupParcel = parcelizeText(context, timeline.resolutionScale, this.getBody(timeline.timelineConfig.userLanguage), )
            }

            drawWrappedTextPrecalculated(context, timeline.resolutionScale, 0, 0, this.popupParcel.width, this.popupParcel.height, this.popupParcel.text, config.padding);


        }
    }


    /*is_hovered(x: number, y: number) {
        return (x > this.x - this.width / 2 && x < this.x + this.width / 2 && y > this.y + 10 && y < this.y + this.height + 10);
    }*/


    private getPopupPosition(timeline: Timeline, popupParcel: ParcelizedTextBox): { x: number; y: number } {
        const canvasWidth = timeline.getWidth();
        const canvasHeight = timeline.getHeight();

        // Coordinates of the event card
        const cardTop = this.y;
        const cardBottom = this.y + this.height;
        const cardLeft = this.x;
        const cardRight = this.x + this.width;

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


}