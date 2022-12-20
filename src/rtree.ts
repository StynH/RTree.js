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
    public parent: RTreeNode | null;
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
        this.parent = null;
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
    private readonly MAX_POINTS_PER_NODE: number = 4;

    public root: RTreeNode | null;

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

    private splitNode(node: RTreeNode): [RTreeNode, RTreeNode] {
        const centroid = node.getCentroid();
        const sortedPoints = node.points.sort((a, b) => a.distance(centroid) - b.distance(centroid));

        const splitIndex = Math.floor(sortedPoints.length / 2);
        const leftPoints = sortedPoints.slice(0, splitIndex);
        const rightPoints = sortedPoints.slice(splitIndex);

        const leftNode = new RTreeNode(leftPoints);
        const rightNode = new RTreeNode(rightPoints);

        return [leftNode, rightNode];
    }

    public insert(point: Point): void {
        if (this.root === null) {
            this.root = new RTreeNode([point]);
            return;
        }

        let node = this.root;
        while (true) {
            if (node.isLeaf()) {
                this.insertAndExpandBounds(node, point);
                if (node.points.length < this.MAX_POINTS_PER_NODE) {
                    return;
                }

                const splitResult = this.splitNode(node);
                const leftNode = splitResult[0];
                const rightNode = splitResult[1];
                leftNode.parent = node;
                rightNode.parent = node;
                node.left = leftNode;
                node.right = rightNode;
                node.points = [];

                const bounds = node.bounds;
                bounds.minX = Math.min(leftNode.bounds.minX, rightNode.bounds.minX);
                bounds.minY = Math.min(leftNode.bounds.minY, rightNode.bounds.minY);
                bounds.minZ = Math.min(leftNode.bounds.minZ, rightNode.bounds.minZ);
                bounds.maxX = Math.max(leftNode.bounds.maxX, rightNode.bounds.maxX);
                bounds.maxY = Math.max(leftNode.bounds.maxY, rightNode.bounds.maxY);
                bounds.maxZ = Math.max(leftNode.bounds.maxZ, rightNode.bounds.maxZ);

                node = node.parent!;
                if (node === null) {
                    return;
                }
            } else {
                // Choose the child node that is the best fit for the point
                const leftDistance = node.left!.getCentroid().distance(point);
                const rightDistance = node.right!.getCentroid().distance(point);
                if (leftDistance < rightDistance) {
                    node = node.left!;
                } else {
                    node = node.right!;
                }
            }
        }
    }

    public traverse(operation: (node: RTreeNode) => void): void {
        if (this.root === null) {
            return;
        }

        const stack: RTreeNode[] = [this.root];
        while (stack.length > 0) {
            const node = stack.pop();
            if (node === null) {
                continue;
            }

            operation(node!);
            stack.push(node!.left!, node!.right!);
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
