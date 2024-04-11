class Point {
    public x : number;
    public y : number;
    constructor(x: number | bigint, y: number | bigint) {
        this.x = Number(x);
        this.y = Number(y);
    }

    static add(a : Point, b : Point): Point {
        return new Point(a.x + b.x, a.y + b.y);
    }
}

Point.prototype.toString = function pointToString() {
    return `(${this.x}, ${this.y})`;
};


function bigint_min(...args: bigint[]){
    if (args.length < 1){ throw 'Min of empty list'; }
    let m = args[0];
    args.forEach(a=>{if (a < m) {m = a}});
    return m;
}

function bigint_max(...args: bigint[]){
    if (args.length < 1){ throw 'Max of empty list'; }
    let m = args[0];
    args.forEach(a=>{if (a > m) {m = a}});
    return m;
}

class LayoutManager {

    static setScaledEventPositions(timeline: Timeline, startingPoint: Point) {
        //console.log("Recalculating");

        let points: Point[] = [startingPoint];
        let widthSum;
        let heightSum;

        let trueWidthSum = 0;
        let trueHeightSum = 0;

        const standardYStep = timeline.getStandardYStep();
        const standardXStep = timeline.getStandardXStep();
        const events = timeline.events;
        const timelineConfig = timeline.timelineConfig;

        if (timeline.events.length > 1) {
            widthSum = standardXStep * (events.length - 1);
            heightSum = standardYStep * (events.length - 1);
        }
        else {
            widthSum = standardXStep;
            heightSum = standardYStep;
        }


        if (timelineConfig.dateSort && events.length > 1) {
            // When dateSort is true, calculate proportional distances

            // Find the min and max times to understand the timeline span
            const times = events.map(e => e.date.getTimeInMinutes());
            const minTime = bigint_min(...times);
            const maxTime = bigint_max(...times);
            const timeSpan = maxTime - minTime;
            let currentTime = minTime;

            let step: Point = startingPoint;

            // Calculate positions based on time proportion (we start at 1 because startingPoint is standard)
            for (let i = 1; i < events.length; i++) {
                let timeGap = events[i].date.getTimeInMinutes() - currentTime;

                currentTime += timeGap;

                const timeProportion: number = Number(timeGap) / Number(timeSpan);

                //Do not go under standard x step
                const jump = new Point(timelineConfig.verticalLayout ? 0 : Math.max((widthSum * timeProportion), standardXStep), timelineConfig.verticalLayout ? Math.max((heightSum * timeProportion), standardYStep) : 0);
                step = Point.add(step, jump);
                points.push(step);
            }
            trueWidthSum = step.x;
            trueHeightSum = step.y;
        } else {
            // Use fixed spacing as before
            let step = new Point(timelineConfig.verticalLayout ? 0 : standardXStep, timelineConfig.verticalLayout ? standardYStep : 0);
            for (let i = 1; i < events.length; i++) {
                let lastPoint = points[points.length - 1];
                points.push(Point.add(lastPoint, step));
                trueWidthSum += step.x;
                trueHeightSum += step.y;
            }
        }

        if (points.length < events.length) {
            throw new Error(`Less points than events! ${points.length} instead of ${events.length}.`);
        }

        timeline.points = points;
        timeline.totalWidth = trueWidthSum - standardXStep * (timelineConfig.eventCount - 1);
        timeline.totalHeight = trueHeightSum - standardYStep * (timelineConfig.eventCount - 1);
    }

}