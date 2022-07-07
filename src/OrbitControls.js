import { EventDispatcher } from '../../three.js/src/core/EventDispatcher';
import { Quaternion } from '../../three.js/src/math/Quaternion';
import { Vector2 } from '../../three.js/src/math/Vector2';
import { Vector3 } from '../../three.js/src/math/Vector3';
import { Spherical } from '../../three.js/src/math/Spherical';
import * as MathUtils from '../../three.js/src/math/MathUtils';
import { MOUSE, TOUCH } from '../../three.js/src/constants';

/*
import {
	EventDispatcher,
	Quaternion,
	Spherical,
	MathUtils,
	Vector2,
	Vector3,
	MOUSE,
	TOUCH
} from "../../three.js/build/three.module.js";*/


/**
 * OrbitControls for mouse and keyboard controls.
 * Changes to turn it into a js module for bundling.
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 * @author danrossi / https://www.electroteque.org
 */

// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finter swipe


const EPS = 0.000001,
STATE = {
	NONE: - 1,
	ROTATE: 0,
	DOLLY: 1,
	PAN: 2,
	TOUCH_ROTATE: 3,
	TOUCH_PAN: 4,
	TOUCH_DOLLY_PAN: 5,
	TOUCH_DOLLY_ROTATE: 6
},
_pointerPositions = {},
mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN },
touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };

let _pointers = [];

function addPointer( event ) {
	_pointers.push( event );
}

function removePointer( event ) {
	delete _pointerPositions[ event.pointerId ];
	for ( let i = 0; i < _pointers.length; i ++ ) {
		if ( _pointers[ i ].pointerId == event.pointerId ) {
			_pointers.splice( i, 1 );
			return;
		}
	}
}

function trackPointer( event ) {

	let position = _pointerPositions[ event.pointerId ];

	if ( position === undefined ) {

		position = new Vector2();
		_pointerPositions[ event.pointerId ] = position;
	}
	position.set( event.pageX, event.pageY );
}

function getSecondPointerPosition( event ) {
	if (!_pointers.length) return;
	const pointer = ( event.pointerId === _pointers[ 0 ].pointerId ) ? _pointers[ 1 ] : _pointers[ 0 ];
	return _pointerPositions[ pointer.pointerId ];
}

class OrbitControls extends EventDispatcher {
	constructor( object, domElement) {

		super();

		domElement.style.touchAction = 'none'; // disable touch scroll

		this.object = object,
		this.domElement = ( domElement !== undefined ) ? domElement : document,
		// Set to false to disable this control
		this.enabled = true;
		// "target" sets the location of focus, where the object orbits around
		this.target = new Vector3(),
		// How far you can dolly in and out ( PerspectiveCamera only )
		this.minDistance = 0,
		this.maxDistance = Infinity,
		this.zoomin = false,
		// How far you can zoom in and out ( OrthographicCamera only )
		this.minZoom = 0,
		this.maxZoom = Infinity,
		// How far you can orbit vertically, upper and lower limits.
		// Range is 0 to Math.PI radians.
		this.minPolarAngle = 0, // radians
		this.maxPolarAngle = Math.PI, // radians
		// How far you can orbit horizontally, upper and lower limits.
		// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
		this.minAzimuthAngle = - Infinity, // radians
		this.maxAzimuthAngle = Infinity, // radians
		// Set to true to enable damping (inertia)
		// If damping is enabled, you must call controls.update() in your animation loop
		//this.enableDamping = true,
		this.dampingFactor = 0.05,
		this.mouseDampingFactor = 0.05,
		//this.releaseDampingFactor = 0.05,
		//this.releaseDampingDelay = 2000,
		//the damping factor for key controls. This needs a more smoother response.
		this.keyDampingFactor = 0.05,
		// This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
		// Set to false to disable zooming
		this.enableZoom = true,
		this.zoomSpeed = 1.0,
		// Set to false to disable rotating
		this.enableRotate = true,
		this.rotateSpeed = 1.0,
		this.rotateSpeedFactor = 3,

		// Set to false to disable panning
		this.enablePan = true,
		this.panSpeed = 1,
		this.screenSpacePanning = false, // if true, pan in screen-space
		this.keyPanSpeed = 7.0,	// pixels moved per arrow key push

		// Set to true to automatically rotate around the target
		// If auto-rotate is enabled, you must call controls.update() in your animation loop
		//this.autoRotate = false,
		//this.autoRotateSpeed = 2.0, // 30 seconds per round when fps is 60

		// Set to false to disable use of the keys
		this.enableKeys = true,

		// The four arrow keys
		//this.keys = { left: 37, up: 38, right: 39, bottom: 40 },
		this.keys = { LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown' };

		// Mouse buttons
		//this.mouseButtons = { ORBIT: MOUSE.LEFT, ZOOM: MOUSE.MIDDLE, PAN: MOUSE.RIGHT },
		//this.mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };
		//this.touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };

		this.rotateDirectionLeft = true;

		// for reset
		this.target0 = this.target.clone(),
		this.position0 = this.object.position.clone(),
		this.zoom0 = this.object.zoom,
		this.state = STATE.NONE,
	// current position in spherical coordinates
		this.spherical = new Spherical(),
		this.sphericalDelta = new Spherical(),

		this.scale = 1,
		this.panOffset = new Vector3(),
		this.zoomChanged = false,

		this.rotateStart = new Vector2(),
		this.rotateEnd = new Vector2(),
		this.rotateDelta = new Vector2(),

		this.panStart = new Vector2(),
		this.panEnd = new Vector2(),
		this.panDelta = new Vector2(),

		this.dollyStart = new Vector2(),
		this.dollyEnd = new Vector2(),
		this.dollyDelta = new Vector2();

		this.passiveEvent = false;
		this.nonPassiveEvent = false;
		/*try {
		    const opts = Object.defineProperty({}, 'passive', {
		        get: () => {
		            this.passiveEvent = { passive: true };
		            this.nonPassiveEvent = { passive: false };
		        }
		    });
		    window.addEventListener("test", null, opts);
		} catch (e) { }*/

		this.connect();

		// force an update at start
		this.update();
	}

	getPolarAngle () {
		return this.spherical.phi;
	}

	getAzimuthalAngle () {
		return this.spherical.theta;
	}

	/*getAutoRotationAngle() {
		return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
	}*/

	getZoomScale() {
		return Math.pow( 0.95, this.zoomSpeed );
	}

	rotateLeft( angle ) {
		this.sphericalDelta.theta -= angle;
	}

	rotateRight( angle ) {
		this.sphericalDelta.theta += angle;
	}

	rotateUp( angle ) {
		this.sphericalDelta.phi -= angle;
	}

	panLeft(distance, objectMatrix) {

		const v = new Vector3();

		v.setFromMatrixColumn( objectMatrix, 0 ); // get X column of objectMatrix
		v.multiplyScalar( - distance );

		this.panOffset.add( v );
	}

	panUp(distance, objectMatrix) {

		const v = new Vector3();

		if ( this.screenSpacePanning === true ) {
			v.setFromMatrixColumn( objectMatrix, 1 );
		} else {
			v.setFromMatrixColumn( objectMatrix, 0 );
			v.crossVectors( this.object.up, v );
		}

		v.multiplyScalar( distance );

		this.panOffset.add( v );
	}

	// deltaX and deltaY are in pixels; right and down are positive
	pan(deltaX, deltaY) {

		const offset = new Vector3();

		const element = this.domElement === document ? this.domElement.body : this.domElement;
			// perspective
			const position = this.object.position;
			offset.copy( position ).sub( this.target );
			let targetDistance = offset.length();

			// half of the fov is center to top of screen
			targetDistance *= Math.tan( ( this.object.fov / 2 ) * Math.PI / 180.0 );

			// we actually don't use screenWidth, since perspective camera is fixed to screen height
			this.panLeft( 2 * deltaX * targetDistance / element.clientHeight, this.object.matrix );
			this.panUp( 2 * deltaY * targetDistance / element.clientHeight, this.object.matrix );

	}

	dollyIn( dollyScale ) {

			this.scale /= dollyScale;

			if (this.zoomin) {
				this.object.zoom = Math.max( this.minZoom, Math.min( this.maxZoom, this.object.zoom / dollyScale ) );
				this.object.updateProjectionMatrix();
				this.zoomChanged = true;
			}
	}

	dollyOut( dollyScale ) {

			this.scale *= dollyScale;

			if (this.zoomin) {
				this.object.zoom = Math.max( 0.3, Math.min( this.maxZoom, this.object.zoom * dollyScale ) );
				this.object.updateProjectionMatrix();
				this.zoomChanged = true;
			}
	}


	/**
	 * Vertical auto rotation
	 * @param speed
	 */
	rotateVertical(speed) {
		this.rotateUp(MathUtils.degToRad(speed));
		this.update();
	}

	/**
	 * Horizontal audo rotation
	 * @param speed
	 */
	rotateHorizontal(speed) {
		this.rotateLeft(MathUtils.degToRad(speed));
		this.update();
	}

	setKeyDampingFactor() {
		this.dampingFactor = this.keyDampingFactor;
	}


	/**
	 * Rotate left api
	 */
	moveLeft(deg = null) {
		const angle = deg || this.rotateSpeed * this.rotateSpeedFactor;
		this.setKeyDampingFactor();
		this.rotateHorizontal(angle);
	}

	/**
	 * Rotate right api
	 */
	moveRight(deg = null) {
		const angle = deg || this.rotateSpeed * this.rotateSpeedFactor;
		this.setKeyDampingFactor();
		this.rotateHorizontal(-angle);
	}

	/**
	 * Rotate down api
	 */
	moveDown(deg = null) {
		const angle = deg || this.rotateSpeed * this.rotateSpeedFactor;
		this.setKeyDampingFactor();
		this.rotateVertical(angle);
	}

	/**
	 * Rotate up api
	 */
	moveUp(deg = null) {
		const angle = deg || this.rotateSpeed * this.rotateSpeedFactor;
		this.setKeyDampingFactor();
		this.rotateVertical(-angle);
	}

	resetYAxis() {
		this.sphericalDelta.phi = 0.2;
		this.object.position.y = this.position0.y;
		this.update();
	}

	resetXAxis() {
		this.sphericalDelta.theta = (this.sphericalDelta.theta < 0 ? .5 : -.5);
		this.object.position.x = this.position0.x;
		this.update();
	}

	zoomIn() {
		this.dollyIn(this.getZoomScale() );

		this.update();
	}

	zoomOut() {
		this.dollyOut(this.getZoomScale() );
		this.update();
	}


	




	/**
	 * Keyboard controls with auto rotation
	 * @param event
	 */
	handleKeyDown( event ) {

		//for video textures we want to rotate not pan
		switch ( event.keyCode ) {
			case this.keys.UP:
				this.moveUp();
				break;

			case this.keys.BOTTOM:
				this.moveDown();
				break;

			case this.keys.LEFT:
				this.moveLeft();
				break;

			case this.keys.RIGHT:
				this.moveRight();
				break;

		}
	}

	onTouchStart( event ) {

		trackPointer( event );

		switch ( _pointers.length ) {

			case 1:

				switch ( touches.ONE ) {

					case TOUCH.ROTATE:

						if ( this.enableRotate === false ) return;

						this.handleTouchStartRotate();
						this.state = STATE.TOUCH_ROTATE;

						break;

					case TOUCH.PAN:

						if ( this.enablePan === false ) return;
						this.handleTouchStartPan();
						this.state = STATE.TOUCH_PAN;

						break;

					default:

						this.state = STATE.NONE;

				}

				break;

			case 2:

				switch ( touches.TWO ) {

					case TOUCH.DOLLY_PAN:

						if ( this.enableZoom === false && this.enablePan === false ) return;

						this.handleTouchStartDollyPan();

						this.state = STATE.TOUCH_DOLLY_PAN;

						break;

					case TOUCH.DOLLY_ROTATE:

						if ( this.enableZoom === false && this.enableRotate === false ) return;

						this.handleTouchStartDollyRotate();

						this.state = STATE.TOUCH_DOLLY_ROTATE;

						break;

					default:

						this.state = STATE.NONE;

				}

				break;

			default:

				this.state = STATE.NONE;

		}

		if ( this.state !== STATE.NONE ) {
			this.dispatchStart();
		}

	}

	onTouchMove( event ) {

		trackPointer( event );

		switch ( this.state ) {

			case STATE.TOUCH_ROTATE:

				if ( this.enableRotate === false ) return;

				this.handleTouchMoveRotate( event );

				this.update();

				break;

			case STATE.TOUCH_PAN:

				if ( this.enablePan === false ) return;

				handleTouchMovePan( event );

				this.update();

				break;

			case STATE.TOUCH_DOLLY_PAN:

				if ( this.enableZoom === false && this.enablePan === false ) return;

				this.handleTouchMoveDollyPan( event );

				this.update();

				break;

			case STATE.TOUCH_DOLLY_ROTATE:

				if ( this.enableZoom === false && this.enableRotate === false ) return;

				this.handleTouchMoveDollyRotate( event );

				this.update();

				break;

			default:
				this.state = STATE.NONE;
		}

	}

	handleTouchStartDollyRotate() {

		if ( this.enableZoom ) this.handleTouchStartDolly();

		if ( this.enableRotate ) this.handleTouchStartRotate();

	}

	handleTouchStartPan() {

		if ( _pointers.length === 1 ) {

			this.panStart.set( _pointers[ 0 ].pageX, _pointers[ 0 ].pageY );

		} else {

			const x = 0.5 * ( _pointers[ 0 ].pageX + _pointers[ 1 ].pageX );
			const y = 0.5 * ( _pointers[ 0 ].pageY + _pointers[ 1 ].pageY );

			this.panStart.set( x, y );

		}
	}

	handleTouchStartDolly() {

		const dx = _pointers[ 0 ].pageX - _pointers[ 1 ].pageX;
		const dy = _pointers[ 0 ].pageY - _pointers[ 1 ].pageY;

		const distance = Math.sqrt( dx * dx + dy * dy );

		this.dollyStart.set( 0, distance );

	}

	handleTouchStartRotate( event ) {
		//console.log( 'handleTouchStartRotate' );
		if ( _pointers.length === 1 ) {

			this.rotateStart.set( _pointers[ 0 ].pageX, _pointers[ 0 ].pageY );

		} else {

			const x = 0.5 * ( _pointers[ 0 ].pageX + _pointers[ 1 ].pageX );
			const y = 0.5 * ( _pointers[ 0 ].pageY + _pointers[ 1 ].pageY );
			this.rotateStart.set( x, y );
		}

	}

	handleTouchStartDollyPan() {
		if ( this.enableZoom ) this.handleTouchStartDolly();
		if ( this.enablePan ) this.handleTouchStartPan();
	}

	
	handleTouchMoveRotate( event ) {

		if ( _pointers.length == 1 ) {

			this.rotateEnd.set( event.pageX, event.pageY );

		} else {

			const position = getSecondPointerPosition( event );

			const x = 0.5 * ( event.pageX + position.x );
			const y = 0.5 * ( event.pageY + position.y );

			this.rotateEnd.set( x, y );

		}

		this.rotateDelta.subVectors( this.rotateEnd, this.rotateStart ).multiplyScalar( this.rotateSpeed );

		const element = this.domElement;
		// rotating across whole screen goes 360 degrees around
		//rotate left or right
		if (this.rotateDirectionLeft)
			this.rotateLeft( 2 * Math.PI * this.rotateDelta.x / element.clientHeight ); // yes, height
		else
			this.rotateRight( 2 * Math.PI * this.rotateDelta.x / element.clientHeight );

		this.rotateUp( 2 * Math.PI * this.rotateDelta.y / element.clientHeight );

		this.rotateStart.copy( this.rotateEnd );

		//console.log("Touch Rotate ", this.rotateDelta);
	}
	
	handleTouchMovePan( event ) {

		if ( _pointers.length === 1 ) {

			this.panEnd.set( event.pageX, event.pageY );

		} else {

			const position = getSecondPointerPosition( event );

			const x = 0.5 * ( event.pageX + position.x );
			const y = 0.5 * ( event.pageY + position.y );

			this.panEnd.set( x, y );

		}

		this.panDelta.subVectors( this.panEnd, this.panStart ).multiplyScalar( this.panSpeed );

		this.pan( this.panDelta.x, this.panDelta.y );

		this.panStart.copy( this.panEnd );

	}

	
	handleTouchMoveDolly( event ) {

		const position = getSecondPointerPosition( event );

		const dx = event.pageX - position.x;
		const dy = event.pageY - position.y;

		const distance = Math.sqrt( dx * dx + dy * dy );

		this.dollyEnd.set( 0, distance );

		this.dollyDelta.set( 0, Math.pow( this.dollyEnd.y / this.dollyStart.y, this.zoomSpeed ) );

		this.dollyOut( this.dollyDelta.y );

		this.dollyStart.copy( this.dollyEnd );

	}

	handleTouchMoveDollyPan( event ) {
		if ( this.enableZoom ) this.handleTouchMoveDolly( event );
		if ( this.enablePan ) this.handleTouchMovePan( event );
	}

	handleTouchMoveDollyRotate( event ) {
		if ( this.enableZoom ) this.handleTouchMoveDolly( event );
		if ( this.enableRotate ) this.handleTouchMoveRotate( event );
	}

	handleMouseDownRotate( event ) {
		this.rotateStart.set( event.clientX, event.clientY );
	}
	

	handleMouseDownDolly( event ) {

		//console.log( 'handleMouseDownDolly' );

		this.dollyStart.set( event.clientX, event.clientY );

	}

	handleMouseDownPan( event ) {

		//console.log( 'handleMouseDownPan' );

		this.panStart.set( event.clientX, event.clientY );
	}

	handleMouseMoveRotate( event ) {

		//console.log( 'handleMouseMoveRotate' );

		this.rotateEnd.set( event.clientX, event.clientY );
		this.rotateDelta.subVectors( this.rotateEnd, this.rotateStart ).multiplyScalar( this.rotateSpeed );

		//const element = this.domElement === document ? this.domElement.body : this.domElement;

		//use the mouse target not the renderer element.
		const element = this.domElement === document ? this.domElement.body : event.target;

		// rotating across whole screen goes 360 degrees around
		//rotate left or right
		if (this.rotateDirectionLeft)
			this.rotateLeft( 2 * Math.PI * this.rotateDelta.x / element.clientHeight );
		else
			this.rotateRight( 2 * Math.PI * this.rotateDelta.x / element.clientHeight );
		// rotating up and down along whole screen attempts to go 360, but limited to 180
		this.rotateUp(  2 * Math.PI * this.rotateDelta.y / element.clientHeight );

		this.rotateStart.copy( this.rotateEnd );

		this.update();

	}

	handleMouseMoveDolly( event ) {

		//console.log( 'handleMouseMoveDolly' );

		this.dollyEnd.set( event.clientX, event.clientY );

		this.dollyDelta.subVectors( this.dollyEnd, this.dollyStart );

		if ( this.dollyDelta.y > 0 ) {

			this.dollyIn( this.getZoomScale() );

		} else if ( this.dollyDelta.y < 0 ) {

			this.dollyOut( this.getZoomScale() );

		}

		this.dollyStart.copy( this.dollyEnd );

		this.update();

	}

	handleMouseMovePan( event ) {

		//console.log( 'handleMouseMovePan' );

		this.panEnd.set( event.clientX, event.clientY );

		//this.panDelta.subVectors( this.panEnd, this.panStart );

		this.panDelta.subVectors( this.panEnd, this.panStart ).multiplyScalar( this.panSpeed );

		this.pan( this.panDelta.x, this.panDelta.y );

		this.panStart.copy( this.panEnd );

		this.update();

	}

	handleMouseWheel( event ) {

		//console.log( 'handleMouseWheel' );

		if ( event.deltaY < 0 ) {
			this.dollyIn(this.getZoomScale() );

		} else if ( event.deltaY > 0 ) {
			this.dollyOut(this.getZoomScale() );
		}

		this.update();
	}

	//
	// event handlers - FSM: listen for events and reset state
	//
	
	onMouseDown( event ) {

		let mouseAction;

		switch ( event.button ) {

			case 0:

				mouseAction = mouseButtons.LEFT;
				break;

			case 1:

				mouseAction = mouseButtons.MIDDLE;
				break;

			case 2:

				mouseAction = mouseButtons.RIGHT;
				break;

			default:

				mouseAction = - 1;

		}

		switch ( mouseAction ) {

			case MOUSE.DOLLY:

				if ( this.enableZoom === false ) return;

				this.handleMouseDownDolly( event );

				this.state = STATE.DOLLY;

				break;

			case MOUSE.ROTATE:

				if ( event.ctrlKey || event.metaKey || event.shiftKey ) {

					if ( this.enablePan === false ) return;

					this.handleMouseDownPan( event );

					this.state = STATE.PAN;

				} else {

					if ( this.enableRotate === false ) return;

					this.handleMouseDownRotate( event );

					this.state = STATE.ROTATE;

				}

				break;

			case MOUSE.PAN:

				if ( event.ctrlKey || event.metaKey || event.shiftKey ) {

					if ( this.enableRotate === false ) return;

					this.handleMouseDownRotate( event );

					this.state = STATE.ROTATE;

				} else {

					if ( this.enablePan === false ) return;

					this.handleMouseDownPan( event );

					this.state = STATE.PAN;

				}

				break;

			default:

				this.state = STATE.NONE;

		}

		if ( this.state !== STATE.NONE ) {

			this.dampingFactor = this.mouseDampingFactor;
			this.activeElement = event.target;

			this.dispatchStart();

			/*
			document.removeEventListener( 'mousemove', this.onMoveCheckRef);

			document.addEventListener( 'mousemove', this.onMouseMoveRef, this.nonPassiveEvent);
			document.addEventListener( 'mouseup', this.onMouseUpRef, this.passiveEvent );
			document.addEventListener( 'mouseout', this.onMouseUpRef, this.passiveEvent );*/

			//scope.dispatchEvent( _startEvent );

		}

	}

	
	onMouseMove( event ) {

		if ( this.enabled === false ) return;

		//event.preventDefault();

		switch ( this.state ) {

			case STATE.ROTATE:

				if ( this.enableRotate === false ) return;

				this.handleMouseMoveRotate( event );

				break;

			case STATE.DOLLY:

				if ( this.enableZoom === false ) return;

				this.handleMouseMoveDolly( event );

				break;

			case STATE.PAN:

				if ( this.enablePan === false ) return;

				this.handleMouseMovePan( event );

				break;

		}

	}

	onMouseUp( event ) {

		if ( this.enabled === false ) return;

		this.handleMouseUp( event );

		document.removeEventListener( 'mousemove', this.onMouseMoveRef, this.passiveEvent );
		document.removeEventListener( 'mouseup', this.onMouseUpRef, this.passiveEvent );
		document.removeEventListener( 'mouseout', this.onMouseUpRef, this.passiveEvent );

		this.dispatchEnd();

		this.state = STATE.NONE;

		//cancel the active element
		this.activeElement = null;

	}

	
	onMouseWheel( event ) {

		if ( this.enabled === false || this.enableZoom === false || ( this.state !== STATE.NONE && this.state !== STATE.ROTATE ) ) return;

		event.preventDefault();
		event.stopPropagation();

		this.dispatchStart();

		this.handleMouseWheel( event );

		this.dispatchEnd();

	}

	onKeyDown( event ) {

		if ( this.enabled === false || this.enableKeys === false || this.enablePan === false) return;

		//set the damping factor for key controls which needs more sensitivity.
		this.dampingFactor = this.keyDampingFactor;

		this.handleKeyDown( event );

	}

	onPointerDown( event ) {

		//console.log("on pointer down ", this.enabled);
		if ( this.enabled === false ) return;

		//disable events when triggered by overlayed elements.
		if (this.domElement !== event.target && this.domElement !== event.target.parentNode) return;

		const onPointerUpCheck = () => {
			document.removeEventListener( 'pointermove', onPointerMoveCheck);
			document.removeEventListener( 'pointerup', onPointerUpCheck);
		}

		
		const onPointerMoveCheck = () => {
			onPointerUpCheck();
			
			if ( _pointers.length === 0 ) {
				this.domElement.setPointerCapture( event.pointerId );
	
				this.onPointerMoveRef = (e) => this.onPointerMove(e);
				this.onPointerUpRef = (e) => this.onPointerUp(e);
	
				this.domElement.addEventListener( 'pointermove', this.onPointerMoveRef );
				this.domElement.addEventListener( 'pointerup', this.onPointerUpRef );
			}
	
			addPointer( event );

			//console.log("on pointer check ", event.pointerType);
			if ( event.pointerType === 'touch' ) {
				this.onTouchStart( event );
			} else {
				this.onMouseDown( event );
			}
		};

		//check for mouse movement before starting controls
		document.addEventListener( 'pointermove', onPointerMoveCheck);


		//no movement and a mouse toggle remove the setup event
		document.addEventListener( 'pointerup', onPointerUpCheck);
	}

	onPointerMove( event ) {
		
		if ( this.enabled === false ) return;

		if ( event.pointerType === 'touch' ) {
			this.onTouchMove( event );
		} else {
			this.onMouseMove( event );
		}
	}

	onPointerUp( event ) {

		removePointer( event );

		if ( _pointers.length === 0 ) {
			this.domElement.releasePointerCapture( event.pointerId );

			this.domElement.removeEventListener( 'pointermove', this.onPointerMoveRef );
			this.domElement.removeEventListener( 'pointerup', this.onPointerUpRef );
		}

		this.dispatchEnd();

		this.state = STATE.NONE;
	}

	onPointerCancel( event ) {
		removePointer( event );
	}

	//onContextMenu(event) {
		//event.preventDefault();
	//}

	connect() {

		this.enabled = true;

		//reset the controls for when switching out of VRControls
		this.reset();

		//this.domElement.addEventListener( 'contextmenu', this.onContextMenu, this.nonPassiveEvent );

		this.onMouseWheelRef = (event) => this.onMouseWheel(event),
		this.onPointerDownRef = (event) => this.onPointerDown(event),
		this.onPointerCancelRef = (event) => this.onPointerCancel(event),
		this.onKeyDownRef = (event) => this.onKeyDown(event);

		window.addEventListener( 'keydown', this.onKeyDownRef);

		//this.domElement.addEventListener( 'contextmenu', onContextMenu );

		this.domElement.addEventListener( 'pointerdown', this.onPointerDownRef );
		this.domElement.addEventListener( 'pointercancel', this.onPointerCancelRef );
		this.domElement.addEventListener( 'wheel', this.onMouseWheelRef, { passive: false } );

	}

	disconnect() {

		this.enabled = false;

		_pointers = [];

		//reset the controls for when switching to VRControls
		//this.reset();

		this.domElement.removeEventListener( 'pointerdown', this.onPointerDownRef );
		this.domElement.removeEventListener( 'pointercancel', this.onPointerCancelRef );
		this.domElement.removeEventListener( 'wheel', this.onMouseWheelRef );

		this.domElement.removeEventListener( 'pointermove', this.onPointerMoveRef );
		this.domElement.removeEventListener( 'pointerup', this.onPointerUpRef );

		window.removeEventListener( 'keydown', this.onKeyDownRef);

		//this.dispatchEvent( { type: 'dispose' } ); // should this be added here?

	}

	saveState () {

		this.target0.copy( this.target );
		this.position0.copy( this.object.position );
		this.zoom0 = this.object.zoom;

	}
	
	reset () {

		this.target.copy( this.target0 );
		this.object.position.copy( this.position0 );
		this.object.zoom = this.zoom0;

		this.object.updateProjectionMatrix();
		this.dispatchChange();

		this.update();

		this.state = STATE.NONE;

	}


	update() {

		const offset = new Vector3(),

		// so camera.up is the orbit axis
			quat = new Quaternion().setFromUnitVectors( this.object.up, new Vector3( 0, 1, 0 ) ),
			quatInverse = quat.clone().invert(),
			lastPosition = new Vector3(),
			lastQuaternion = new Quaternion(),
			position = this.object.position,
			twoPI = 2 * Math.PI;


		offset.copy( position ).sub( this.target );

		// rotate offset to "y-axis-is-up" space
		offset.applyQuaternion( quat );

		// angle from z-axis around y-axis
		this.spherical.setFromVector3( offset );

		// restrict theta to be between desired limits


		//this.spherical.theta += this.sphericalDelta.theta;
		//this.spherical.phi += this.sphericalDelta.phi;

		//automatic damping
		this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor;
		this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor;

		// restrict theta to be between desired limits
		//this.spherical.theta = Math.max( this.minAzimuthAngle, Math.min( this.maxAzimuthAngle, this.spherical.theta ) );

		// restrict phi to be between desired limits
		this.spherical.phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, this.spherical.phi ) );

		this.spherical.makeSafe();


		this.spherical.radius *= this.scale;

		// restrict radius to be between desired limits
		this.spherical.radius = Math.max( this.minDistance, Math.min( this.maxDistance, this.spherical.radius ) );

		//automatic damping
		this.target.addScaledVector( this.panOffset, this.dampingFactor );

		// move target to panned location
		//this.target.add( this.panOffset );

		offset.setFromSpherical( this.spherical );

		// rotate offset back to "camera-up-vector-is-up" space
		offset.applyQuaternion( quatInverse );

		
		position.copy( this.target ).add( offset );

		this.object.lookAt( this.target );

		//automatic damping
		this.sphericalDelta.theta *= ( 1 - this.dampingFactor );
		this.sphericalDelta.phi *= ( 1 - this.dampingFactor );
		this.panOffset.multiplyScalar( 1 - this.dampingFactor );

		this.scale = 1;
		//this.panOffset.set( 0, 0, 0 );

		// update condition is:
		// min(camera displacement, camera rotation in radians)^2 > EPS
		// using small-angle approximation cos(x/2) = 1 - x^2 / 8

		if ( this.zoomChanged ||
			lastPosition.distanceToSquared( this.object.position ) > EPS ||
			8 * ( 1 - lastQuaternion.dot( this.object.quaternion ) ) > EPS ) {

			this.dispatchChange();

			lastPosition.copy( this.object.position );
			lastQuaternion.copy( this.object.quaternion );
			this.zoomChanged = false;

			return true;

		}

		return false;

	}

	dispatchStart() {
		this.dispatchEvent({ type: "start" });
	}

	dispatchChange() {
		this.dispatchEvent({ type: "change" });
	}

	dispatchEnd() {
		this.dispatchEvent({ type: "end" });
	}

}

export { OrbitControls };