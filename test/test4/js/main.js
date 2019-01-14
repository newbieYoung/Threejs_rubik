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

/**
 * 游戏主函数
 */
export default class Main {

  constructor() {
    var vert = 'attribute vec4 a_Position;' +
      'attribute vec2 a_TexCoord;' +
      'varying vec2 v_TexCoord;' +

      'void main() {' +
      'gl_Position= a_Position;' +
      'v_TexCoord = a_TexCoord;' +
      '}';

    var frag = 'precision mediump float;' +
      'varying vec2 v_TexCoord;' +
      'uniform sampler2D u_Sampler;' +
      'uniform sampler2D u_Sampler2;' +

      'void main() {' +
      'vec4 color = texture2D(u_Sampler,v_TexCoord);' +
      'vec4 color2 = texture2D(u_Sampler2,v_TexCoord);' +
      'gl_FragColor = color*color2;' +
      '}';

    var info = wx.getSystemInfoSync()
    var canvas = wx.createCanvas();
    canvas.width = info.windowWidth * info.pixelRatio;
    canvas.height = info.windowHeight * info.pixelRatio;

    var gl = canvas.getContext('webgl');
    gl.clearColor(0.0, 0.0, 1.0, 1.0);

    var vertCode = {
      source: vert,
      type: 'x-shader/x-vertex'
    };
    var fragCode = {
      source: frag,
      type: 'x-shader/x-fragment'
    };

    var program = initShaders(gl, vertCode, fragCode, 'code');
    var texture = gl.createTexture();//创建纹理对象
    gl.activeTexture(gl.TEXTURE0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);//对纹理图像进行y轴反转
    gl.bindTexture(gl.TEXTURE_2D, texture);//绑定纹理对象
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);//配置纹理对象的参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    var pData = new Float32Array([
      //顶点坐标、纹理坐标
      -1.0, 1.0, 0.0, 1.0,
      -1.0, -1.0, 0.0, 0.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, -1.0, 1.0, 0.0,
    ]);
    var pNum = 4;//顶点数目
    var vertexBuffer = gl.createBuffer();//创建缓冲区对象

    //将缓冲区对象绑定到目标并写入数据
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pData, gl.STATIC_DRAW);
    var size = pData.BYTES_PER_ELEMENT;//数组中的每个元素的大小（以字节为单位）

    //顶点着色器接受顶点坐标和纹理坐标映射关系
    var a_Position = gl.getAttribLocation(program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, size * 4, 0);
    gl.enableVertexAttribArray(a_Position);

    var a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, size * 4, size * 2);
    gl.enableVertexAttribArray(a_TexCoord);

    var image = wx.createImage();
    image.src = 'images/t1.jpg';
    image.onload = function () {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, pNum);
    }
  }
}
