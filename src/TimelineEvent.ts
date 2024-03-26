class TimelineEvent {
    width : number = 0;
    height : number = 0;
    private readonly text: string;
    private readonly title: string;
    readonly date : ParsedDate;

    constructor(text : string, title : string, date : ParsedDate) {
        this.text = text;
        this.title = title;
        this.date = date;
    }

    public getTitle() : string {
        return this.title;
    }

    draw(context : CanvasRenderingContext2D, timelineConfig : TimelineConfig, x : number, y : number) {

        const padding = 3;
        const leftBound = x - (this.width / 2);
        const topBound = y + 10;
        //1/4 of the box is header
        const headerHeight: number = this.height / 4;
        const bodyHeight: number = this.height * 3 / 4;

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
    }

    //is_hovered(x, y) {
    //    return (x > this.x - this.width / 2 && x < this.x + this.width / 2 && y > this.y + 10 && y < this.y + this.height + 10);
    //}
}