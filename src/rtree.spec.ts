import { RTree, Point } from "./rtree";
import {expect} from "chai";

describe("RTree", () => {
    let tree: RTree;

    beforeEach(() => {
        tree = new RTree();
    });

    it("should insert points into the tree", () => {
        tree.insert(new Point(1, 2, 3));
        tree.insert(new Point(4, 5, 6));
        tree.insert(new Point(7, 8, 9));

        expect(tree.root!.points).to.eql([
            new Point(1, 2, 3),
            new Point(4, 5, 6),
            new Point(7, 8, 9),
        ]);
    });

    it('should expand bounds on insertion', () => {
        const points = [
            new Point(1, 2, 3),
            new Point(4, 5, 6),
            new Point(7, 8, 9),
        ];

        tree.insert(points[0]);
        tree.insert(points[1]);
        tree.insert(points[2]);

        expect(tree.root!.points).eql(points);
        expect(tree.root!.bounds).eql({
            minX: 1,
            minY: 2,
            minZ: 3,
            maxX: 7,
            maxY: 8,
            maxZ: 9,
        });
    });

    it("should find the nearest points to a given point", () => {
        tree.insert(new Point(1, 2, 3));
        tree.insert(new Point(4, 5, 6));
        tree.insert(new Point(7, 8, 9));

        const nearestPoints = tree.nearest(new Point(5, 6, 7), 2);
        expect(nearestPoints).to.eql([
            new Point(4, 5, 6),
            new Point(7, 8, 9),
        ]);
    });


    it("should insert points with negative coordinates", () => {
        tree.insert(new Point(-1, -2, -3));
        tree.insert(new Point(-4, -5, -6));
        tree.insert(new Point(-7, -8, -9));

        expect(tree.root!.points).to.eql([
            new Point(-1, -2, -3),
            new Point(-4, -5, -6),
            new Point(-7, -8, -9),
        ]);
    });

    it("should find the nearest points to a given point with negative coordinates", () => {
        tree.insert(new Point(-1, -2, -3));
        tree.insert(new Point(-4, -5, -6));
        tree.insert(new Point(-7, -8, -9));
        tree.insert(new Point(-9, -9, -9));
        tree.insert(new Point(-5, -5, -5));

        const nearestPoints = tree.nearest(new Point(-5, -6, -7), 2);
        expect(nearestPoints).to.eql([
            new Point(-4, -5, -6),
            new Point(-5, -5, -5),
        ]);
    });

    it("should split the tree when the number of points exceeds the maximum capacity", () => {
        for (let i = 0; i < 4; i++) {
            tree.insert(new Point(i, i, i));
        }

        // The tree should be split into two nodes, each with 5 points
        expect(tree.root!.left).to.not.be.null;
        expect(tree.root!.right).to.not.be.null;
        expect(tree.root!.points).to.be.empty;
        expect(tree.root!.left!.points).to.have.length(2);
        expect(tree.root!.left!.points).to.have.length(2);
    });

    it("should balance itself", () => {
        const tree = new RTree();

        // Insert some points into the tree
        tree.insert(new Point(1, 2, 3));
        tree.insert(new Point(2, 3, 4));
        tree.insert(new Point(3, 4, 5));
        tree.insert(new Point(4, 5, 6));

        // Calculate the height of the tree
        let height = 1;
        const stack: any = [{ node: tree.root, height: 1 }];
        while (stack.length > 0) {
            const item = stack.pop();
            const node = item.node;
            const h = item.height;

            if (node === null) {
                continue;
            }

            height = Math.max(height, h);
            if (!node.isLeaf()) {
                stack.push({ node: node.left, height: h + 1 });
                stack.push({ node: node.right, height: h + 1 });
            }
        }

        expect(height).to.be.within(2, 3);
    });
});
