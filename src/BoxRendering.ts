enum Justify {
    LEFT,
    RIGHT,
    CENTER
}

enum LineSide {
    TOP,
    BOTTOM
}

interface ParcelizedWrappableText {
    fullTextLines : string[];
    compressedTextLines : string[];
    lineHeight : number;
    compressed : boolean;
    fontSize : number;
}

interface ParcelizedTextBox {
    text: ParcelizedWrappableText;
    height: number;
    width: number;
}

class NumberVessel {
    private value: number;
    constructor(value: number) {
        this.value = value;
    }

    public increment(adder: number) {
        this.value += adder;
    }

    public get() : number {
        return this.value;
    }

    public set(value: number) {
        this.value = value;
    }
}


function minimumParcelizedBox(startingWidth: number, startingHeight: number, ctx: CanvasRenderingContext2D, scale: number, fontSizeGoal: number, padding: number, text: string): ParcelizedTextBox {

    let width = startingWidth;
    let height = startingHeight;
    let outgoingLines: string[];
    const words: string[] = text.split(" ");

    //How much we multiply the size each time to find a box of best fit.
    const expansionCheckMultiplier: number = 1.01;

    while (true) {
        let totalHeight = new NumberVessel(0);

        outgoingLines = splitByLines(ctx, scale, padding, totalHeight, words, width);



        // Check if totalHeight fits within
        if (totalHeight.get() <= height - padding * 2) {
            const metrics = ctx.measureText("");
            const lineHeight = (metrics.fontBoundingBoxDescent + metrics.fontBoundingBoxAscent + padding) / scale;
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


function parcelizeText(
    ctx: CanvasRenderingContext2D,
    scale: number,
    text: string,
    maxWidth: number,
    maxHeight: number,
    padding: number = 3,
    maxFontSize: number,
    minFontSize: number) : ParcelizedWrappableText {
    let words: string[] = text.split(' ');
    let lines: string[] = [];
    let totalHeight: NumberVessel = new NumberVessel(0);
    let fontSize = maxFontSize;

    while (fontSize > 0) {
        ctx.font = fontSize * 2 + 'px Arial'; // set font size
        totalHeight.set(fontSize);

        lines = splitByLines(ctx, scale, padding, totalHeight, words, maxWidth);

        // Check if totalHeight exceeds maxHeight
        if (totalHeight.get() <= maxHeight - padding * 2) break;

        // Decrease font size and clear lines array
        fontSize--;
        lines = [];
    }

    const metrics = ctx.measureText("");
    const lineHeight = (metrics.fontBoundingBoxDescent + metrics.fontBoundingBoxAscent + padding) / scale


    let compressedLines: string[] = [];
    let compressed = fontSize < minFontSize;

    if (compressed) {
        //We run it back, but it's only minimum size
        ctx.font = minFontSize * 2 + 'px Arial'; // set font size
        totalHeight.set(minFontSize);
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
    }



}


function splitByLines(ctx: CanvasRenderingContext2D, scale: number, padding: number, totalHeight: NumberVessel, words : string[], maxWidth: number, maxHeight: number = -1) : string[] {
    let lines: string[] = [];
    let line = "";
    for (let i = 0; i < words.length; i++) {
        let testLine = line + words[i] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width / scale;
        const lineHeight = (metrics.fontBoundingBoxDescent + metrics.fontBoundingBoxAscent + padding) / scale
        if (testWidth > maxWidth - padding * 2 && i > 0) {
            totalHeight.increment(lineHeight);
            lines.push(line.trim());

            //If we have broken our line constraints
            if (maxHeight > 0 && totalHeight.get() >= maxHeight) {
                line = line.slice(0, -3).trim() + "...";
                lines.pop();
                break;
            }
            line = words[i] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line.trim());

    return lines;
}



//For if we have already separately calculated text size and spacing
function drawWrappedTextPrecalculated(
    ctx: CanvasRenderingContext2D,
    scale: number,
    x: number,
    y: number,
    maxWidth: number,
    maxHeight: number,
    parcel: ParcelizedWrappableText,
    padding: number = 3,
    justify: Justify = Justify.LEFT,
    lineSide: LineSide = LineSide.TOP,
    color: string= 'black'
) {

    //console.log("Font size is: " + parcel.fontSize);
    //console.log("Is parcel compressed: " + parcel.compressed);

    ctx.font = parcel.fontSize * 2 + 'px Arial'; // set font size
    ctx.textBaseline = (lineSide == LineSide.TOP) ? "top" : "bottom";

    // Calculate the vertical position to center the text vertically
    //let startY = y + (maxHeight - totalHeight) / 2 + padding;
    let startY = y + padding;


    // Draw lines centered vertically, and justified by our justify
    for (let i = 0; i < parcel.compressedTextLines.length; i++) {
        let lineX: number;
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



function drawWrappedText(
    ctx: CanvasRenderingContext2D,
    scale: number,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    maxHeight: number,
    padding: number = 3,
    justify: Justify = Justify.LEFT,
    lineSide: LineSide = LineSide.TOP,
    fontSize: number = 16,
    minFontSize: number = 0,
    color: string= 'black'
) : ParcelizedWrappableText {
    let parcel: ParcelizedWrappableText = parcelizeText(
        ctx,
        scale,
        text,
        maxWidth,
        maxHeight,
        padding,
        fontSize,
        minFontSize
    )


    drawWrappedTextPrecalculated(
        ctx,
        scale,
        x,
        y,
        maxWidth,
        maxHeight,
        parcel,
        padding,
        justify,
        lineSide,
        color
    )

    return parcel
}


function drawLinePoint(ctx: CanvasRenderingContext2D, scale: number, start: Point, end: Point) {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
}

function drawLine(ctx: CanvasRenderingContext2D, scale: number, startX: number, startY: number, endX: number, endY: number) {
    ctx.beginPath();
    ctx.moveTo(startX * scale, startY * scale);
    ctx.lineTo(endX * scale, endY * scale);
    ctx.stroke();
}