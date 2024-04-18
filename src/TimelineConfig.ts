class TimelineConfig {
    // Number of events that are shown per canvas width
    eventCount: number = 5;
    // Whether to scale the space between events to match dates
    // TODO implement this
    actualScale: boolean = false;
    // Whether we are drawing vertically
    verticalLayout: boolean = false;
    // Padding between wall and text
    padding: number = 3;
    // Whether to draw the line separating the title from the body
    drawDividerLine: boolean = true;
    // The highlight color of the timeline
    highlightColor: string = "#9c1124";
    // Whether to sort by date, or by entry order
    dateSort: boolean = true;
    // Whether to use metric or American date format (default: false (American))
    metricDateFormat: boolean = false;
    // Whether to use metric (24-hour) or American (12-hour) time format (default: true (24-hour))
    metricTimeFormat: boolean = true;
    // Whether the dates are written in plain language or as a numerical date (default: false (numerical))
    languageDateFormat: boolean = false;
    // "layoutTechnique" takes one of three values: "normal", "flipped", and "mixed". If it has normal layout, events are drawn below/right of the timeline, flipped is the opposite, and mixed alternates.
    layoutTechnique: string = "normal";
    // How much to multiply canvas contents, since contents are normally grainy and low-resolution (damn you, outdated HTML elements! Damn, you!)
    resolutionScale: number = 2;
    // Yeah, man. This explains itself.
    maxFontSize: number = 16;
    // Same thing.
    minFontSize: number = 12;
    // Time it takes (in milliseconds) for the timeline popups to expand to full size.
    popupTime: number = 500;


    // "Developer" values. These are values that affect internal functions. Improper config can break the site, and it is unlikely you will ever need to tweak these. Here be dragons.

    // This is the factor by which a box is increased to find the box of best fit around text. For example, when finding the smallest possible box that can fit a piece of text.
    // Higher values will make a minor performance improvement, but worse fit. Smaller values will require slightly more calculation the first time a popup is opened, but will make a much cleaner fit.
    // !!! Values less than or equal to '1' will cause an infinite loop and break the site.
    fitExpansionRate: number = 1.01;

    private configurableFields : string[] = ["eventCount", "actualScale", "verticalLayout", "layoutTechnique", "padding", "drawDividerLine", "highlightColor", "dateSort", "metricDateFormat", "metricTimeFormat", "languageDateFormat", "resolutionScale", "maxFontSize", "minFontSize", "popupTime",
    "fitExpansionRate"];

    // Fields that, when changed, force the timeline to reset to prevent it breaking
    private resettingFields : string[] = ["eventCount", "actualScale", "verticalLayout", "dateSort", "layoutTechnique", "resolutionScale", "maxFontSize", "minFontSize"];


    // Nonconfigurables
    userLanguage: string = navigator.language;

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
    reconfigure(json: string): boolean {
        const jsonConfiguration = JSON.parse(json);
        let needsResetting: boolean = false;

        this.configurableFields.forEach(fieldName => {
            if (this.addConfigurationItem(jsonConfiguration, fieldName)) {
                needsResetting = true;
            }
        })

        return needsResetting;
    }

    private addConfigurationItem(jsonObject : Object, name : string): boolean {
        if (name in jsonObject) {
            // The compiler hates this, but this works as long as the configurableFields is properly written.
            // @ts-ignore
            this[name] = jsonObject[name];

            return this.resettingFields.includes(name, 0);
        }
        return false;
    }


}