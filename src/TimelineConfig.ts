class TimelineConfig {
    // Number of events that are shown per canvas width
    eventCount: number;
    // Whether to scale the space between events to match dates
    // TODO implement this
    actualScale: boolean;
    // Padding between wall and text
    padding: number;
    // Whether to draw the line separating the title from the body
    drawDividerLine: boolean;
    // The highlight color of the timeline
    highlightColor: string;
    // Whether to sort by date, or by entry order
    dateSort: boolean;

    constructor() {
        this.eventCount = 5;
        this.actualScale = false;
        this.padding = 3;
        this.drawDividerLine = true;
        this.highlightColor = "red";
        this.dateSort = true;
    }


    private configurableFields : string[] = ["eventCount", "actualScale", "padding", "drawDividerLine", "highlightColor", "dateSort"];

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
    reconfigure(json: string) {
        const jsonConfiguration = JSON.parse(json);

        this.configurableFields.forEach(fieldName => {
            this.addConfigurationItem(jsonConfiguration, fieldName);
        })

        return this;
    }

    private addConfigurationItem(jsonObject : Object, name : string) {
        if (name in jsonObject) {
            // The compiler hates this, but I checked it, so it will work
            // @ts-ignore
            this[name] = jsonObject[name];
        }
    }


}