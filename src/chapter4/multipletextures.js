
import {
    vec2,
    vec3,
    vec4,
    mat4
} from "gl-matrix"

import { initBuffers,initShaderProgram,initTexture,loadShader,updateTexture } from '../Utils/common'
 /**
  * We will display a cube with different image attached to different face.
  */

var cubeRotation = 0.0;

//
// Start here
//
function main() {
    const canvas = document.querySelector('#glCanvas');
    const gl = canvas.getContext('webgl');

    // If we don't have a GL context, give up now

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    // Vertex shader program

    const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;

      // Apply lighting effect

      highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
      highp vec3 directionalLightColor = vec3(1, 1, 1);
      highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    }
  `;

    // Fragment shader program

    const fsSource = `
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;

    uniform sampler2D uSampler0;
    uniform sampler2D uSampler1;

    void main(void) {
      highp vec4 color0 = texture2D(uSampler0, vTextureCoord);
      highp vec4 color1 = texture2D(uSampler1, vTextureCoord);
      highp vec4 colorBlend = color0 * color1;
      gl_FragColor = vec4(colorBlend.rgb * vLighting, color1.a);
    }
  `;

    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Collect all the info needed to use the shader program.
    // Look up which attributes our shader program is using
    // for aVertexPosition, aVertexNormal, aTextureCoord,
    // and look up uniform locations.
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
            textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
            uSampler0: gl.getUniformLocation(shaderProgram, 'uSampler0'),
            uSampler1: gl.getUniformLocation(shaderProgram, 'uSampler1'),
        },
    };

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    const buffers = initBuffers(gl);

    let textures = [initTexture(gl,'star.jpg','image'),initTexture(gl,'leaves.jpg','image')]
    var then = 0;

    // Draw the scene repeatedly
    function render(now) {
        now *= 0.001;  // convert to seconds
        const deltaTime = now - then;
        then = now;

        drawScene(gl, programInfo, buffers, textures, deltaTime);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {Object} programInfo 
 * @param {Object} buffers 
 * @param {Array<WebGLTexture>} textures
 * @param {Number} deltaTime 
 */
function drawScene(gl, programInfo, buffers, textures, deltaTime) {
    gl.clearColor(0.0, .0, .0, 1.0)
    gl.clearDepth(1.0)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    /// prepare parameters for perspectvie matrix with fov is equal to 45 degree
    const fieldOfView = 45 * Math.PI / 180
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const zNear = 0.1
    const zFar = 100
    const projectionMatrix = mat4.create()
    // setup perspective matrix
    mat4.perspective(
        projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar
    )

    // Now move the drawing position a bit to where we want to
    // start drawing the square.
    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
  const modelViewMatrix = mat4.create();

    mat4.translate(modelViewMatrix,     // destination matrix
        modelViewMatrix,     // matrix to translate
        [-0.0, 0.0, -6.0]);  // amount to translate
    mat4.rotate(modelViewMatrix,  // destination matrix
        modelViewMatrix,  // matrix to rotate
        cubeRotation,     // amount to rotate in radians
        [0, 0, 1]);       // axis to rotate around (Z)
    mat4.rotate(modelViewMatrix,  // destination matrix
        modelViewMatrix,  // matrix to rotate
        cubeRotation * .7,// amount to rotate in radians
        [0, 1, 0]);       // axis to rotate around (X)

    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    /// Program info
    // program: shaderProgram,
    // attribLocations: {
    //     vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    //     vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
    //     textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    // },
    // uniformLocations: {
    //     projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
    //     modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    //     normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
    //     uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
    // },

    // position: positionBuffer,
    /// Tell WebGL how to pull out from buffer to attribution
    {
        /// (x,y,z)
        const numberOfComponents = 3
        ///
        const type = gl.FLOAT
        /// pos1 | pos2
        /// each of items are near, so strides is zero 
        const strides = 0
        /// top from array
        const offset = 0
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numberOfComponents, type, false, strides, offset)
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)
    }

    //     vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    //     vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
    //     textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    // normal: normalBuffer,
    {
        /// (x,y,z)
        const numberOfComponents = 3
        ///
        const type = gl.FLOAT
        /// pos1 | pos2
        /// each of items are near, so strides is zero 
        const strides = 0
        /// top from array
        const offset = 0
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal)
        gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal, numberOfComponents, type, false, strides, offset)
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal)
    }

    // textureCoord: textureCoordBuffer,
    {
        /// (x,y)
        const numberOfComponents = 2
        ///
        const type = gl.FLOAT
        /// pos1 | pos2
        /// each of items are near, so strides is zero 
        const strides = 0
        /// top from array
        const offset = 0
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord)
        gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, numberOfComponents, type, false, strides, offset)
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord)
    }
    // Tell WebGL which indices to use to index the vertices
    {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,buffers.indices)
    }

    gl.useProgram(programInfo.program)

    {
    //     projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
    //     modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    //     normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
    //     uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix
            )
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix
        )
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.normalMatrix,
            false,
            normalMatrix
        )
    }

    {
        gl.activeTexture(gl.TEXTURE0)
        /// 将当前传入的纹理数据绑定到激活的纹理单元
        gl.bindTexture(gl.TEXTURE_2D,textures[0])
        // 告诉着色器从哪个纹理单元取纹理数据
        gl.uniform1i(programInfo.uniformLocations.uSampler0,0)

        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D,textures[1])
        gl.uniform1i(programInfo.uniformLocations.uSampler1,1)
    }

    {
        const vertexCount = 36
        const offset = 0
        const type = gl.UNSIGNED_SHORT
        gl.drawElements(gl.TRIANGLES,vertexCount,type,offset)
    }

    cubeRotation += deltaTime
}

export  { main }