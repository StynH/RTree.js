import {Point, RTree} from "./rtree";

const tree = new RTree();

// Insert points into the tree
tree.insert(new Point(1, 2, 3));
tree.insert(new Point(2, 3, 4));
tree.insert(new Point(3, 4, 5));
tree.insert(new Point(4, 5, 6));
tree.insert(new Point(5, 6, 7));
tree.insert(new Point(6, 7, 8));
tree.insert(new Point(7, 8, 9));
tree.insert(new Point(8, 9, 10));
tree.insert(new Point(9, 10, 11));
tree.insert(new Point(10, 11, 12));

// Find the nearest points to the point (5, 6, 7) within a distance of 2 units
const nearestPoints = tree.nearest(new Point(5, 6, 7), 10);
console.log(nearestPoints);
