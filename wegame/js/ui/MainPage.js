import {Constant} from '../util/Constant.js';
import Rubik from '../object/Rubik.js';

/**
 * 游戏主页面
 */
export default class MainPage {
  constructor() {
    this.isViewChanged = false;//视图是否有变动
    this.width = window.innerWidth * window.devicePixelRatio;
    this.height = window.innerHeight * window.devicePixelRatio;

    this.canvas = wx.createCanvas();
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.context = this.canvas.getContext('2d');

    this.initTouchLine();
    this.initEvent();
  }

  /**
   * 初始化控制线
   * touchLineImage       控制线图片
   * touchLineY           控制线位置
   * touchLineCanvas      控制线画布
   * touchLineContext     控制线画布上下文
   * touchLineInitialized 控制线初始化完成
   * touchLineWidth       控制线按钮显示宽度
   */
  initTouchLine(){
    var self = this;
    this.touchLineY = 0;
    this.touchLineImage = wx.createImage();
    //this.touchLineImage.src = './images/touch-line.png';//本地预览使用本地图片
    this.touchLineImage.src = 'https://raw.githubusercontent.com/newbieYoung/Threejs_rubik/master/wegame/images/touch-line.png';//真机器预览使用网络图片
    this.touchLineImage.onload = function () {
      self.touchLineCanvas = wx.createCanvas();
      self.touchLineCanvas.width = self.touchLineImage.width / Constant.density * window.devicePixelRatio;
      self.touchLineCanvas.height = self.touchLineImage.height / Constant.density * window.devicePixelRatio;
      self.touchLineContext = self.touchLineCanvas.getContext('2d');
      self.touchLineWidth = 61 / Constant.density * window.devicePixelRatio;
      self.touchLineContext.drawImage(self.touchLineImage, 0, 0, self.touchLineCanvas.width, self.touchLineCanvas.height);
      self.changeTouchLine(self.height/4*3);//默认位置
      self.initRubik();//控制线确定位置之后才能初始化魔方
      self.touchLineInitialized = true;
      self.isViewChanged = true;
    }
  }

  /**
   * 更改控制线位置
   */
  changeTouchLine(y) {
    if (y != this.touchLineY) {
      this.touchLineY = y;
      this.resizeRubik();
      this.isViewChanged = true;
    }
  }

  /**
   * 初始化背景
   */
  initBackground() {
    this.context.fillStyle = '#322c66';
    this.context.fillRect(0,0,this.width,this.height);
  }

  /**
   * 初始化魔方
   */
  initRubik() {
    this.frontRubik = new Rubik(this.width, this.touchLineY);
    this.frontPoint = { x: 0, y: 0 };
    this.endRubik = new Rubik(this.width, this.height - this.touchLineY);
    this.endRubik.setCameraPosition(-300, -300, -300);
    this.endPoint = { x: 0, y: this.touchLineY };
    this.isViewChanged = true;
  }

  /**
   * 魔方尺寸调整
   */
  resizeRubik(){
    if (this.frontRubik && this.endRubik){
      this.frontRubik.updateView(this.touchLineY);
      this.frontPoint = { x: 0, y: 0 };
      this.endRubik.updateView(this.height - this.touchLineY);
      this.endPoint = { x: 0, y: this.touchLineY };
      this.isViewChanged = true;
    }
  }

  /**
   * 渲染
   */
  render() {
    if (this.isViewChanged){
      this.context.clearRect(0, 0, this.width, this.height);
      this.initBackground();
      //渲染背景
      if (this.touchLineInitialized){
        //渲染正视角魔方
        this.context.drawImage(this.frontRubik.viewCanvas, this.frontPoint.x, this.frontPoint.y, this.frontRubik.viewWidth, this.frontRubik.viewHeight);
        //渲染反视角魔方
        this.context.drawImage(this.endRubik.viewCanvas, this.endPoint.x, this.endPoint.y, this.endRubik.viewWidth, this.endRubik.viewHeight);
        //渲染控制线
        this.context.drawImage(this.touchLineCanvas, 0, this.touchLineY - this.touchLineCanvas.height / 2, this.touchLineCanvas.width, this.touchLineCanvas.height);
      }
      this.isViewChanged =false;
    }
  }

  /**
   * 初始化事件监听
   * startPoint  触摸开始点
   * touchObject 触摸对象
   * movePoint   触摸移动点
   */
  initEvent(){
    var self = this;

    wx.onTouchStart(function (e) {
      self.startPoint = self.getTouchPoint(e);
      self.touchObject = self.getTouchObject();
    })

    wx.onTouchMove(function (e) {
      self.movePoint = self.getTouchPoint(e);
      switch (self.touchObject){
        case 'touch-line':
          self.changeTouchLine(self.movePoint.y);
          break;
        default:
          break;
      }
    })

    wx.onTouchEnd(function (e) {
    })

    wx.onTouchCancel(function (e) {
    })
  }

  /**
   * 根据触摸事件获取触摸点
   */
  getTouchPoint(e){
    var point = null;
    if (e.touches.length > 0) {
      var touch = e.touches[0];
      point = {
        x: touch.clientX * window.devicePixelRatio,
        y: touch.clientY * window.devicePixelRatio
      }
    }
    return point;
  }

  /**
   * 根据触摸点返回触摸对象
   * touch-line 控制线
   */
  getTouchObject(){
    var obj = null;
    if (this.startPoint){
      //触摸对象是控制线
      if (this.startPoint.y >= (this.touchLineY - this.touchLineCanvas.height / 2) && this.startPoint.y <= (this.touchLineY + this.touchLineCanvas.height / 2)
        && (this.startPoint.x >= (this.width-this.touchLineWidth))){
        obj = 'touch-line';
      }
    }
    return obj;
  }
}