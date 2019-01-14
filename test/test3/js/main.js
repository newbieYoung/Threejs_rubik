const FxaaVS = '#define GLSLIFY 1\n'+
                'attribute vec4 a_Position;\n' +
                'attribute vec2 a_TexCoord;\n' +
                'varying vec2 v_TexCoord;\n' +
                'void main() {\n' +
                '  gl_Position = a_Position;\n' +
                '  v_TexCoord = a_TexCoord;\n' +
                '}\n';

const FxaaFS = 'precision mediump float;\n' +
                'uniform vec2 iResolution;\n' +
                'uniform sampler2D iChannel0;\n' +
                'varying vec2 v_TexCoord;\n' +
                '#ifndef FXAA_REDUCE_MIN\n' +
                '#define FXAA_REDUCE_MIN (1.0 / 128.0)\n' +
                '#endif\n' +
                '#ifndef FXAA_REDUCE_MUL\n' +
                '#define FXAA_REDUCE_MUL (1.0 / 8.0)\n' +
                '#endif\n' +
                '#ifndef FXAA_SPAN_MAX\n' +
                '#define FXAA_SPAN_MAX     8.0\n' +
                '#endif\n' +
                '//optimized version for mobile, where dependent\n' +
                '//texture reads can be a bottleneck\n' +
                'vec4 fxaa_2_0(sampler2D tex, vec2 fragCoord, vec2 resolution,\n' +
                '  vec2 v_rgbNW, vec2 v_rgbNE,\n' +
                '  vec2 v_rgbSW, vec2 v_rgbSE,\n' +
                '  vec2 v_rgbM) {\n' +
                '  vec4 color;\n' +
                '  mediump vec2 inverseVP = vec2(1.0 / resolution.x, 1.0 / resolution.y);\n' +
                '  vec3 rgbNW = texture2D(tex, v_rgbNW).xyz;\n' +
                '  vec3 rgbNE = texture2D(tex, v_rgbNE).xyz;\n' +
                '  vec3 rgbSW = texture2D(tex, v_rgbSW).xyz;\n' +
                '  vec3 rgbSE = texture2D(tex, v_rgbSE).xyz;\n' +
                '  vec4 texColor = texture2D(tex, v_rgbM);\n' +
                '  vec3 rgbM = texColor.xyz;\n' +
                '  vec3 luma = vec3(0.299, 0.587, 0.114);\n' +
                '  float lumaNW = dot(rgbNW, luma);\n' +
                '  float lumaNE = dot(rgbNE, luma);\n' +
                '  float lumaSW = dot(rgbSW, luma);\n' +
                '  float lumaSE = dot(rgbSE, luma);\n' +
                '  float lumaM = dot(rgbM, luma);\n' +
                '  float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));\n' +
                '  float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));\n' +
                '  mediump vec2 dir;\n' +
                '  dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));\n' +
                '  dir.y = ((lumaNW + lumaSW) - (lumaNE + lumaSE));\n' +
                '  float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);\n' +
                '  float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);\n' +
                '  dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX), max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX), dir * rcpDirMin)) * inverseVP;\n' +
                '  vec3 rgbA = 0.5 * (texture2D(tex, fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)).xyz + texture2D(tex, fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)).xyz);\n' +
                '  vec3 rgbB = rgbA * 0.5 + 0.25 * (texture2D(tex, fragCoord * inverseVP + dir * -0.5).xyz + texture2D(tex, fragCoord * inverseVP + dir * 0.5).xyz);\n' +
                '  float lumaB = dot(rgbB, luma);\n' +
                '  if ((lumaB < lumaMin) || (lumaB > lumaMax))\n' +
                '    color = vec4(rgbA, texColor.a);\n' +
                '  else\n' +
                '    color = vec4(rgbB, texColor.a);\n' +
                '  return color;\n' +
                '}\n' +
                '//To save 9 dependent texture reads, you can compute\n' +
                '//these in the vertex shader and use the optimized\n' +
                '//frag.glsl function in your frag shader.\n' +
                '//This is best suited for mobile devices, like iOS.\n' +
                'void texcoords_3_1(vec2 fragCoord, vec2 resolution, out vec2 v_rgbNW, out vec2 v_rgbNE, out vec2 v_rgbSW, out vec2 v_rgbSE, out vec2 v_rgbM) {\n' +
                '  vec2 inverseVP = 1.0 / resolution.xy;\n' +
                '  v_rgbNW = (fragCoord + vec2(-1.0, -1.0)) * inverseVP;\n' +
                '  v_rgbNE = (fragCoord + vec2(1.0, -1.0)) * inverseVP;\n' +
                '  v_rgbSW = (fragCoord + vec2(-1.0, 1.0)) * inverseVP;\n' +
                '  v_rgbSE = (fragCoord + vec2(1.0, 1.0)) * inverseVP;\n' +
                '  v_rgbM = vec2(fragCoord * inverseVP);\n' +
                '}\n' +
                'vec4 apply_1_2(sampler2D tex, vec2 fragCoord, vec2 resolution) {\n' +
                '  mediump vec2 v_rgbNW;\n' +
                '  mediump vec2 v_rgbNE;\n' +
                '  mediump vec2 v_rgbSW;\n' +
                '  mediump vec2 v_rgbSE;\n' +
                '  mediump vec2 v_rgbM;\n' +
                '  //compute the texture coords\n' +
                '  texcoords_3_1(fragCoord, resolution, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);\n' +
                '  //compute FXAA\n' +
                '  return fxaa_2_0(tex, fragCoord, resolution, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);\n' +
                '}\n' +
                'void main() {\n' +
                '  vec2 uv;\n' +
                '  uv.x = v_TexCoord.x;\n' +
                '  uv.y = v_TexCoord.y;\n' +
                '  vec2 fragCoord = uv * iResolution;\n' +
                '  gl_FragColor = apply_1_2(iChannel0, fragCoord, iResolution);\n' +
                '}\n';
/**
 * 初始化着色器
 * vs 顶点着色器代码
 * fs 片元着色器代码
 */
function initShaders(gl, vs, fs) {
  var shaderProgram = gl.createProgram();//创建着色器

  //编译着色器代码
  var fragmentShader = getShaderByCode(gl, fs);
  var vertexShader = getShaderByCode(gl, vs);

  //链接着色器程序
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  //检查着色器是否成功链接
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    return null;
  }
  //链接成功后激活渲染器程序
  gl.useProgram(shaderProgram);

  return shaderProgram;
}

/**
 * 根据文本代码编译着色器
 */
function getShaderByCode(gl, code) {
  var shader;
  if (code.type == 'x-shader/x-fragment') {
    shader = gl.createShader(gl.FRAGMENT_SHADER);//创建片元着色器
  } else if (code.type === 'x-shader/x-vertex') {
    shader = gl.createShader(gl.VERTEX_SHADER);//创建顶点着色器
  } else {
    return null;
  }
  gl.shaderSource(shader, code.source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(shader));//输出编译失败信息
    return null;
  }
  return shader;
}

//初始化数据缓冲区
function _initArrayBuffer(gl, shaderProgram, attribute, data, num, type) {
  //创建缓冲区
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object!');
    return false;
  }
  //将缓冲区对象绑定到目标
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  //把缓冲区数据赋予指定变量
  var a_attribute = gl.getAttribLocation(shaderProgram, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
  //解绑缓冲区
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return true;
}

//初始化索引缓冲区
function _initElementBuffer(gl, data) {
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object!');
    return false;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
  //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);//没有绘制完成之前并不能解绑
  return true;
}

import * as THREE from 'threejs/three.js'
import Matrix4 from 'matrix4.js'

var RES = wx.getSystemInfoSync()

/**
 * 游戏主函数
 */
export default class Main {

  constructor() {
    var width = RES.windowWidth * RES.pixelRatio;
    var height = RES.windowHeight * RES.pixelRatio;

    var canvas = wx.createCanvas();
    canvas.width = width;
    canvas.height = height;

    var faGL = canvas.getContext('webgl');//首次调用 wx.createCanvas() 创建的是上屏 Canvas，且与屏幕等宽等高
    faGL.clearColor(0.0, 0.5, 1.0, 1.0);

    var vertCode = {
      source: FxaaVS,
      type: 'x-shader/x-vertex'
    };
    var fragCode = {
      source: FxaaFS,
      type: 'x-shader/x-fragment'
    };

    var faProgram = initShaders(faGL, vertCode, fragCode, 'code');
    var u_iResolution = faGL.getUniformLocation(faProgram, 'iResolution');//iResolution = [ width, height ]
    faGL.uniform2f(u_iResolution, canvas.width, canvas.height);

    var faTexture = faGL.createTexture();//创建纹理对象
    faGL.activeTexture(faGL.TEXTURE0);
    faGL.bindTexture(faGL.TEXTURE_2D, faTexture);//绑定纹理对象
    faGL.pixelStorei(faGL.UNPACK_FLIP_Y_WEBGL, 1);//对纹理图像进行y轴反转
    faGL.texParameteri(faGL.TEXTURE_2D, faGL.TEXTURE_MIN_FILTER, faGL.LINEAR);//配置纹理对象的参数
    faGL.texParameteri(faGL.TEXTURE_2D, faGL.TEXTURE_WRAP_S, faGL.CLAMP_TO_EDGE);
    faGL.texParameteri(faGL.TEXTURE_2D, faGL.TEXTURE_WRAP_T, faGL.CLAMP_TO_EDGE);
    var u_iChannel0 = faGL.getUniformLocation(faProgram, 'iChannel0');//iChannel0 = 0
    faGL.uniform1i(u_iChannel0, 0);

    var pData = new Float32Array([
      //顶点坐标、纹理坐标
      -1.0, 1.0, 0.0, 1.0,
      -1.0, -1.0, 0.0, 0.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, -1.0, 1.0, 0.0,
    ]);
    var pNum = 4;//顶点数目
    var vertexBuffer = faGL.createBuffer();//创建缓冲区对象

    //将缓冲区对象绑定到目标并写入数据
    faGL.bindBuffer(faGL.ARRAY_BUFFER, vertexBuffer);
    faGL.bufferData(faGL.ARRAY_BUFFER, pData, faGL.STATIC_DRAW);
    var size = pData.BYTES_PER_ELEMENT;//数组中的每个元素的大小（以字节为单位）

    //顶点着色器接受顶点坐标
    var a_Position = faGL.getAttribLocation(faProgram, 'a_Position');
    faGL.vertexAttribPointer(a_Position, 2, faGL.FLOAT, false, size * 4, 0);
    faGL.enableVertexAttribArray(a_Position);
    var a_TexCoord = faGL.getAttribLocation(faProgram, 'a_TexCoord');
    faGL.vertexAttribPointer(a_TexCoord, 2, faGL.FLOAT, false, size * 4, size * 2);
    faGL.enableVertexAttribArray(a_TexCoord);

    // var image = wx.createImage();
    // image.src = 'images/t1.jpg';
    // image.onload = function () {
    //   faGL.texImage2D(faGL.TEXTURE_2D, 0, faGL.RGBA, faGL.RGBA, faGL.UNSIGNED_BYTE, image);
    //   faGL.clear(faGL.COLOR_BUFFER_BIT);
    //   faGL.drawArrays(faGL.TRIANGLE_STRIP, 0, pNum);
    // }

    // var gl = this.simleWebGLDemo();
    // faGL.texImage2D(faGL.TEXTURE_2D, 0, faGL.RGBA, faGL.RGBA, faGL.UNSIGNED_BYTE, gl.canvas);
    // faGL.clear(faGL.COLOR_BUFFER_BIT);
    // faGL.drawArrays(faGL.TRIANGLE_STRIP, 0, pNum);

    var rect = this.simple2DDemo();
    faGL.texImage2D(faGL.TEXTURE_2D, 0, faGL.RGBA, faGL.RGBA, faGL.UNSIGNED_BYTE, rect);
    faGL.clear(faGL.COLOR_BUFFER_BIT);
    faGL.drawArrays(faGL.TRIANGLE_STRIP, 0, pNum);
  }

  /**
   * 简单的webgl示例
   */
  simleWebGLDemo(){
    var vert = 'attribute vec4 a_Position;' +
                'attribute vec4 a_Color;' +
                'attribute vec4 a_Normal;' +

                'uniform mat4 u_MvpMatrix;' +
                'uniform mat4 u_NormalMatrix;' +
                'uniform mat4 u_ModelMatrix;' +

                'varying vec3 v_Position;' +
                'varying vec4 v_Color;' +
                'varying vec3 v_Normal;' +
                'void main() {' +
                  'gl_Position = u_MvpMatrix * a_Position;' +
                  'v_Position = vec3(u_ModelMatrix * a_Position);' +
                  'v_Color = a_Color;' +
                  'v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));' +
                '}';

    var frag = 'precision mediump float;' +
                'uniform vec3 u_LightColor;' +
                'uniform vec3 u_LightPosition;' +
                'uniform vec3 u_AmbientLight;' +
                'varying vec3 v_Position;' +
                'varying vec4 v_Color;' +
                'varying vec3 v_Normal;' +
                'void main() {' +
                  'vec3 normal = normalize(v_Normal);' +
                  'vec3 lightDirection = normalize(u_LightPosition - v_Position);' +
                  'float nDotL = max(dot(lightDirection, normal), 0.0);' +
                  'vec3 diffuse = u_LightColor * v_Color.rgb * nDotL;' +
                  'vec3 ambient = u_AmbientLight * v_Color.rgb;' +
                  'gl_FragColor = vec4(diffuse + ambient, v_Color.a);' +
                '}';

    var EyePoint = {//视点以及默认位置
      x: 0.0,
      y: 0.0,
      z: 14.0
    };
    var PerspParams = {//透视投影参数
      fovy: 45.0,
      g_near: 1.0,
      g_far: 1500.0
    };

    var vertCode = {
      source: vert,
      type: 'x-shader/x-vertex'
    };
    var fragCode = {
      source: frag,
      type: 'x-shader/x-fragment'
    };

    //var width = RES.windowWidth * RES.pixelRatio;
    //var height = RES.windowHeight * RES.pixelRatio;

    var width = RES.windowWidth;
    var height = RES.windowHeight;

    var canvas = wx.createCanvas();
    canvas.width = width;
    canvas.height = height;
    var gl = canvas.getContext('webgl');//获取webgl上下文
    gl.clearColor(1.0, 1.0, 1.0, 1.0);//设置背景颜色
    gl.enable(gl.DEPTH_TEST);//开启隐藏面消除

    var shaderProgram = initShaders(gl, vertCode, fragCode);//初始化着色器程序

    var viewMatrix = new Matrix4();//视图矩阵
    viewMatrix.setLookAt(EyePoint.x, EyePoint.y, EyePoint.z, 0, 0, 0, 0, 1, 0);
    var projMatrix = new Matrix4();//透视投影矩阵
    projMatrix.setPerspective(PerspParams.fovy, width / height, PerspParams.g_near, PerspParams.g_far);
    var cameraMatrix = projMatrix.multiply(viewMatrix);

    //环境光
    var u_AmbientLight = gl.getUniformLocation(shaderProgram, 'u_AmbientLight');
    gl.uniform3f(u_AmbientLight, 1.0, 1.0, 1.0);

    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3

    //顶点
    var vertices = new Float32Array([
      1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, // v0-v1-v2-v3 front
      1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, // v0-v3-v4-v5 right
      1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
      -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, // v1-v6-v7-v2 left
      -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, // v7-v4-v3-v2 down
      1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0  // v4-v7-v6-v5 back
    ]);

    //颜色
    var colors = new Float32Array([
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v1-v2-v3 front
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v3-v4-v5 right
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v5-v6-v1 up
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v1-v6-v7-v2 left
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v7-v4-v3-v2 down
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0　    // v4-v7-v6-v5 back
    ]);

    //法向量
    var normals = new Float32Array([
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
      1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
      0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
      -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
      0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,  // v7-v4-v3-v2 down
      0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0   // v4-v7-v6-v5 back
    ]);

    //索引
    var indices = new Uint8Array([
      0, 1, 2, 0, 2, 3,    // front
      4, 5, 6, 4, 6, 7,    // right
      8, 9, 10, 8, 10, 11,    // up
      12, 13, 14, 12, 14, 15,   // left
      16, 17, 18, 16, 18, 19,   // down
      20, 21, 22, 20, 22, 23    // back
    ]);

    var num = indices.length;

    _initElementBuffer(gl, indices);
    _initArrayBuffer(gl, shaderProgram, 'a_Normal', normals, 3, gl.FLOAT);
    _initArrayBuffer(gl, shaderProgram, 'a_Position', vertices, 3, gl.FLOAT);
    _initArrayBuffer(gl, shaderProgram, 'a_Color', colors, 3, gl.FLOAT);

    //模型矩阵
    var modelMatrix = new Matrix4();
    modelMatrix.rotate(45, 0, 1, 0);
    modelMatrix.rotate(35, 1, 0, 1);
    var u_ModelMatrix = gl.getUniformLocation(shaderProgram, 'u_ModelMatrix');
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    //投影矩阵
    var mvpMatrix = cameraMatrix;
    var originMatrix = new Matrix4();
    for (var i = 0; i < cameraMatrix.elements.length; i++) {
      originMatrix.elements[i] = cameraMatrix.elements[i];
    }
    mvpMatrix.multiply(modelMatrix);
    var u_MvpMatrix = gl.getUniformLocation(shaderProgram, 'u_MvpMatrix');
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    //法向量变换矩阵
    var normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    var u_NormalMatrix = gl.getUniformLocation(shaderProgram, 'u_NormalMatrix');
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, num, gl.UNSIGNED_BYTE, 0);

    return gl;
  }

  /**
   * 简单2Dcanvas示例
   */
  simple2DDemo(){
    var width = RES.windowWidth * RES.pixelRatio;
    var height = RES.windowHeight * RES.pixelRatio;
    //var width = RES.windowWidth;
    //var height = RES.windowHeight;

    var canvas = wx.createCanvas('canvas');
    canvas.width = width;
    canvas.height = height;

    var gapLen = 10;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'red';
    ctx.fillRect(gapLen, gapLen, width - 2 * gapLen, height - 2 * gapLen);

    return canvas;
  }
}
