class Bounds {
    constructor(min, max) {
        this.min=min;
        this.max=max;
    }


    union(...bounds) {
        let min = this.min;
        let max = this.max;
        for (let b of bounds) {
            min = min.min(b.min);
            max = max.max(b.max);
        }
        return new Bounds(min, max);
    }
}

