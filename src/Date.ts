class ParsedDate {
    get minute(): number | null {
        return this._minute;
    }
    set minute(value: number | null) {
        this.needsRecalculating = true;
        this._minute = value;
    }

    get hour(): number | null {
        return this._hour;
    }
    set hour(value: number | null) {
        this.needsRecalculating = true;
        this._hour = value;
    }

    get day(): number | null {
        return this._day;
    }
    set day(value: number | null) {
        this.needsRecalculating = true;
        this._day = value;
    }

    get month(): number | null {
        return this._month;
    }
    set month(value: number | null) {
        this.needsRecalculating = true;
        this._month = value;
    }

    get year(): number | null {
        return this._year;
    }
    set year(value: number | null) {
        this.needsRecalculating = true;
        this._year = value;
    }


    constructor(
        year: number | null = null,
        month: number | null = null,
        day: number | null = null,
        hour: number | null = null,
        minute: number | null = null
    ) {
       this._year = year;
       this._month = month;
       this._day = day;
       this._hour = hour;
       this._minute = minute;
    }

    public getTimeInMinutes() : bigint {
        // If we haven't changed since we were last checked, recalculate and save values
        if ( this.needsRecalculating) {
            this.needsRecalculating = false;


            //Start with minutes in a year
            let timeMin = multiplyBigIntByNumber(BigInt((this._year || 0)), 525948.768);

            let jsDate: Date = new Date(
                0,
                (this._month || 0) + 1,
                (this._day || 0),
                (this._hour || 0),
                (this._minute || 0)
            );

            //Add millisSinceEpoch, then convert to minutes
            let minutesSince0 = BigInt(Math.round((jsDate.getTime() + 2209050000000) / 60000));

            this.timeInMinutes = minutesSince0 + timeMin;
        }


        return this.timeInMinutes;
    }


    private timeInMinutes: bigint = 0n;

    private needsRecalculating: boolean = true;



    private _year: number | null = null;
    private _month: number | null = null;
    private _day: number | null = null;
    private _hour: number | null = null;
    private _minute: number | null = null;




    private getMonth() : string {
        if (this._month == null) {
            return "";
        }
        let jsDate: Date = new Date();
        jsDate.setMonth(this._month - 1);
        return  jsDate.toLocaleString('default', { month: 'short' });
    }

    private getFullMonth() : string {
        if (this._month == null) {
            return "";
        }
        let jsDate: Date = new Date();
        jsDate.setMonth(this._month - 1);
        return  jsDate.toLocaleString('default', { month: 'long' });
    }


    //This determines how many contiguous "levels" deep the date goes.
    private getGranularityLevels(): bigint {
        let granularityLevels: bigint = 0n;
        let started: boolean = false;
        let levels: string[] = ["year", "month", "day", "hour"];
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



    asReadable(timelineConfig: TimelineConfig) : string {
        let dateWord : string = "";
        let started : boolean = false;
        //granularityLevels is used to determine whether we are done writing the date
        //If we have already finished writing the date (as in the date parser encountered a null value) we do not continue writing
        //This prevents wonky formats like "day/year" or specifying time down to the minute when the user didn't input a month or day
        //Each value will be checked to make sure it's allowed within the granularityScope of the date
        let granularityLevels : bigint = this.getGranularityLevels();
        //This just tells us how many levels deep into a date each level is
        let granularityIndex: Map<string, bigint> = new Map();
        granularityIndex.set("year", 1n);
        granularityIndex.set("month", 2n);
        granularityIndex.set("day", 3n);
        granularityIndex.set("hour", 4n);
        //formatSequence represents the different levels of the date in order to write it out as plain text
        let formatSequence : string[];

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
            if (started) {dateWord += ' ';}

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

function multiplyBigIntByNumber(a: bigint, b: number) : bigint {
    let shiftCount: number = 0;
    let maxSize: number = Number.MAX_SAFE_INTEGER / b;

    while (a > maxSize) {
        shiftCount++
        a = a >> 1n;
        if (shiftCount > 50) {
            return 0n;
        }
    }

    let val: bigint = BigInt(Math.round(Number(a) * b));

    for (let i = 0; i < shiftCount; i++) {
        val = val << 1n;
    }

    return val;
}


function parseDate(input: string): ParsedDate {
    const result: ParsedDate = new ParsedDate();

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

function parseDateFromJavascript(input : Date): ParsedDate {
    return new ParsedDate(
        input.getFullYear(),
        //Month must be incremented
        input.getMonth() + 1,
        input.getDate(),
        input.getHours(),
        input.getMinutes()
    );
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
        } else if (/\s/.test(char)) {
            // Skip whitespace characters
            startIndex--;
        } else {
            let possiblePrefix : string = input.slice(Math.max(0, startIndex - 5), startIndex + 1);
            //Check for BC prefix
            const bcMatch = containsBCPrefix(possiblePrefix);
            if (bcMatch) {
                isNegative = true;
                break;
            } else {
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