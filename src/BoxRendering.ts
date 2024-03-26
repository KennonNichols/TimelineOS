function drawWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    maxHeight: number,
    padding: number = 3,
    color: string= 'black',
    fontSize: number = 16
) {
    let words = text.split(' ');
    let lines: string[] = [];
    let totalHeight = 0;

    while (fontSize > 0) {
        let line = '';
        ctx.font = fontSize + 'px Arial'; // set font size
        ctx.textBaseline = 'top';
        totalHeight = fontSize;

        for (let i = 0; i < words.length; i++) {
            let testLine = line + words[i] + ' ';
            let metrics = ctx.measureText(testLine);
            let testWidth = metrics.width;
            if (testWidth > maxWidth - padding * 2 && i > 0) {
                lines.push(line);
                totalHeight += fontSize;
                if (totalHeight >= maxHeight - padding * 2) {
                    lines = [];
                    break;
                }
                line = words[i] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);

        // Check if totalHeight exceeds maxHeight
        if (totalHeight <= maxHeight - padding * 2) break;

        // Decrease font size and clear lines array
        fontSize--;
        lines = [];
    }

    // Calculate the vertical position to center the text vertically
    let startY = y + (maxHeight - totalHeight) / 2 + padding;

    // Draw lines centered vertically
    for (let i = 0; i < lines.length; i++) {
        let lineY = startY + i * fontSize;
        ctx.fillText(lines[i], x + padding, lineY);
    }
}
