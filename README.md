OrbitControls.js
============
This is a modification of the three.js OrbitControls to handle two draggable elements in the one instance. This is required because alot of the OO structure is kept internal including event handlers.

Key controls have also been modified for rotation instead of panning as video textures require rotation not panning.

Based on: http://threejs.org/examples/misc_controls_orbit

Example usage would be the three.js canvas or another overlay element .


Examples
--------

### Basic Example


```javascript
 var controls = new THREE.OrbitControls( camera, renderer.domElement );
```

The active target element is added to a property `activeElement`. Thia is useful for toggling dragging CSS states.

```
 controls.addEventListener("start", function(e) {
   e.target.activeElement.classList.add("is-dragging");
 });

 controls.addEventListener("end", function(e) {
   e.target.activeElement.classList.remove("is-dragging");
 });
```

Damping Factor
--------------

Damping factor requires more sensitivity for key control rotation and less sensitivity for mouse and touch so two configs have been added.

```
controls.mouseDampingFactor = 0.25;
controls.keyDampingFactor = 0.10;
```