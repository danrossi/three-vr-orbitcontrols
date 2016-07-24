/**
 * OrbitControls for mouse and keyboard controls.
 * Changes to turn it into a three.js module for bundling.
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
import { EventDispatcher } from '../three.js/src/core/EventDispatcher';

var EPS = 0.000001;
var STATE = { NONE : - 1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };

function OrbitControls( object, domElement) {

	//the custom controls element, like a giro map tool.
	//this.controlsElement = controlsElement || this.domElement;

	this.object = object,
		domElement = ( domElement !== undefined ) ? domElement : document,
		// Set to false to disable this control
		enabled = true;
	// "target" sets the location of focus, where the object orbits around
	this.target = new THREE.Vector3(),
		// How far you can dolly in and out ( PerspectiveCamera only )
		this.minDistance = 0,
		this.maxDistance = Infinity,
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
		this.enableDamping = false,
		this.dampingFactor = 0.25,
		//the damping factor for key controls. This needs a more smoother response.
		this.keyDampingFactor = 0.10,
		// This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
		// Set to false to disable zooming
		this.enableZoom = true,
		this.zoomSpeed = 1.0,
		// Set to false to disable rotating
		this.enableRotate = true,
		this.rotateSpeed = 1.0,

		// Set to false to disable panning
		this.enablePan = true,
		this.keyPanSpeed = 7.0,	// pixels moved per arrow key push

		// Set to true to automatically rotate around the target
		// If auto-rotate is enabled, you must call controls.update() in your animation loop
		//this.autoRotate = false,
		//this.autoRotateSpeed = 2.0, // 30 seconds per round when fps is 60

		// Set to false to disable use of the keys
		this.enableKeys = true,

		// The four arrow keys
		this.keys = { left: 37, up: 38, right: 39, bottom: 40 },

		// Mouse buttons
		this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT },

		// for reset
		this.target0 = this.target.clone(),
		this.position0 = this.object.position.clone(),
		this.zoom0 = this.object.zoom,
		this.state = STATE.NONE,
	// current position in spherical coordinates
		this.spherical = new THREE.Spherical(),
		this.sphericalDelta = new THREE.Spherical(),

		this.scale = 1,
		this.panOffset = new THREE.Vector3(),
		this.zoomChanged = false,

		this.rotateStart = new THREE.Vector2(),
		this.rotateEnd = new THREE.Vector2(),
		this.rotateDelta = new THREE.Vector2(),

		this.panStart = new THREE.Vector2(),
		this.panEnd = new THREE.Vector2(),
		this.panDelta = new THREE.Vector2(),

		this.dollyStart = new THREE.Vector2(),
		this.dollyEnd = new THREE.Vector2(),
		this.dollyDelta = new THREE.Vector2();


	this.connect();

	// force an update at start
	this.update();
};


OrbitControls.prototype.getPolarAngle = function () {
	return this.spherical.phi;
};

OrbitControls.prototype.getAzimuthalAngle = function () {
	return this.spherical.theta;
};


OrbitControls.prototype.getAutoRotationAngle = function() {
	return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
};

OrbitControls.prototype.getZoomScale = function() {
	return Math.pow( 0.95, this.zoomSpeed );
};

OrbitControls.prototype.rotateLeft( angle ) {
	this.sphericalDelta.theta -= angle;
};

OrbitControls.prototype.rotateUp( angle ) {
	this.sphericalDelta.phi -= angle;
};

OrbitControls.prototype.panLeft = function(distance, objectMatrix) {

	var v = new THREE.Vector3();

	v.setFromMatrixColumn( objectMatrix, 0 ); // get X column of objectMatrix
	v.multiplyScalar( - distance );

	this.panOffset.add( v );
};

OrbitControls.prototype.panUp = function(distance, objectMatrix) {

	var v = new THREE.Vector3();

	v.setFromMatrixColumn( objectMatrix, 1 ); // get Y column of objectMatrix
	v.multiplyScalar( distance );

	this.panOffset.add( v );
};

// deltaX and deltaY are in pixels; right and down are positive
OrbitControls.prototype.pan = function(deltaX, deltaY) {

	var offset = new THREE.Vector3();

	var element = this.domElement === document ? this.domElement.body : this.domElement;

	if ( this.object instanceof THREE.PerspectiveCamera ) {

		// perspective
		var position = this.object.position;
		offset.copy( position ).sub( this.target );
		var targetDistance = offset.length();

		// half of the fov is center to top of screen
		targetDistance *= Math.tan( ( this.object.fov / 2 ) * Math.PI / 180.0 );

		// we actually don't use screenWidth, since perspective camera is fixed to screen height
		this.panLeft( 2 * deltaX * targetDistance / element.clientHeight, this.object.matrix );
		this.panUp( 2 * deltaY * targetDistance / element.clientHeight, this.object.matrix );

	} else if ( this.object instanceof THREE.OrthographicCamera ) {

		// orthographic
		this.panLeft( deltaX * ( this.object.right - this.object.left ) / this.object.zoom / element.clientWidth, this.object.matrix );
		this.panUp( deltaY * ( this.object.top - this.object.bottom ) / this.object.zoom / element.clientHeight, this.object.matrix );

	} else {

		// camera neither orthographic nor perspective
		//console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );
		this.enablePan = false;

	}


};



OrbitControls.prototype.dollyIn = function( dollyScale ) {

	if ( this.object instanceof THREE.PerspectiveCamera ) {

		this.scale /= dollyScale;

	} else if ( this.object instanceof THREE.OrthographicCamera ) {

		this.object.zoom = Math.max( this.minZoom, Math.min( this.maxZoom, this.object.zoom * dollyScale ) );
		this.object.updateProjectionMatrix();
		this.zoomChanged = true;

	} else {

		//console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
		this.enableZoom = false;

	}

};

OrbitControls.prototyp.dollyOut = function( dollyScale ) {

	if ( this.object instanceof THREE.PerspectiveCamera ) {

		this.scale *= dollyScale;

	} else if ( this.object instanceof THREE.OrthographicCamera ) {

		this.object.zoom = Math.max( this.minZoom, Math.min( this.maxZoom, this.object.zoom / dollyScale ) );
		this.object.updateProjectionMatrix();
		this.zoomChanged = true;

	} else {

		//console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
		this.enableZoom = false;

	}

}


/**
 * Vertical auto rotation
 * @param speed
 */
OrbitControls.prototype.rotateVertical = function(speed) {
	this.rotateUp(THREE.Math.degToRad(speed));
	this.update();
}

/**
 * Horizontal audo rotation
 * @param speed
 */
OrbitControls.prototype.rotateHorizontal = function(speed) {
	this.rotateLeft(THREE.Math.degToRad(speed));
	this.update();
}

OrbitControls.prototype.setKeyDampingFactor = function() {
	this.dampingFactor = this.keyDampingFactor;
}


/**
 * Rotate left api
 */
OrbitControls.prototype.moveLeft = function() {
	this.setKeyDampingFactor();
	this.rotateHorizontal(this.rotateSpeed);
};

/**
 * Rotate right api
 */
OrbitControls.prototype.moveRight = function() {
	this.setKeyDampingFactor();
	rotateHorizontal(-this.rotateSpeed);
};

/**
 * Rotate down api
 */
OrbitControls.prototype.moveDown = function() {
	this.setKeyDampingFactor();
	this.rotateVertical(-this.rotateSpeed);
};

/**
 * Rotate up api
 */
OrbitControls.prototype.moveUp = function() {
	setKeyDampingFactor();
	rotateVertical(this.rotateSpeed);
};




/**
 * Keyboard controls with auto rotation
 * @param event
 */
OrbitControls.prototype.handleKeyDown = function( event ) {

	//for video textures we want to rotate not pan

	switch ( event.keyCode ) {

		case this.keys.up:
			this.moveUp();
			break;

		case this.keys.bottom:
			this.moveDown();
			break;

		case this.keys.left:
			this.moveLeft();
			break;

		case this.keys.right:
			this.moveRight();
			break;

	}
};


OrbitControls.prototype.handleTouchStartRotate = function( event ) {

	//console.log( 'handleTouchStartRotate' );

	this.rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

};

OrbitControls.prototype.handleTouchStartDolly = function( event ) {

	//console.log( 'handleTouchStartDolly' );

	var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX,
		dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY,
		distance = Math.sqrt( dx * dx + dy * dy );

	this.dollyStart.set( 0, distance );

};

OrbitControls.prototype.handleTouchStartPan = function( event ) {

	//console.log( 'handleTouchStartPan' );

	this.panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

};

OrbitControls.prototype.handleTouchMoveRotate = function( event ) {

	//console.log( 'handleTouchMoveRotate' );

	this.rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
	this.rotateDelta.subVectors( this.rotateEnd, this.rotateStart );

	var element = this.domElement === document ? this.domElement.body : this.domElement;

	// rotating across whole screen goes 360 degrees around
	this.rotateLeft( 2 * Math.PI * this.rotateDelta.x / element.clientWidth * this.rotateSpeed );

	// rotating up and down along whole screen attempts to go 360, but limited to 180
	this.rotateUp( 2 * Math.PI * this.rotateDelta.y / element.clientHeight * this.rotateSpeed );

	this.rotateStart.copy( this.rotateEnd );

	this.update();

};

OrbitControls.prototype.handleTouchMoveDolly = function( event ) {

	//console.log( 'handleTouchMoveDolly' );

	var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
	var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

	var distance = Math.sqrt( dx * dx + dy * dy );

	this.dollyEnd.set( 0, distance );

	this.dollyDelta.subVectors( this.dollyEnd, this.dollyStart );

	if ( this.dollyDelta.y > 0 ) {

		this.dollyOut( getZoomScale() );

	} else if ( this.dollyDelta.y < 0 ) {

		this.dollyIn( getZoomScale() );

	}

	this.dollyStart.copy( this.dollyEnd );

	this.update();

};

OrbitControls.prototype.handleTouchMovePan = function( event ) {

	//console.log( 'handleTouchMovePan' );

	this.panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

	this.panDelta.subVectors( this.panEnd, this.panStart );

	this.pan( this.panDelta.x, this.panDelta.y );

	this.panStart.copy( this.panEnd );

	this.update();
};

OrbitControls.prototype.handleTouchEnd = function( event ) {

	//console.log( 'handleTouchEnd' );

};


OrbitControls.prototype.onTouchStart = function( event ) {

	if ( this.enabled === false ) return;

	switch ( event.touches.length ) {

		case 1:	// one-fingered touch: rotate

			if ( this.enableRotate === false ) return;

			this.handleTouchStartRotate( event );

			this.state = STATE.TOUCH_ROTATE;

			break;

		case 2:	// two-fingered touch: dolly

			if ( this.enableZoom === false ) return;

			this.handleTouchStartDolly( event );

			this.state = STATE.TOUCH_DOLLY;

			break;

		case 3: // three-fingered touch: pan

			if ( this.enablePan === false ) return;

			this.handleTouchStartPan( event );

			this.state = STATE.TOUCH_PAN;

			break;

		default:

			this.state = STATE.NONE;

	}

	if ( this.state !== STATE.NONE ) {

		this.domElement.addEventListener( 'touchmove', function onTouchMoveCheck() {
			this.domElement.removeEventListener('touchmove', onTouchMoveCheck);
			this.dispatchStart();
		}.bind(this));

	}

};


OrbitControls.prototype.onTouchMove = function( event ) {

	if ( this.enabled === false ) return;

	event.preventDefault();
	event.stopPropagation();

	switch ( event.touches.length ) {

		case 1: // one-fingered touch: rotate

			if ( this.enableRotate === false ) return;
			if ( this.state !== STATE.TOUCH_ROTATE ) return; // is this needed?...

			this.handleTouchMoveRotate( event );

			break;

		case 2: // two-fingered touch: dolly

			if ( this.enableZoom === false ) return;
			if ( this.state !== STATE.TOUCH_DOLLY ) return; // is this needed?...

			this.handleTouchMoveDolly( event );

			break;

		case 3: // three-fingered touch: pan

			if ( this.enablePan === false ) return;
			if ( this.state !== STATE.TOUCH_PAN ) return; // is this needed?...

			this.handleTouchMovePan( event );

			break;

		default:

			this.state = STATE.NONE;

	}

};

OrbitControls.prototype.onTouchEnd = function( event ) {

	if ( this.enabled === false ) return;

	this.handleTouchEnd( event );

	this.dispatchEnd();

	this.state = STATE.NONE;

};


OrbitControls.prototype.handleMouseDownRotate = function( event ) {

	//console.log( 'handleMouseDownRotate' );

	this.rotateStart.set( event.clientX, event.clientY );

}

OrbitControls.prototype.handleMouseDownDolly = function( event ) {

	//console.log( 'handleMouseDownDolly' );

	this.dollyStart.set( event.clientX, event.clientY );

}

OrbitControls.prototype.handleMouseDownPan = function( event ) {

	//console.log( 'handleMouseDownPan' );

	this.panStart.set( event.clientX, event.clientY );
};

OrbitControls.prototype.handleMouseMoveRotate = function( event ) {

	//console.log( 'handleMouseMoveRotate' );

	this.rotateEnd.set( event.clientX, event.clientY );
	this.rotateDelta.subVectors( this.rotateEnd, this.rotateStart );

	//var element = this.domElement === document ? this.domElement.body : this.domElement;

	//use the mouse target not the renderer element.
	var element = this.domElement === document ? this.domElement.body : event.target;

	// rotating across whole screen goes 360 degrees around
	this.rotateLeft( 2 * Math.PI * this.rotateDelta.x / element.clientWidth * this.rotateSpeed );

	// rotating up and down along whole screen attempts to go 360, but limited to 180
	this.rotateUp( 2 * Math.PI * this.rotateDelta.y / element.clientHeight * this.rotateSpeed );

	this.rotateStart.copy( this.rotateEnd );

	this.update();

};

OrbitControls.prototype.handleMouseMoveDolly = function( event ) {

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

};

OrbitControls.prototype.handleMouseMovePan = function( event ) {

	//console.log( 'handleMouseMovePan' );

	this.panEnd.set( event.clientX, event.clientY );

	this.panDelta.subVectors( this.panEnd, this.panStart );

	this.pan( this.panDelta.x, this.panDelta.y );

	this.panStart.copy( this.panEnd );

	this.update();

};


OrbitControls.prototype.handleMouseUp = function( event ) {

	//console.log( 'handleMouseUp' );

};

OrbitControls.prototype.handleMouseWheel = function( event ) {

	//console.log( 'handleMouseWheel' );

	var delta = 0;

	if ( event.wheelDelta !== undefined ) {

		// WebKit / Opera / Explorer 9

		delta = event.wheelDelta;

	} else if ( event.detail !== undefined ) {

		// Firefox

		delta = - event.detail;

	}

	if ( delta > 0 ) {

		this.dollyOut(this.getZoomScale() );

	} else if ( delta < 0 ) {

		this.dollyIn(this.getZoomScale() );

	}

	this.update();

};

//
// event handlers - FSM: listen for events and reset state
//
/*
 OrbitControls.prototype.onElemMouseDown = function(event) {

 if (event.target !== this.domElement) return;
 this.onMouseDown(event);
 }*/

OrbitControls.prototype.onMouseDown = function( event ) {

	if ( this.enabled === false ) return;

	event.preventDefault();

	//reset the damping factor for mouse controls
	this.dampingFactor = this.mouseDampingFactor;

	this.activeElement = event.target;


	switch (event.button) {
		case this.mouseButtons.ORBIT:
			if ( this.enableRotate === false ) return;

			this.handleMouseDownRotate( event );

			this.state = STATE.ROTATE;
			break;
		case this.mouseButtons.ZOOM:
			if ( this.enableZoom === false ) return;

			this.handleMouseDownDolly( event );

			this.state = STATE.DOLLY;
			break;
		case this.mouseButtons.PAN:
			if ( this.enablePan === false ) return;

			this.handleMouseDownPan( event );

			this.state = STATE.PAN;
			break;
	}

	if ( this.state !== STATE.NONE ) {

		document.addEventListener( 'mousemove', function onMoveCheck() {
			this.dispatchStart();
			document.removeEventListener( 'mousemove', onMoveCheck);
		}.bind(this), false );

		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'mouseup', onMouseUp, false );
		document.addEventListener( 'mouseout', onMouseUp, false );


	}

};


OrbitControls.prototype.onMouseMove = function( event ) {

	if (this.enabled === false) return;

	event.preventDefault();

	if (this.state === STATE.ROTATE) {

		if (this.enableRotate === false) return;

		this.handleMouseMoveRotate(event);

	} else if (state === STATE.DOLLY) {

		if (this.enableZoom === false) return;

		this.handleMouseMoveDolly(event);

	} else if (state === STATE.PAN) {

		if (this.enablePan === false) return;

		this.handleMouseMovePan(event);

	}

};

OrbitControls.prototype.onMouseUp = function( event ) {

	if ( this.enabled === false ) return;

	this.handleMouseUp( event );

	document.removeEventListener( 'mousemove', this.onMouseMove, false );
	document.removeEventListener( 'mouseup', this.onMouseUp, false );
	document.removeEventListener( 'mouseout', this.onMouseUp, false );

	this.dispatchEnd();

	this.state = STATE.NONE;

	//cancel the active element
	this.activeElement = null;

};


OrbitControls.prototype.onMouseWheel = function( event ) {

	if ( this.enabled === false || this.enableZoom === false || ( state !== STATE.NONE && state !== STATE.ROTATE ) ) return;

	event.preventDefault();
	event.stopPropagation();

	this.handleMouseWheel( event );

	this.dispatchStart();
	this.dispatchEnd();

};


OrbitControls.prototype.onKeyDown = function( event ) {

	if ( this.enabled === false || this.enableKeys === false || this.enablePan === false ) return;

	//set the damping factor for key controls which needs more sensitivity.
	this.dampingFactor = this.keyDampingFactor;

	this.handleKeyDown( event );

};



OrbitControls.prototype.onContextMenu = function(event) {
	event.preventDefault();
};

OrbitControls.prototype.connect = function() {

	//the custom controls element events
	/*if (this.controlsElement) {
	 this.controlsElement.addEventListener( 'mousedown', onMouseDown, false );
	 this.controlsElement.addEventListener( 'touchstart', onTouchStart, false );
	 }*/

	this.domElement.addEventListener( 'contextmenu', this.onContextMenu, false );

	this.domElement.addEventListener( 'mousedown', this.onMouseDown.bind(this), false );
	this.domElement.addEventListener( 'mousewheel', this.onMouseWheel.bind(this), false );
	this.domElement.addEventListener( 'MozMousePixelScroll', this.onMouseWheel.bind(this), false ); // firefox

	this.domElement.addEventListener( 'touchstart', this.onTouchStart.bind(this), false );
	this.domElement.addEventListener( 'touchend', this.onTouchEnd.bind(this), false );
	this.domElement.addEventListener( 'touchmove', this.onTouchMove.bind(this), false );

	window.addEventListener( 'keydown', this.onKeyDown.bind(this), false );

};

OrbitControls.prototype.disconnect = function() {

	//the custom controls events
	/*if (this.controlsElement) {
		this.controlsElement.removeEventListener( 'mousedown', onMouseDown, false );
		this.controlsElement.removeEventListener( 'touchstart', onTouchStart, false );
	}*/

	this.domElement.removeEventListener( 'contextmenu', this.onContextMenu, false );
	this.domElement.removeEventListener( 'mousedown', this.onMouseDown, false );
	this.domElement.removeEventListener( 'mousewheel', this.onMouseWheel, false );
	this.domElement.removeEventListener( 'MozMousePixelScroll', this.onMouseWheel, false ); // firefox

	this.domElement.removeEventListener( 'touchstart', this.onTouchStart, false );
	this.domElement.removeEventListener( 'touchend', this.onTouchEnd, false );
	this.domElement.removeEventListener( 'touchmove', this.onTouchMove, false );

	document.removeEventListener( 'mousemove', this.onMouseMove, false );
	document.removeEventListener( 'mouseup', this.onMouseUp, false );

	window.removeEventListener( 'keydown', this.onKeyDown, false );

	//this.dispatchEvent( { type: 'dispose' } ); // should this be added here?

};


OrbitControls.prototype.reset = function () {

	this.target.copy( this.target0 );
	this.object.position.copy( this.position0 );
	this.object.zoom = this.zoom0;

	this.object.updateProjectionMatrix();
	this.dispatchChange();

	this.update();

	this.state = STATE.NONE;

};

// this method is exposed, but perhaps it would be better if we can make it private...
OrbitControls.prototype.update = function() {

	var offset = new THREE.Vector3(),

	// so camera.up is the orbit axis
		quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) ),
		quatInverse = quat.clone().inverse(),
		lastPosition = new THREE.Vector3(),
		lastQuaternion = new THREE.Quaternion(),
		position = this.object.position;

	offset.copy( position ).sub( this.target );

	// rotate offset to "y-axis-is-up" space
	offset.applyQuaternion( quat );

	// angle from z-axis around y-axis
	this.spherical.setFromVector3( offset );

	/*if ( this.autoRotate && this.state === STATE.NONE ) {

	 rotateLeft( getAutoRotationAngle() );

	 }*/

	this.spherical.theta += this.sphericalDelta.theta;
	this.spherical.phi += this.sphericalDelta.phi;

	// restrict theta to be between desired limits
	this.spherical.theta = Math.max( this.minAzimuthAngle, Math.min( this.maxAzimuthAngle, this.spherical.theta ) );

	// restrict phi to be between desired limits
	this.spherical.phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, this.spherical.phi ) );

	this.spherical.makeSafe();


	this.spherical.radius *= this.scale;

	// restrict radius to be between desired limits
	this.spherical.radius = Math.max( this.minDistance, Math.min( this.maxDistance, this.spherical.radius ) );

	// move target to panned location
	this.target.add( this.panOffset );

	offset.setFromSpherical( spherical );

	// rotate offset back to "camera-up-vector-is-up" space
	offset.applyQuaternion( quatInverse );

	position.copy( this.target ).add( offset );

	this.object.lookAt( this.target );

	if ( this.enableDamping === true ) {

		this.sphericalDelta.theta *= ( 1 - this.dampingFactor );
		this.sphericalDelta.phi *= ( 1 - this.dampingFactor );

	} else {

		this.sphericalDelta.set( 0, 0, 0 );

	}

	this.scale = 1;
	this.panOffset.set( 0, 0, 0 );

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

};

OrbitControls.prototype.dispatchStart = function() {
	this.dispatchEvent({ type: "start" });
};

OrbitControls.prototype.dispatchChange = function() {
	this.dispatchEvent({ type: "change" });
};

OrbitControls.prototype.dispatchEnd = function() {
	this.dispatchEvent({ type: "end" });
};


OrbitControls.prototype = Object.create( EventDispatcher.prototype );
OrbitControls.prototype.constructor = OrbitControls;

export { OrbitControls };