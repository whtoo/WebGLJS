/* "use strict" enforces aspects of good syntax. */
"use strict"
/**
 * Javascript controller 'class'
 * includes methods and veriables
 * shared by example provided 
 * with the e-book series
 * "Online 3D media with WebGL"
 * @param aVert : Float32Array
 * vertex coordinates.
 * interleaved with texels
 * 
 * @param aIdx : Uint16Array 
 * of indices into the vertex array
 * 
 * @param glDemo : 
 * Maintain a reference to an Object prepared
 * for each unique example
 * provided with the e-book
 * series.
 * Composition of classes:
 * GLControl.glDemo
 * 
 * @param aE : Array<GLEntity>
 * 
 * @returns: GLControl instance
 */

var GLControl = function(aVert,aIdx,aE,glDemo) {
    // Acount to increment
    // rotation in radians
    // per animated frame
    this.N_RAD = new Number(0.5)
    
    // The maximum number of frames
    // to animate
    this.FRAME_MAX = Number(512)
    // The current display
    // frame wthile an animation
    // runs.
    this.frameCount = Number(0)

    // The starting angle of rotation
    // in radians. Increments per animation
    // frame
    this.nRad = new Number(0)

    // Array of GLEntity
    this.aEntities = aE

    /// The current demo or WebGL example
    /// 'class' Object
    this.glDemo = glDemo

    // call the demo project's
    // renderer for display
    if(glDemo.render != null) {
        this.render = glDemo.render
    } else {
        this.render = this.renderDefault
    }
    



}

