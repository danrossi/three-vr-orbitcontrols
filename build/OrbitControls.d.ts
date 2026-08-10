import { EventDispatcher, Vector3, Spherical, Vector2 } from 'three';
export default class OrbitControls extends EventDispatcher<any> {
    constructor(object: any, domElement: any);
    object: any;
    domElement: any;
    enabled: boolean;
    target: Vector3;
    minDistance: number;
    maxDistance: number;
    zoomin: boolean;
    minZoom: number;
    maxZoom: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    minAzimuthAngle: number;
    maxAzimuthAngle: number;
    dampingFactor: number;
    mouseDampingFactor: number;
    keyDampingFactor: number;
    enableZoom: boolean;
    zoomSpeed: number;
    enableRotate: boolean;
    rotateSpeed: number;
    rotateSpeedFactor: number;
    enablePan: boolean;
    panSpeed: number;
    screenSpacePanning: boolean;
    keyPanSpeed: number;
    enableKeys: boolean;
    keys: {
        LEFT: string;
        UP: string;
        RIGHT: string;
        BOTTOM: string;
    };
    rotateDirectionLeft: boolean;
    target0: Vector3;
    position0: any;
    zoom0: any;
    state: number;
    spherical: Spherical;
    sphericalDelta: Spherical;
    scale: number;
    panOffset: Vector3;
    zoomChanged: boolean;
    rotateStart: Vector2;
    rotateEnd: Vector2;
    rotateDelta: Vector2;
    panStart: Vector2;
    panEnd: Vector2;
    panDelta: Vector2;
    dollyStart: Vector2;
    dollyEnd: Vector2;
    dollyDelta: Vector2;
    passiveEvent: boolean;
    nonPassiveEvent: boolean;
    getPolarAngle(): number;
    getAzimuthalAngle(): number;
    getZoomScale(): number;
    rotateLeft(angle: any): void;
    rotateRight(angle: any): void;
    rotateUp(angle: any): void;
    panLeft(distance: any, objectMatrix: any): void;
    panUp(distance: any, objectMatrix: any): void;
    pan(deltaX: any, deltaY: any): void;
    dollyIn(dollyScale: any): void;
    dollyOut(dollyScale: any): void;
    /**
     * Vertical auto rotation
     * @param speed
     */
    rotateVertical(speed: any): void;
    /**
     * Horizontal audo rotation
     * @param speed
     */
    rotateHorizontal(speed: any): void;
    setKeyDampingFactor(): void;
    /**
     * Rotate left api
     */
    moveLeft(deg?: null): void;
    /**
     * Rotate right api
     */
    moveRight(deg?: null): void;
    /**
     * Rotate down api
     */
    moveDown(deg?: null): void;
    /**
     * Rotate up api
     */
    moveUp(deg?: null): void;
    resetYAxis(): void;
    resetXAxis(): void;
    zoomIn(): void;
    zoomOut(): void;
    /**
     * Keyboard controls with auto rotation
     * @param event
     */
    handleKeyDown(event: any): void;
    onTouchStart(event: any): void;
    onTouchMove(event: any): void;
    handleTouchStartDollyRotate(): void;
    handleTouchStartPan(): void;
    handleTouchStartDolly(): void;
    handleTouchStartRotate(event: any): void;
    handleTouchStartDollyPan(): void;
    handleTouchMoveRotate(event: any): void;
    handleTouchMovePan(event: any): void;
    handleTouchMoveDolly(event: any): void;
    handleTouchMoveDollyPan(event: any): void;
    handleTouchMoveDollyRotate(event: any): void;
    handleMouseDownRotate(event: any): void;
    handleMouseDownDolly(event: any): void;
    handleMouseDownPan(event: any): void;
    handleMouseMoveRotate(event: any): void;
    handleMouseMoveDolly(event: any): void;
    handleMouseMovePan(event: any): void;
    handleMouseWheel(event: any): void;
    onMouseDown(event: any): void;
    activeElement: any;
    onMouseMove(event: any): void;
    onMouseUp(event: any): void;
    onMouseWheel(event: any): void;
    onKeyDown(event: any): void;
    onPointerDown(event: any): void;
    onPointerMoveRef: ((e: any) => void) | undefined;
    onPointerUpRef: ((e: any) => void) | undefined;
    onPointerMove(event: any): void;
    onPointerUp(event: any): void;
    onPointerCancel(event: any): void;
    connect(): void;
    onMouseWheelRef: ((event: any) => void) | undefined;
    onPointerDownRef: ((event: any) => void) | undefined;
    onPointerCancelRef: ((event: any) => void) | undefined;
    onKeyDownRef: ((event: any) => void) | undefined;
    disconnect(): void;
    saveState(): void;
    reset(): void;
    update(): boolean;
    dispatchStart(): void;
    dispatchChange(): void;
    dispatchEnd(): void;
}
