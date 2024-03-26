interface ParsedDate {
    year: number | null;
    month: number | null;
    day: number | null;
    hour: number | null;
    minute: number | null;
}




function readDate(date : ParsedDate) : string {
    let started : boolean = false;
    let dateWord : string = "";

    //Month
    if (date.month != null) {
        if (started) {dateWord += '/';}
        started = true;
        dateWord += date.month;
    }
    //Day
    if (date.day != null) {
        if (started) {dateWord += '/';}
        started = true;
        dateWord += date.day;
    }
    //Year
    if (date.year != null) {
        if (started) {dateWord += '/';}
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
        if (started) {dateWord += ' ';}
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

function parseDate(input: string): ParsedDate {
    const result: ParsedDate = {
        year: null,
        month: null,
        day: null,
        hour: null,
        minute: null
    };

    // Regular expressions for matching different date and time components
    const monthRegex = /(\d{1,2})m/;
    const dayRegex = /(\d{1,2})d/;
    const timeRegex = /(\d{1,2}):(\d{1,2})t/;

    // Extract year in it's own separate function because it's a tad too complex for a single regex match
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




function extractYear(input: string): number | null {
    //Find the position of the first 'y' character
    const yIndex = input.indexOf('y');
    let isNegative = false;
    console.log(yIndex);
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
            console.log("We found a number. Scrolling back.");
            //Start of number sequence found, continue until non-digit character is encountered
            while (startIndex >= 0 && /\d/.test(input[startIndex])) {
                startIndex--;
            }
        //Test if current character is a number
        } else if (/\s/.test(char)) {
            // Skip whitespace characters
            startIndex--;
        } else {
            console.log("End of number string. Testing for bc prefix");
            let possiblePrefix : string = input.slice(Math.max(0, startIndex - 5), startIndex + 1);
            console.log(possiblePrefix);
            //Check for BC prefix
            const bcMatch = containsBCPrefix(possiblePrefix);
            if (bcMatch) {
                console.log("We found bc prefix. Mark number as negative and finish.");
                isNegative = true;
                break;
            } else {
                console.log("No bc prefix. Finishing.");
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
function containsBCPrefix(possiblePrefix: string): boolean {
    // Regular expression pattern to match any valid form of "bc"
    const bcRegex = /b(?:\.c(?:\.e?)?)?/i;
    return bcRegex.test(possiblePrefix);
}