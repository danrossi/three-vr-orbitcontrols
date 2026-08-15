import { EventDispatcher, Camera, Vector3, Spherical, Vector2 } from 'three';
export default class OrbitControls extends EventDispatcher<any> {
    /**
     * Constructs a new OmniToneAudio
     *
     * @param {Camera} object =  The camera object.
     * @param {HTMLElement} domElement - The dom element.
     * @constructor
     */
    constructor(object: Camera, domElement: HTMLElement);
    /**
     * the camera object.
     * @type {Camera}
     */
    object: Camera;
    /**
     * the html dom element.
     * @type {HTMLElement}
     */
    domElement: HTMLElement;
    /**
     * Set to false to disable this control.
     * @type {boolean}
     */
    enabled: boolean;
    /**
     * "target" sets the location of focus, where the object orbits around
     * @type {Vector3}
     */
    target: Vector3;
    /**
     * How far you can dolly in and out ( PerspectiveCamera only )
     * @type {number}
     */
    minDistance: number;
    /**
     * How far you can dolly in and out ( PerspectiveCamera only )
     * @type {number}
     */
    maxDistance: number;
    /**
     * Modify camera zoom.
     * @type {boolean}
     */
    zoomin: boolean;
    /**
     * How far you can zoom in and out ( OrthographicCamera only )
     * @type {number}
     */
    minZoom: number;
    /**
     * How far you can zoom in and out ( OrthographicCamera only )
     * @type {number}
     */
    maxZoom: number;
    /**
     * How far you can orbit vertically, upper and lower limits.
     * Range is 0 to Math.PI radians.
     * @type {number}
     */
    minPolarAngle: number;
    /**
     * How far you can orbit vertically, upper and lower limits.
     * Range is 0 to Math.PI radians.
     * @type {number}
     */
    maxPolarAngle: number;
    /**
     * How far you can orbit horizontally, upper and lower limits.
     * If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
     * In radians
     * @type {number}
     */
    minAzimuthAngle: number;
    /**
     * How far you can orbit horizontally, upper and lower limits.
     * If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
     * In radians
     * @type {number}
     */
    maxAzimuthAngle: number;
    /**
     * The current damping factor
     * @type {number}
     */
    dampingFactor: number;
    /**
     * The mouse damping factor
     * @type {number}
     */
    mouseDampingFactor: number;
    /**
     * The keyboard damping factor
     * @type {number}
     */
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
    /**
     * The keyboard key codes
     * @type { { LEFT: string | number, UP: string | number, RIGHT: string | number, BOTTOM: string | number }}
     */
    keys: {
        LEFT: string | number;
        UP: string | number;
        RIGHT: string | number;
        BOTTOM: string | number;
    };
    rotateDirectionLeft: boolean;
    target0: Vector3;
    position0: Vector3;
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
    /**
     * rotate left
     * @param {number} angle - the left angle
     */
    rotateLeft(angle: number): void;
    /**
     * rotate right
     * @param {number} angle - the right angle
     */
    rotateRight(angle: number): void;
    /**
     * rotate up
     * @param {number} angle - the up angle
     */
    rotateUp(angle: number): void;
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
    /**
     * zoom in api
     */
    zoomIn(): void;
    /**
     * zoom out api
     */
    zoomOut(): void;
    /**
     * Keyboard controls with auto rotation
     * @param {KeyboardEvent} event - the keyboard event
     */
    handleKeyDown(event: KeyboardEvent): void;
    /**
     * On touch start
     * @param {TouchEvent} event - the touch start event
     * @returns
     */
    onTouchStart(event: TouchEvent): void;
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
    /**
     * Key down event
     * @param {KeyboardEvent} event - the keyboard event
     */
    onKeyDown(event: KeyboardEvent): void;
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
    /**
     * Key down event
     * @param {KeyboardEvent} event - the keyboard event
     */
    onKeyDownRef: ((event: KeyboardEvent) => void) | undefined;
    disconnect(): void;
    saveState(): void;
    reset(): void;
    update(): boolean;
    dispatchStart(): void;
    dispatchChange(): void;
    dispatchEnd(): void;
}
