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

        const nearestPoints = tree.nearest(new Point(-5, -6, -7), 2);
        expect(nearestPoints).to.eql([
            new Point(-4, -5, -6),
            new Point(-7, -8, -9),
        ]);
    });

    it("should split the tree when the number of points exceeds the maximum capacity", () => {
        for (let i = 0; i < 10; i++) {
            tree.insert(new Point(i, i, i));
        }

        // The tree should be split into two nodes, each with 5 points
        expect(tree.root!.left).to.not.be.null;
        expect(tree.root!.right).to.not.be.null;
        expect(tree.root!.points).to.be.empty;
        expect(tree.root!.left!.points).to.have.any;
        expect(tree.root!.left!.points).to.have.any;
    });
});
