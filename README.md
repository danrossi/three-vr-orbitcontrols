OrbitControls.js
============
This is a modification of the three.js OrbitControls to handle two draggable elements in the one instance. This is required because alot of the OO structure is kept internal including event handlers.

Based on: http://threejs.org/examples/misc_controls_orbit

Example usage would be the three.js canvas or another overlay element and an orbit giro navigation control button overlay.


Examples
--------

### Basic Example

```javascript

<div class="vr-controls" role="button" title="VR Controls" aria-label="VR Controls"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 929 910"><path fill="none" d="M0 115h1352v795H0z"></path><circle cx="462.639" cy="456.084" r="448.283" class="vr-controls-back"></circle><path d="M115.043 250.976c.043.024.112.024.155 0l.77-.432c.02-.012.032-.027.032-.044 0-.017-.012-.033-.032-.044l-.77-.432c-.043-.024-.112-.024-.155 0s-.043.063 0 .087l.692.39-.692.39c-.043.024-.043.063 0 .087z" class="fill"></path><path d="M675.755 562.768c5.827 5.95 15.275 5.95 21.104 0l104.453-106.685c2.7-2.758 4.37-6.568 4.37-10.777 0-4.208-1.67-8.018-4.37-10.777L696.86 327.843c-5.83-5.95-15.276-5.95-21.105 0-5.83 5.952-5.83 15.6 0 21.554l93.904 95.906-93.906 95.908c-5.83 5.95-5.83 15.6 0 21.554z" fill="#999" stroke="#000" stroke-width="1.885"></path><path d="M272.72 317.878c-6.217-5.913-16.294-5.913-22.512 0l-111.42 105.998c-2.88 2.74-4.66 6.526-4.66 10.707 0 4.18 1.78 7.967 4.66 10.708l111.42 106c6.216 5.912 16.293 5.912 22.51 0 6.22-5.914 6.217-15.5 0-21.416l-100.164-95.29 100.165-95.29c6.214-5.913 6.214-15.5 0-21.415z" class="fill"></path><path d="M475.805 139.683c-2.894-2.894-6.892-4.683-11.308-4.683-4.416 0-8.414 1.79-11.308 4.683L341.243 251.627c-6.245 6.245-6.245 16.37 0 22.617 6.244 6.247 16.37 6.245 22.618 0l100.634-100.636 100.636 100.636c6.244 6.245 16.37 6.245 22.618 0 6.25-6.245 6.248-16.37 0-22.617L475.806 139.683z" class="fill"></path><path d="M573.023 626.488l-104.52 104.52-104.52-104.52c-6.487-6.488-17.002-6.488-23.493 0-6.49 6.488-6.486 17.002 0 23.49l116.267 116.266c3.006 3.006 7.158 4.864 11.747 4.864 4.588 0 8.738-1.858 11.744-4.864l116.267-116.266c6.486-6.486 6.486-17.002 0-23.49-6.486-6.488-17.002-6.488-23.492 0z" class="fill"></path></svg></div>

```


```javascript

var controlsElem = document.getElementById("vr-controls");

 var controls = new THREE.OrbitControls( camera, renderer.domElement, controlsElem );
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