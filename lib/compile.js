//初始化着色器
function initShaders(gl){
	var shaderProgram;
	var fragmentShader = getShader(gl,'shader-fs');
	var vertexShader = getShader(gl,'shader-vs');
	//创建着色器
	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram,vertexShader);
	gl.attachShader(shaderProgram,fragmentShader);
	//链接着色器程序
	gl.linkProgram(shaderProgram);
	//检查着色器是否成功链接
	if(!gl.getProgramParameter(shaderProgram,gl.LINK_STATUS)){
		return null;
	}
	//链接成功后激活渲染器程序
	gl.useProgram(shaderProgram);

    return shaderProgram;
}

//根据id获得编译好的着色器
function getShader(gl,id){
	var shaderScript;
	var theSource;
	var currentChild;
	var shader;

	//获取代码文本
	shaderScript = document.querySelector('#'+id);
	if(!shaderScript){
		return null;
	}
	theSource = '';
	currentChild = shaderScript.firstChild;
	while(currentChild){
		if(currentChild.nodeType === currentChild.TEXT_NODE){
			theSource += currentChild.textContent;
		}
		currentChild = currentChild.nextSibling;
	}
	console.log(theSource);

	//编译着色器代码
	if(shaderScript.type==='x-shader/x-fragment'){
		shader = gl.createShader(gl.FRAGMENT_SHADER);//创建片元着色器
	}else if(shaderScript.type === 'x-shader/x-vertex'){
		shader = gl.createShader(gl.VERTEX_SHADER);//创建顶点着色器
	}else{
		return null;//非法类型返回null
	}
	gl.shaderSource(shader,theSource);
	gl.compileShader(shader);
	
	//检查是否编译成功
	if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
		console.log(gl.getShaderInfoLog(shader));//打印编译失败信息
		return null;
	}
	return shader;
}