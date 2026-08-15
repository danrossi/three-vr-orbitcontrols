import { EventDispatcher, MOUSE, MathUtils, Quaternion, Spherical, TOUCH, Vector2, Vector3 } from "three";
//#region src/OrbitControls.js
var EPS = 1e-6;
var STATE = {
	NONE: -1,
	ROTATE: 0,
	DOLLY: 1,
	PAN: 2,
	TOUCH_ROTATE: 3,
	TOUCH_PAN: 4,
	TOUCH_DOLLY_PAN: 5,
	TOUCH_DOLLY_ROTATE: 6
};
var _pointerPositions = {};
var mouseButtons = {
	LEFT: MOUSE.ROTATE,
	MIDDLE: MOUSE.DOLLY,
	RIGHT: MOUSE.PAN
};
var touches = {
	ONE: TOUCH.ROTATE,
	TWO: TOUCH.DOLLY_PAN
};
var _pointers = [];
function addPointer(event) {
	_pointers.push(event);
}
function removePointer(event) {
	delete _pointerPositions[event.pointerId];
	for (let i = 0; i < _pointers.length; i++) if (_pointers[i].pointerId == event.pointerId) {
		_pointers.splice(i, 1);
		return;
	}
}
function trackPointer(event) {
	let position = _pointerPositions[event.pointerId];
	if (position === void 0) {
		position = new Vector2();
		_pointerPositions[event.pointerId] = position;
	}
	position.set(event.pageX, event.pageY);
}
function getSecondPointerPosition(event) {
	if (!_pointers.length) return;
	return _pointerPositions[(event.pointerId === _pointers[0].pointerId ? _pointers[1] : _pointers[0]).pointerId];
}
var OrbitControls = class extends EventDispatcher {
	constructor(object, domElement) {
		super();
		domElement.style.touchAction = "none";
		this.object = object;
		this.domElement = domElement !== void 0 ? domElement : document;
		this.enabled = true;
		this.target = new Vector3();
		this.minDistance = 0;
		this.maxDistance = Infinity;
		this.zoomin = false;
		this.minZoom = 0;
		this.maxZoom = Infinity;
		this.minPolarAngle = 0;
		this.maxPolarAngle = Math.PI;
		this.minAzimuthAngle = -Infinity;
		this.maxAzimuthAngle = Infinity;
		this.dampingFactor = .05;
		this.mouseDampingFactor = .05;
		this.keyDampingFactor = .05;
		this.enableZoom = true, this.zoomSpeed = 1, this.enableRotate = true, this.rotateSpeed = 1, this.rotateSpeedFactor = 3, this.enablePan = true, this.panSpeed = 1, this.screenSpacePanning = false, this.keyPanSpeed = 7, this.enableKeys = true;
		this.keys = {
			LEFT: "ArrowLeft",
			UP: "ArrowUp",
			RIGHT: "ArrowRight",
			BOTTOM: "ArrowDown"
		};
		this.rotateDirectionLeft = true;
		this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this.state = STATE.NONE, this.spherical = new Spherical(), this.sphericalDelta = new Spherical(), this.scale = 1, this.panOffset = new Vector3(), this.zoomChanged = false, this.rotateStart = new Vector2(), this.rotateEnd = new Vector2(), this.rotateDelta = new Vector2(), this.panStart = new Vector2(), this.panEnd = new Vector2(), this.panDelta = new Vector2(), this.dollyStart = new Vector2(), this.dollyEnd = new Vector2(), this.dollyDelta = new Vector2();
		this.passiveEvent = false;
		this.nonPassiveEvent = false;
		this.connect();
		this.update();
	}
	getPolarAngle() {
		return this.spherical.phi;
	}
	getAzimuthalAngle() {
		return this.spherical.theta;
	}
	getZoomScale() {
		return Math.pow(.95, this.zoomSpeed);
	}
	rotateLeft(angle) {
		this.sphericalDelta.theta -= angle;
	}
	rotateRight(angle) {
		this.sphericalDelta.theta += angle;
	}
	rotateUp(angle) {
		this.sphericalDelta.phi -= angle;
	}
	panLeft(distance, objectMatrix) {
		const v = new Vector3();
		v.setFromMatrixColumn(objectMatrix, 0);
		v.multiplyScalar(-distance);
		this.panOffset.add(v);
	}
	panUp(distance, objectMatrix) {
		const v = new Vector3();
		if (this.screenSpacePanning === true) v.setFromMatrixColumn(objectMatrix, 1);
		else {
			v.setFromMatrixColumn(objectMatrix, 0);
			v.crossVectors(this.object.up, v);
		}
		v.multiplyScalar(distance);
		this.panOffset.add(v);
	}
	pan(deltaX, deltaY) {
		const offset = new Vector3();
		const element = this.domElement === document ? this.domElement.body : this.domElement;
		const position = this.object.position;
		offset.copy(position).sub(this.target);
		let targetDistance = offset.length();
		targetDistance *= Math.tan(this.object.fov / 2 * Math.PI / 180);
		this.panLeft(2 * deltaX * targetDistance / element.clientHeight, this.object.matrix);
		this.panUp(2 * deltaY * targetDistance / element.clientHeight, this.object.matrix);
	}
	dollyIn(dollyScale) {
		this.scale /= dollyScale;
		if (this.zoomin) {
			this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / dollyScale));
			this.object.updateProjectionMatrix();
			this.zoomChanged = true;
		}
	}
	dollyOut(dollyScale) {
		this.scale *= dollyScale;
		if (this.zoomin) {
			this.object.zoom = Math.max(.3, Math.min(this.maxZoom, this.object.zoom * dollyScale));
			this.object.updateProjectionMatrix();
			this.zoomChanged = true;
		}
	}
	rotateVertical(speed) {
		this.rotateUp(MathUtils.degToRad(speed));
		this.update();
	}
	rotateHorizontal(speed) {
		this.rotateLeft(MathUtils.degToRad(speed));
		this.update();
	}
	setKeyDampingFactor() {
		this.dampingFactor = this.keyDampingFactor;
	}
	moveLeft(deg = null) {
		const angle = deg || this.rotateSpeed * this.rotateSpeedFactor;
		this.setKeyDampingFactor();
		this.rotateHorizontal(angle);
	}
	moveRight(deg = null) {
		const angle = deg || this.rotateSpeed * this.rotateSpeedFactor;
		this.setKeyDampingFactor();
		this.rotateHorizontal(-angle);
	}
	moveDown(deg = null) {
		const angle = deg || this.rotateSpeed * this.rotateSpeedFactor;
		this.setKeyDampingFactor();
		this.rotateVertical(angle);
	}
	moveUp(deg = null) {
		const angle = deg || this.rotateSpeed * this.rotateSpeedFactor;
		this.setKeyDampingFactor();
		this.rotateVertical(-angle);
	}
	resetYAxis() {
		this.sphericalDelta.phi = .2;
		this.target.y = this.target0.y;
		this.object.position.y = this.position0.y;
		this.update();
	}
	resetXAxis() {
		this.sphericalDelta.theta = this.sphericalDelta.theta < 0 ? .5 : -.5;
		this.target.x = this.target0.x;
		this.object.position.x = this.position0.x;
		this.update();
	}
	zoomIn() {
		this.dollyIn(this.getZoomScale());
		this.update();
	}
	zoomOut() {
		this.dollyOut(this.getZoomScale());
		this.update();
	}
	handleKeyDown(event) {
		switch (event.code) {
			case this.keys.UP:
				this.moveUp();
				break;
			case this.keys.BOTTOM:
				this.moveDown();
				break;
			case this.keys.LEFT:
				this.moveLeft();
				break;
			case this.keys.RIGHT: this.moveRight();
		}
	}
	onTouchStart(event) {
		trackPointer(event);
		switch (_pointers.length) {
			case 1:
				switch (touches.ONE) {
					case TOUCH.ROTATE:
						if (this.enableRotate === false) return;
						this.handleTouchStartRotate();
						this.state = STATE.TOUCH_ROTATE;
						break;
					case TOUCH.PAN:
						if (this.enablePan === false) return;
						this.handleTouchStartPan();
						this.state = STATE.TOUCH_PAN;
						break;
					default: this.state = STATE.NONE;
				}
				break;
			case 2:
				switch (touches.TWO) {
					case TOUCH.DOLLY_PAN:
						if (this.enableZoom === false && this.enablePan === false) return;
						this.handleTouchStartDollyPan();
						this.state = STATE.TOUCH_DOLLY_PAN;
						break;
					case TOUCH.DOLLY_ROTATE:
						if (this.enableZoom === false && this.enableRotate === false) return;
						this.handleTouchStartDollyRotate();
						this.state = STATE.TOUCH_DOLLY_ROTATE;
						break;
					default: this.state = STATE.NONE;
				}
				break;
			default: this.state = STATE.NONE;
		}
		if (this.state !== STATE.NONE) this.dispatchStart();
	}
	onTouchMove(event) {
		trackPointer(event);
		switch (this.state) {
			case STATE.TOUCH_ROTATE:
				if (this.enableRotate === false) return;
				this.handleTouchMoveRotate(event);
				this.update();
				break;
			case STATE.TOUCH_PAN:
				if (this.enablePan === false) return;
				handleTouchMovePan(event);
				this.update();
				break;
			case STATE.TOUCH_DOLLY_PAN:
				if (this.enableZoom === false && this.enablePan === false) return;
				this.handleTouchMoveDollyPan(event);
				this.update();
				break;
			case STATE.TOUCH_DOLLY_ROTATE:
				if (this.enableZoom === false && this.enableRotate === false) return;
				this.handleTouchMoveDollyRotate(event);
				this.update();
				break;
			default: this.state = STATE.NONE;
		}
	}
	handleTouchStartDollyRotate() {
		if (this.enableZoom) this.handleTouchStartDolly();
		if (this.enableRotate) this.handleTouchStartRotate();
	}
	handleTouchStartPan() {
		if (_pointers.length === 1) this.panStart.set(_pointers[0].pageX, _pointers[0].pageY);
		else {
			const x = .5 * (_pointers[0].pageX + _pointers[1].pageX);
			const y = .5 * (_pointers[0].pageY + _pointers[1].pageY);
			this.panStart.set(x, y);
		}
	}
	handleTouchStartDolly() {
		const dx = _pointers[0].pageX - _pointers[1].pageX;
		const dy = _pointers[0].pageY - _pointers[1].pageY;
		const distance = Math.sqrt(dx * dx + dy * dy);
		this.dollyStart.set(0, distance);
	}
	handleTouchStartRotate(event) {
		if (_pointers.length === 1) this.rotateStart.set(_pointers[0].pageX, _pointers[0].pageY);
		else {
			const x = .5 * (_pointers[0].pageX + _pointers[1].pageX);
			const y = .5 * (_pointers[0].pageY + _pointers[1].pageY);
			this.rotateStart.set(x, y);
		}
	}
	handleTouchStartDollyPan() {
		if (this.enableZoom) this.handleTouchStartDolly();
		if (this.enablePan) this.handleTouchStartPan();
	}
	handleTouchMoveRotate(event) {
		if (_pointers.length == 1) this.rotateEnd.set(event.pageX, event.pageY);
		else {
			const position = getSecondPointerPosition(event);
			const x = .5 * (event.pageX + position.x);
			const y = .5 * (event.pageY + position.y);
			this.rotateEnd.set(x, y);
		}
		this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);
		const element = this.domElement;
		if (this.rotateDirectionLeft) this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientHeight);
		else this.rotateRight(2 * Math.PI * this.rotateDelta.x / element.clientHeight);
		this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight);
		this.rotateStart.copy(this.rotateEnd);
	}
	handleTouchMovePan(event) {
		if (_pointers.length === 1) this.panEnd.set(event.pageX, event.pageY);
		else {
			const position = getSecondPointerPosition(event);
			const x = .5 * (event.pageX + position.x);
			const y = .5 * (event.pageY + position.y);
			this.panEnd.set(x, y);
		}
		this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);
		this.pan(this.panDelta.x, this.panDelta.y);
		this.panStart.copy(this.panEnd);
	}
	handleTouchMoveDolly(event) {
		const position = getSecondPointerPosition(event);
		const dx = event.pageX - position.x;
		const dy = event.pageY - position.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		this.dollyEnd.set(0, distance);
		this.dollyDelta.set(0, Math.pow(this.dollyEnd.y / this.dollyStart.y, this.zoomSpeed));
		this.dollyOut(this.dollyDelta.y);
		this.dollyStart.copy(this.dollyEnd);
	}
	handleTouchMoveDollyPan(event) {
		if (this.enableZoom) this.handleTouchMoveDolly(event);
		if (this.enablePan) this.handleTouchMovePan(event);
	}
	handleTouchMoveDollyRotate(event) {
		if (this.enableZoom) this.handleTouchMoveDolly(event);
		if (this.enableRotate) this.handleTouchMoveRotate(event);
	}
	handleMouseDownRotate(event) {
		this.rotateStart.set(event.clientX, event.clientY);
	}
	handleMouseDownDolly(event) {
		this.dollyStart.set(event.clientX, event.clientY);
	}
	handleMouseDownPan(event) {
		this.panStart.set(event.clientX, event.clientY);
	}
	handleMouseMoveRotate(event) {
		this.rotateEnd.set(event.clientX, event.clientY);
		this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);
		const element = this.domElement === document ? this.domElement.body : event.target;
		if (this.rotateDirectionLeft) this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientHeight);
		else this.rotateRight(2 * Math.PI * this.rotateDelta.x / element.clientHeight);
		this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight);
		this.rotateStart.copy(this.rotateEnd);
		this.update();
	}
	handleMouseMoveDolly(event) {
		this.dollyEnd.set(event.clientX, event.clientY);
		this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);
		if (this.dollyDelta.y > 0) this.dollyIn(this.getZoomScale());
		else if (this.dollyDelta.y < 0) this.dollyOut(this.getZoomScale());
		this.dollyStart.copy(this.dollyEnd);
		this.update();
	}
	handleMouseMovePan(event) {
		this.panEnd.set(event.clientX, event.clientY);
		this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);
		this.pan(this.panDelta.x, this.panDelta.y);
		this.panStart.copy(this.panEnd);
		this.update();
	}
	handleMouseWheel(event) {
		if (event.deltaY < 0) this.dollyIn(this.getZoomScale());
		else if (event.deltaY > 0) this.dollyOut(this.getZoomScale());
		this.update();
	}
	onMouseDown(event) {
		let mouseAction;
		switch (event.button) {
			case 0:
				mouseAction = mouseButtons.LEFT;
				break;
			case 1:
				mouseAction = mouseButtons.MIDDLE;
				break;
			case 2:
				mouseAction = mouseButtons.RIGHT;
				break;
			default: mouseAction = -1;
		}
		switch (mouseAction) {
			case MOUSE.DOLLY:
				if (this.enableZoom === false) return;
				this.handleMouseDownDolly(event);
				this.state = STATE.DOLLY;
				break;
			case MOUSE.ROTATE:
				if (event.ctrlKey || event.metaKey || event.shiftKey) {
					if (this.enablePan === false) return;
					this.handleMouseDownPan(event);
					this.state = STATE.PAN;
				} else {
					if (this.enableRotate === false) return;
					this.handleMouseDownRotate(event);
					this.state = STATE.ROTATE;
				}
				break;
			case MOUSE.PAN:
				if (event.ctrlKey || event.metaKey || event.shiftKey) {
					if (this.enableRotate === false) return;
					this.handleMouseDownRotate(event);
					this.state = STATE.ROTATE;
				} else {
					if (this.enablePan === false) return;
					this.handleMouseDownPan(event);
					this.state = STATE.PAN;
				}
				break;
			default: this.state = STATE.NONE;
		}
		if (this.state !== STATE.NONE) {
			this.dampingFactor = this.mouseDampingFactor;
			this.activeElement = event.target;
			this.dispatchStart();
		}
	}
	onMouseMove(event) {
		if (this.enabled === false) return;
		switch (this.state) {
			case STATE.ROTATE:
				if (this.enableRotate === false) return;
				this.handleMouseMoveRotate(event);
				break;
			case STATE.DOLLY:
				if (this.enableZoom === false) return;
				this.handleMouseMoveDolly(event);
				break;
			case STATE.PAN:
				if (this.enablePan === false) return;
				this.handleMouseMovePan(event);
		}
	}
	onMouseUp(event) {
		if (this.enabled === false) return;
		this.handleMouseUp(event);
		document.removeEventListener("mousemove", this.onMouseMoveRef, this.passiveEvent);
		document.removeEventListener("mouseup", this.onMouseUpRef, this.passiveEvent);
		document.removeEventListener("mouseout", this.onMouseUpRef, this.passiveEvent);
		this.dispatchEnd();
		this.state = STATE.NONE;
		this.activeElement = null;
	}
	onMouseWheel(event) {
		if (this.enabled === false || this.enableZoom === false || this.state !== STATE.NONE && this.state !== STATE.ROTATE) return;
		event.preventDefault();
		event.stopPropagation();
		this.dispatchStart();
		this.handleMouseWheel(event);
		this.dispatchEnd();
	}
	onKeyDown(event) {
		if (this.enabled === false || this.enableKeys === false || this.enablePan === false) return;
		this.dampingFactor = this.keyDampingFactor;
		this.handleKeyDown(event);
	}
	onPointerDown(event) {
		if (this.enabled === false) return;
		if (this.domElement !== event.target && this.domElement !== event.target.parentNode) return;
		const onPointerUpCheck = () => {
			document.removeEventListener("pointermove", onPointerMoveCheck);
			document.removeEventListener("pointerup", onPointerUpCheck);
		};
		const onPointerMoveCheck = () => {
			onPointerUpCheck();
			if (_pointers.length === 0) {
				this.domElement.setPointerCapture(event.pointerId);
				this.onPointerMoveRef = (e) => this.onPointerMove(e);
				this.onPointerUpRef = (e) => this.onPointerUp(e);
				this.domElement.addEventListener("pointermove", this.onPointerMoveRef);
				this.domElement.addEventListener("pointerup", this.onPointerUpRef);
			}
			addPointer(event);
			if (event.pointerType === "touch") this.onTouchStart(event);
			else this.onMouseDown(event);
		};
		document.addEventListener("pointermove", onPointerMoveCheck);
		document.addEventListener("pointerup", onPointerUpCheck);
	}
	onPointerMove(event) {
		if (this.enabled === false) return;
		if (event.pointerType === "touch") this.onTouchMove(event);
		else this.onMouseMove(event);
	}
	onPointerUp(event) {
		removePointer(event);
		if (_pointers.length === 0) {
			this.domElement.releasePointerCapture(event.pointerId);
			this.domElement.removeEventListener("pointermove", this.onPointerMoveRef);
			this.domElement.removeEventListener("pointerup", this.onPointerUpRef);
		}
		this.dispatchEnd();
		this.state = STATE.NONE;
	}
	onPointerCancel(event) {
		removePointer(event);
	}
	connect() {
		this.enabled = true;
		this.reset();
		this.onMouseWheelRef = (event) => this.onMouseWheel(event), this.onPointerDownRef = (event) => this.onPointerDown(event), this.onPointerCancelRef = (event) => this.onPointerCancel(event);
		this.onKeyDownRef = (event) => this.onKeyDown(event);
		window.addEventListener("keydown", this.onKeyDownRef);
		this.domElement.addEventListener("pointerdown", this.onPointerDownRef);
		this.domElement.addEventListener("pointercancel", this.onPointerCancelRef);
		this.domElement.addEventListener("wheel", this.onMouseWheelRef, { passive: false });
	}
	disconnect() {
		this.enabled = false;
		_pointers = [];
		this.domElement.removeEventListener("pointerdown", this.onPointerDownRef);
		this.domElement.removeEventListener("pointercancel", this.onPointerCancelRef);
		this.domElement.removeEventListener("wheel", this.onMouseWheelRef);
		this.domElement.removeEventListener("pointermove", this.onPointerMoveRef);
		this.domElement.removeEventListener("pointerup", this.onPointerUpRef);
		window.removeEventListener("keydown", this.onKeyDownRef);
	}
	saveState() {
		this.target0.copy(this.target);
		this.position0.copy(this.object.position);
		this.zoom0 = this.object.zoom;
	}
	reset() {
		this.target.copy(this.target0);
		this.object.position.copy(this.position0);
		this.object.zoom = this.zoom0;
		this.object.updateProjectionMatrix();
		this.dispatchChange();
		this.update();
		this.state = STATE.NONE;
	}
	update() {
		const offset = new Vector3(), quat = new Quaternion().setFromUnitVectors(this.object.up, new Vector3(0, 1, 0)), quatInverse = quat.clone().invert(), lastPosition = new Vector3(), lastQuaternion = new Quaternion(), lastTargetPosition = new Vector3(), position = this.object.position;
		2 * Math.PI;
		offset.copy(position).sub(this.target);
		offset.applyQuaternion(quat);
		this.spherical.setFromVector3(offset);
		this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor;
		this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor;
		this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));
		this.spherical.makeSafe();
		this.spherical.radius *= this.scale;
		this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
		this.target.addScaledVector(this.panOffset, this.dampingFactor);
		offset.setFromSpherical(this.spherical);
		offset.applyQuaternion(quatInverse);
		position.copy(this.target).add(offset);
		this.object.lookAt(this.target);
		this.sphericalDelta.theta *= 1 - this.dampingFactor;
		this.sphericalDelta.phi *= 1 - this.dampingFactor;
		this.panOffset.multiplyScalar(1 - this.dampingFactor);
		this.scale = 1;
		if (this.zoomChanged || lastPosition.distanceToSquared(this.object.position) > EPS || 8 * (1 - lastQuaternion.dot(this.object.quaternion)) > EPS || lastTargetPosition.distanceToSquared(this.object.target) > 0) {
			this.dispatchChange();
			lastPosition.copy(this.object.position);
			lastQuaternion.copy(this.object.quaternion);
			lastTargetPosition.copy(this.object.target);
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
};
//#endregion
export { OrbitControls };
