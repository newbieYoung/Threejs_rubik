/**
 * 通用常量
 * density    
 */
const Constant = {
  density: 750 / window.innerWidth,
}

/**
 * 基础模型参数
 * x、y、z       魔方左上角坐标
 * num           魔方阶数
 * len           小方块宽高
 * defaultColor  默认面颜色
 * colors        六面颜色，顺序依次为 右、左、上、下、前、后
 */
const BasicParams = {
  x: -75,
  y: 75,
  z: 75,
  num: 3,
  len: 50,
  defaultColor: '#666666',
  colors: ['#ff6b02', '#dd422f','#ffffff', '#fdcd02','#3d81f7', '#019d53']
};

export { Constant,BasicParams};