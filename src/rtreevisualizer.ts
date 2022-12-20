import * as THREE from 'three';
import { RTree, RTreeNode, Point } from './rtree';

export class RTreeVisualizer {
    private readonly WINDOW_WIDTH: number = 1024;
    private readonly WINDOW_HEIGHT: number = 1024;

    private readonly tree: RTree;
    private readonly scene: THREE.Scene;
    private readonly camera: THREE.PerspectiveCamera;
    private readonly renderer: THREE.WebGLRenderer;
    private readonly scale: number = 1;

    private rotationAngle: number = 0;
    private previousX: number = 0;

    constructor(tree: RTree, scale: number) {
        this.tree = tree;
        this.scale = scale;

        this.scene = new THREE.Scene();
        const light = new THREE.AmbientLight(0xffaaff);
        light.position.set(10, 10, 10);
        this.scene.add(light);

        this.camera = new THREE.PerspectiveCamera(
            75, this.WINDOW_WIDTH / this.WINDOW_HEIGHT, 0.1, 1000
        );
        this.rotateScene(45);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor( 0xFFFFFF, 1 );
        this.renderer.setSize(this.WINDOW_WIDTH, this.WINDOW_HEIGHT);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.renderer.domElement.addEventListener('mousedown', (event) => {
            this.previousX = event.clientX;
        });

        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (event.buttons === 1) {
                this.rotateScene((event.clientX - this.previousX) / this.WINDOW_WIDTH);
                this.previousX = event.clientX;
            }
        });

        document.body.appendChild(this.renderer.domElement);
    }

    public visualize(): void {
        this.visualizeNode(this.tree.root, this.scale);
        this.renderer.render(this.scene, this.camera);
    }

    public startRenderLoop(): void {
        const render = () => {
            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }

    public rotateScene(delta: number): void {
        this.rotationAngle += delta;

        const center = this.getTreeCenter(this.tree,this.scale);

        const distance = 125;
        const x = center.x + distance * Math.sin(this.rotationAngle);
        const y = center.y + distance;
        const z = center.z + distance * Math.cos(this.rotationAngle);
        this.camera.position.set(x, y, z);

        this.camera.lookAt(center);
    }

    private visualizeNode(node: RTreeNode | null, scale: number): void {
        if (!node) {
            return;
        }

        this.visualizePoints(node.points, scale);
        this.visualizeBounds(node.bounds, scale, node.isLeaf());
        this.visualizeNode(node.left, scale);
        this.visualizeNode(node.right, scale);
    }

    private visualizePoints(points: Point[], scale: number): void {
        for (const point of points) {
            const sphereGeometry = new THREE.SphereGeometry(0.1 * scale, 16, 16);
            const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

            sphere.name = `sphere${point.x},${point.y},${point.z}`;
            sphere.position.set(point.x * scale, point.y * scale, point.z * scale);

            this.scene.add(sphere);
        }
    }

    private visualizeBounds(bounds: {
        minX: number;
        minY: number;
        minZ: number;
        maxX: number;
        maxY: number;
        maxZ: number;
    }, scale: number, isLeaf: boolean): void {

        const boxGeometry = new THREE.BoxGeometry(
            (bounds.maxX - bounds.minX) * scale,
            (bounds.maxY - bounds.minY) * scale,
            (bounds.maxZ - bounds.minZ) * scale
        );
        const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
        const boxMaterial = new THREE.LineBasicMaterial({ color: isLeaf ? 0x000000 : 0x0000FF });
        const box = new THREE.LineSegments(edgesGeometry, boxMaterial);
        box.position.set(
            (bounds.minX + bounds.maxX) / 2 * scale,
            (bounds.minY + bounds.maxY) / 2 * scale,
            (bounds.minZ + bounds.maxZ) / 2 * scale
        );
        this.scene.add(box);
    }

    private getTreeCenter(tree: RTree, scale: number): THREE.Vector3 {
        let minX = Infinity;
        let minY = Infinity;
        let minZ = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let maxZ = -Infinity;

        const traverse = (node: RTreeNode | null) => {
            if (!node) {
                return;
            }

            for (const point of node.points) {
                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                minZ = Math.min(minZ, point.z);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);
                maxZ = Math.max(maxZ, point.z);
            }

            traverse(node.left);
            traverse(node.right);
        };

        traverse(tree.root);

        const x = (maxX + minX) / 2 * scale;
        const y = (maxY + minY) / 2 * scale;
        const z = (maxZ + minZ) / 2 * scale;
        return new THREE.Vector3(x, y, z);
    }
}
