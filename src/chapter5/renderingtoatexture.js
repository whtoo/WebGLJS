
import {
    vec2,
    vec3,
    vec4,
    mat4
} from "gl-matrix"

import { initBuffers,initShaderProgram } from '../Utils/common'
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

    void main(void) {
      highp vec4 color0 = texture2D(uSampler0, vTextureCoord);
      gl_FragColor = vec4(color0.rgb * vLighting, color0.a);
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

    var then = 0;

    // Draw the scene repeatedly
    function render(now) {
        now *= 0.001;  // convert to seconds
        const deltaTime = now - then;
        then = now;

        drawScene(gl, programInfo, buffers, deltaTime);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}


/**
 * 
 * @param {WebGLRenderingContext} gl 
 */
function prepareTargetTexture(gl) {
    const level = 0
    const internalFormat = gl.RGBA
    const border = 0
    const format = gl.RGBA
    const type = gl.UNSIGNED_BYTE
    const data = null
    const targetTextureWidth = 256
    const targetTextureHeight = 256

    const targetTexture = gl.createTexture()
    {
        gl.bindTexture(gl.TEXTURE_2D,targetTexture)
        gl.texImage2D(gl.TEXTURE_2D,level,internalFormat,
            targetTextureWidth,targetTextureHeight,border,
            format,type,data)
            
        // set the filtering so we don't need mips
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        /// scale w and h
        gl.texParameterf(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)
    }
    return targetTexture
}
/**
 * 
 * @param {WebGLRenderingContext} gl 
 */
function createFrameBuffer(gl,tex) {
    const level = 0
    const fb = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER,fb)

    const attachmentPoint = gl.COLOR_ATTACHMENT0
    gl.framebufferTexture2D(gl.FRAMEBUFFER,attachmentPoint,gl.TEXTURE_2D,tex,level)
    return fb
    
}
/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {Object} programInfo 
 */
function preparedPatternTexels(gl) {
    let texture = gl.createTexture()
    // fill texture with 3x2 pixels
    const level = 0;
    const internalFormat = gl.RGB;
    const width = 3;
    const height = 2;
    const border = 0;
    const format = gl.RGB;
    const type = gl.UNSIGNED_BYTE;
    const data = new Uint8Array([
      128,  64, 128, 0, 192,   0,128,  64, 128,
      0, 192,   0,  255,  0, 255,0, 192,   0
    ]);
    const alignment = 1;
    gl.bindTexture(gl.TEXTURE_2D,texture)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
                  format, type, data);

    // set the filtering so we don't need mips and it's not filtered
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture

}
/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {Object} programInfo 
 * @param {Object} buffers 
 * @param {Number} deltaTime 
 */
function drawScene(gl, programInfo, buffers, deltaTime) {
    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST)
    const targetTextureWidth = 256
    const targetTextureHeight = 256
     /// 创造渲染缓冲区的输出目标纹理
     let targetTexture = prepareTargetTexture(gl)
     /// 把上面的纹理与framebuffer绑定
     let fb = createFrameBuffer(gl,targetTexture)
    {
        let patternTexels = preparedPatternTexels(gl,3,2)
         // render to our targetTexture by binding the framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.bindTexture(gl.TEXTURE_2D,patternTexels)
        gl.viewport(0,0,targetTextureWidth,targetTextureHeight)
        gl.clearColor(0, 0, 1, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        drawCube(gl,programInfo,buffers,targetTextureWidth,targetTextureHeight)
    }

    {
        // render to the canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // render the cube with the texture we just rendered to
        gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    
        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
        // Clear the canvas AND the depth buffer.
        gl.clearColor(1, 1, 1, 1);   // clear to white
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        drawCube(gl,programInfo,buffers,gl.canvas.clientWidth,gl.canvas.clientHeight)
    }
 
    
    cubeRotation += deltaTime
}
/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {Object} programInfo 
 * @param {Object} buffers 
 * @param {number} width
 * @param {number} height
 */
function drawCube(gl, programInfo, buffers,width,height) {
    gl.useProgram(programInfo.program)

    /// prepare parameters for perspectvie matrix with fov is equal to 45 degree
    const fieldOfView = 45 * Math.PI / 180
    const aspect = width / height
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
        // 告诉着色器从哪个纹理单元取纹理数据
        gl.uniform1i(programInfo.uniformLocations.uSampler0,0)
    }

    {
        const vertexCount = 36
        const offset = 0
        const type = gl.UNSIGNED_SHORT
        gl.drawElements(gl.TRIANGLES,vertexCount,type,offset)
    }
}
export  { main }