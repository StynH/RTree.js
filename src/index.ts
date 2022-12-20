import {Point, RTree} from "./rtree";
import {RTreeVisualizer} from "./rtreevisualizer";
import {generateRandomNumber} from "./rand";

const tree = new RTree();

for(let i = 0; i < 40; ++i){
    tree.insert(new Point(generateRandomNumber(0, 12), generateRandomNumber(0, 12), generateRandomNumber(0, 12)));
}

const nearestPoints = tree.nearest(new Point(5, 6, 7), 5);
for(const nodePoint of nearestPoints){
    console.log(nodePoint, new Point(5, 6, 7), new Point(5, 6, 7).distance(nodePoint));
}

const visualizer = new RTreeVisualizer(tree, 10);
visualizer.visualize();
visualizer.startRenderLoop();
