export class Point {
    public x: number;
    public y: number;
    public z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public distance(other: Point): number {
        return Math.sqrt(
            (this.x - other.x) ** 2 + (this.y - other.y) ** 2 + (this.z - other.z) ** 2
        );
    }

    public equal(other: Point): boolean {
        return this.x === other.x && this.y === other.y && this.z === other.z;
    }

    public compare(other: Point, axis: number | null): number {
        if (axis === 0) {
            return this.x - other.x;
        } else if (axis === 1) {
            return this.y - other.y;
        } else if (axis === 2) {
            return this.z - other.z;
        }
        throw new Error("Invalid axis");
    }
}

class RTreeNode {
    public points: Point[];
    public left: RTreeNode | null;
    public right: RTreeNode | null;
    public bounds: {
        minX: number;
        minY: number;
        minZ: number;
        maxX: number;
        maxY: number;
        maxZ: number;
    };

    constructor(points: Point[]) {
        this.points = points;
        this.left = null;
        this.right = null;
        this.bounds = {
            minX: Number.POSITIVE_INFINITY,
            minY: Number.POSITIVE_INFINITY,
            minZ: Number.POSITIVE_INFINITY,
            maxX: Number.NEGATIVE_INFINITY,
            maxY: Number.NEGATIVE_INFINITY,
            maxZ: Number.NEGATIVE_INFINITY,
        };

        for (const point of points) {
            this.bounds.minX = Math.min(this.bounds.minX, point.x);
            this.bounds.minY = Math.min(this.bounds.minY, point.y);
            this.bounds.minZ = Math.min(this.bounds.minZ, point.z);
            this.bounds.maxX = Math.max(this.bounds.maxX, point.x);
            this.bounds.maxY = Math.max(this.bounds.maxY, point.y);
            this.bounds.maxZ = Math.max(this.bounds.maxZ, point.z);
        }
    }

    public traverse(operation: (node: RTreeNode) => void): void {
        if (this.left !== null) {
            this.left.traverse(operation);
        }

        operation(this);

        if (this.right !== null) {
            this.right.traverse(operation);
        }
    }

    public getCentroid(): Point {
        const x = (this.bounds.minX + this.bounds.maxX) / 2;
        const y = (this.bounds.minY + this.bounds.maxY) / 2;
        const z = (this.bounds.minZ + this.bounds.maxZ) / 2;
        return new Point(x, y, z);
    }

    public isLeaf(): boolean {
        return this.left === null && this.right === null;
    }
}

export class RTree {
    root: RTreeNode | null;

    constructor() {
        this.root = null;
    }

    private insertAndExpandBounds(node: RTreeNode, point: Point): void{
        node.points.push(point);
        const bounds = node.bounds;
        bounds.minX = Math.min(bounds.minX, point.x);
        bounds.minY = Math.min(bounds.minY, point.y);
        bounds.minZ = Math.min(bounds.minZ, point.z);
        bounds.maxX = Math.max(bounds.maxX, point.x);
        bounds.maxY = Math.max(bounds.maxY, point.y);
        bounds.maxZ = Math.max(bounds.maxZ, point.z);
    }

    public insert(point: Point): void {
        if (this.root === null) {
            this.root = new RTreeNode([point]);
            return;
        }

        let node = this.root;
        while (true) {
            if (node.isLeaf() && node.points.length < 4) {
                this.insertAndExpandBounds(node, point);
                break;
            } else if(!node.isLeaf()) {
                node =
                    point.distance(node.left!.getCentroid()) <
                    point.distance(node.right!.getCentroid())
                        ? node.left!
                        : node.right!;
                continue;
            }

            let minEnlargement = Number.POSITIVE_INFINITY;
            let chosenChild: RTreeNode | null = null;
            let newPoints: Point[] | null = null;
            for (const child of [node.left, node.right]) {
                if (child === null){
                    continue;
                }

                const enlargedBounds = {
                    minX: Math.min(child.bounds.minX, point.x),
                    minY: Math.min(child.bounds.minY, point.y),
                    minZ: Math.min(child.bounds.minZ, point.z),
                    maxX: Math.max(child.bounds.maxX, point.x),
                    maxY: Math.max(child.bounds.maxY, point.y),
                    maxZ: Math.max(child.bounds.maxZ, point.z),
                };

                const volumeEnlargement =
                    (enlargedBounds.maxX - enlargedBounds.minX) *
                    (enlargedBounds.maxY - enlargedBounds.minY) *
                    (enlargedBounds.maxZ - enlargedBounds.minZ) -
                    (child.bounds.maxX - child.bounds.minX) *
                    (child.bounds.maxY - child.bounds.minY) *
                    (child.bounds.maxZ - child.bounds.minZ);

                if (volumeEnlargement < minEnlargement) {
                    minEnlargement = volumeEnlargement;
                    chosenChild = child;
                    newPoints = child.points.concat([point]);
                }
            }

            if (chosenChild === null) {
                this.insertAndExpandBounds(node, point);
                break;
            }

            node = chosenChild;
            if (newPoints !== null) {
                node.points = newPoints;
                node.bounds = {
                    minX: Number.POSITIVE_INFINITY,
                    minY: Number.POSITIVE_INFINITY,
                    minZ: Number.POSITIVE_INFINITY,
                    maxX: Number.NEGATIVE_INFINITY,
                    maxY: Number.NEGATIVE_INFINITY,
                    maxZ: Number.NEGATIVE_INFINITY,
                };

                for (const point of node.points) {
                    node.bounds.minX = Math.min(node.bounds.minX, point.x);
                    node.bounds.minY = Math.min(node.bounds.minY, point.y);
                    node.bounds.minZ = Math.min(node.bounds.minZ, point.z);
                    node.bounds.maxX = Math.max(node.bounds.maxX, point.x);
                    node.bounds.maxY = Math.max(node.bounds.maxY, point.y);
                    node.bounds.maxZ = Math.max(node.bounds.maxZ, point.z);
                }
            }
        }

        let splitNode: RTreeNode | null = null;
        let splitAxis: number | null = null;
        let splitIndex: number | null = null;
        while (true) {
            if (node === null || node.points.length <= 4){
                break;
            }

            splitNode = node;
            splitAxis = null;
            splitIndex = null;
            let minLongestSide = Number.POSITIVE_INFINITY;
            for (let axis = 0; axis < 3; axis++) {
                const sortedPoints = [...node.points].sort((a, b) => a.compare(b, axis));
                let minWaste = Number.POSITIVE_INFINITY;
                for (let i = 1; i < sortedPoints.length; i++) {
                    const leftPoints = sortedPoints.slice(0, i);
                    const rightPoints = sortedPoints.slice(i);
                    const leftBounds = {
                        minX: Number.POSITIVE_INFINITY,
                        minY: Number.POSITIVE_INFINITY,
                        minZ: Number.POSITIVE_INFINITY,
                        maxX: Number.NEGATIVE_INFINITY,
                        maxY: Number.NEGATIVE_INFINITY,
                        maxZ: Number.NEGATIVE_INFINITY,
                    };

                    for (const point of leftPoints) {
                        leftBounds.minX = Math.min(leftBounds.minX, point.x);
                        leftBounds.minY = Math.min(leftBounds.minY, point.y);
                        leftBounds.minZ = Math.min(leftBounds.minZ, point.z);
                        leftBounds.maxX = Math.max(leftBounds.maxX, point.x);
                        leftBounds.maxY = Math.max(leftBounds.maxY, point.y);
                        leftBounds.maxZ = Math.max(leftBounds.maxZ, point.z);
                    }

                    const rightBounds = {
                        minX: Number.POSITIVE_INFINITY,
                        minY: Number.POSITIVE_INFINITY,
                        minZ: Number.POSITIVE_INFINITY,
                        maxX: Number.NEGATIVE_INFINITY,
                        maxY: Number.NEGATIVE_INFINITY,
                        maxZ: Number.NEGATIVE_INFINITY,
                    };

                    for (const point of rightPoints) {
                        rightBounds.minX = Math.min(rightBounds.minX, point.x);
                        rightBounds.minY = Math.min(rightBounds.minY, point.y);
                        rightBounds.minZ = Math.min(rightBounds.minZ, point.z);
                        rightBounds.maxX = Math.max(rightBounds.maxX, point.x);
                        rightBounds.maxY = Math.max(rightBounds.maxY, point.y);
                        rightBounds.maxZ = Math.max(rightBounds.maxZ, point.z);
                    }

                    const leftWaste =
                        (leftBounds.maxX - leftBounds.minX) *
                        (leftBounds.maxY - leftBounds.minY) *
                        (leftBounds.maxZ - leftBounds.minZ) -
                        leftPoints.length * 0.75;

                    const rightWaste =
                        (rightBounds.maxX - rightBounds.minX) *
                        (rightBounds.maxY - rightBounds.minY) *
                        (rightBounds.maxZ - rightBounds.minZ) -
                        rightPoints.length * 0.75;

                    if (leftWaste + rightWaste < minWaste) {
                        minWaste = leftWaste + rightWaste;
                        splitAxis = axis;
                        splitIndex = i;
                    }
                }

                if (
                    sortedPoints[sortedPoints.length - 1].distance(sortedPoints[0]) < minLongestSide
                ) {
                    minLongestSide = sortedPoints[sortedPoints.length - 1].distance(sortedPoints[0]);
                    splitAxis = axis;
                    splitIndex = sortedPoints.length / 2;
                }
            }

            if (splitAxis === null || splitIndex === null) {
                splitNode = null;
                break;
            }

            node.points.sort((a, b) => a.compare(b, splitAxis));
            const leftPoints = node.points.slice(0, splitIndex);
            const rightPoints = node.points.slice(splitIndex);
            node.left = new RTreeNode(leftPoints);
            node.right = new RTreeNode(rightPoints);
            node.points = [];
        }

        if (splitNode !== null) {
            const parent = new RTreeNode(splitNode.points);
            parent.left = splitNode.left;
            parent.right = splitNode.right;
            if (splitNode === this.root) {
                this.root = parent;
            }
            else {
                let curr: RTreeNode | null = this.root;
                while (curr !== null) {
                    if (curr.left === splitNode || curr.right === splitNode) {
                        if (curr.left === splitNode) {
                            curr.left = parent;
                        }
                        else {
                            curr.right = parent;
                        }
                        break;
                    }

                    if (curr.left !== null && curr.right !== null) {
                        curr = curr.left.points.length <= curr.right.points.length ? curr.left : curr.right;
                    }
                    else if (curr.left !== null) {
                        curr = curr.left;
                    }
                    else if (curr.right !== null) {
                        curr = curr.right;
                    }
                    else {
                        curr = null;
                    }
                }
            }
        }
    }

    public traverse(operation: (node: RTreeNode) => void): void {
        if (this.root !== null) {
            this.root.traverse(operation);
        }
    }

    public nearest(point: Point, maxPoints: number): Point[] {
        let points: Point[] = [];
        this.traverse(node => {
            for (const nodePoint of node.points) {
                if(!points.includes(nodePoint) && !point.equal(nodePoint)){
                    points.push(nodePoint);
                }
            }
        });
        points = this.bubbleSortPoints(point, points)

        return points.slice(0, maxPoints);
    }

    private bubbleSortPoints(referencePoint: Point, points: Point[]): Point[] {
        let sorted = false;
        while (!sorted) {
            sorted = true;
            for (let i = 0; i < points.length - 1; i++) {
                if (points[i].distance(referencePoint) > points[i + 1].distance(referencePoint)) {
                    const temp = points[i];
                    points[i] = points[i + 1];
                    points[i + 1] = temp;
                    sorted = false;
                }
            }
        }
        return points;
    }
}
