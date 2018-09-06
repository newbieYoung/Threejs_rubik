import {Constant} from '../util/Constant.js'

/**
 * 游戏主页面
 */

export default class MainPage {
  constructor() {
    this.isViewChange = false;//视图是否有变动
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas = wx.createCanvas();
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.context = this.canvas.getContext('2d');

    this.startPoint = [];

    this.initTouchLine();
    this.initEvent();
  }

  /**
   * 初始化触摸线
   * touchLineImage       触摸线图片
   * touchLineY           触摸线位置
   * touchLineCanvas      触摸线画布
   * touchLineContext     触摸线画布上下文
   * touchLineInitialized 触摸线初始化完成
   * touchLineWidth       触摸线按钮显示宽度
   */
  initTouchLine(){
    var self = this;
    this.touchLineY = 0;
    this.touchLineInitialized = false;
    this.touchLineImage = wx.createImage();
    this.touchLineImage.src = './images/touch-line.png';
    this.touchLineImage.onload = function () {
      self.touchLineCanvas = wx.createCanvas();
      self.touchLineCanvas.width = self.touchLineImage.width / Constant.density;
      self.touchLineCanvas.height = self.touchLineImage.height / Constant.density;
      self.touchLineContext = self.touchLineCanvas.getContext('2d');
      self.touchLineWidth = Constant.touchLineWidth / Constant.density;
      self.touchLineContext.drawImage(self.touchLineImage, 0, 0, self.touchLineCanvas.width, self.touchLineCanvas.height);
      self.changeTouchLine(self.height/2);
      self.touchLineInitialized = true;
    }
  }

  /**
   * 更改触摸线位置
   */
  changeTouchLine(y){
    if (y != this.touchLineY){
      this.isViewChanged = true;
      this.touchLineY = y;
    }
  }

  /**
   * 渲染
   */
  render(viewContext) {
    if (this.isViewChanged){
      this.context.clearRect(0, 0, this.width, this.height);
      this.context.drawImage(this.touchLineCanvas, 0, this.touchLineY - this.touchLineCanvas.height / 2, this.touchLineCanvas.width, this.touchLineCanvas.height);//渲染触摸线
      this.isViewChanged =false;
    }
    viewContext.drawImage(this.canvas, 0, 0, this.width, this.height);
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
        x: touch.clientX,
        y: touch.clientY
      }
    }
    return point;
  }

  /**
   * 根据触摸点返回触摸对象
   * touch-line 触摸线
   */
  getTouchObject(){
    var obj = null;
    if (this.startPoint){
      //触摸对象是触摸线
      if (this.startPoint.y >= (this.touchLineY - this.touchLineCanvas.height / 2) && this.startPoint.y <= (this.touchLineY + this.touchLineCanvas.height / 2)
        && (this.startPoint.x >= (this.width-this.touchLineWidth))){
        obj = 'touch-line';
      }
    }
    return obj;
  }
}