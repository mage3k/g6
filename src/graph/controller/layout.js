const Layout = require('../../layout');
const Util = require('../../util');

class LayoutController {
  constructor(graph) {
    this.graph = graph;
    this.layoutCfg = graph.get('layout');
    this.layoutType = this.layoutCfg ? this.layoutCfg.type : undefined;
    this._initLayout();
  }

  _initLayout() {
    // no data before rendering
  }

  layout() {
    const self = this;
    let layoutType = self.layoutType;
    const graph = self.graph;
    const data = self.data || graph.get('data');
    const nodes = data.nodes;
    if (!nodes) {
      return;
    }
    data.edges = data.edges || [];
    const width = graph.get('width');
    const height = graph.get('height');
    const layoutCfg = {};
    Util.mix(layoutCfg, {
      width,
      height,
      center: [ width / 2, height / 2 ]
    }, self.layoutCfg);

    if (layoutType === undefined) {
      if (nodes[0] && nodes[0].x === undefined) {
        // 创建随机布局
        layoutType = 'random';
      } else { // 若未指定布局且数据中有位置信息，则不进行布局，直接按照原数据坐标绘制。
        return;
      }
    }

    let layoutMethod = self.layoutMethod;
    if (layoutMethod) {
      layoutMethod.destroy();
    }
    if (layoutType === 'force') {
      const onTick = layoutCfg.onTick;
      const tick = () => {
        onTick && onTick();
        graph.refreshPositions();
      };
      layoutCfg.tick = tick;
    }
    self.layoutCfg = layoutCfg;
    layoutMethod = new Layout[layoutType](layoutCfg);
    layoutMethod.init(data);
    layoutMethod.excute();
    self.layoutMethod = layoutMethod;
  }

// 绘制
  refreshLayout() {
    const self = this;
    const graph = self.graph;
    if (graph.get('animate')) {
      graph.positionsAnimate();
    } else {
      graph.refreshPositions();
    }
  }

// 更新布局参数
  updateLayoutCfg(cfg) {
    const self = this;
    self.layoutType = cfg.type;
    const layoutMethod = self.layoutMethod;
    if (self.layoutType !== 'force') {
      if (cfg.onTick) {
        self.tick = () => {
          cfg.onTick();
          self.graph.refreshPositions();
        };
      }
      self.moveToZero();
    }
    layoutMethod.updateCfg(cfg);
    layoutMethod.excute();
    self.refreshLayout();
  }

// 更换布局
  changeLayout(layoutType) {
    const self = this;
    self.layoutType = layoutType;
    self.layoutCfg = self.graph.get('layout') || {};
    self.layoutCfg.type = layoutType;
    const layoutMethod = self.layoutMethod;
    layoutMethod && layoutMethod.destroy();
    self.moveToZero();
    self.layout();
    self.refreshLayout();
  }

  // 更换数据
  changeData(data) {
    const self = this;
    self.data = data;
    self.layout();
  }

// 控制布局动画
  layoutAnimate() {
  }

// 根据 type 创建 Layout 实例
  _getLayout() {
  }

  // 将当前节点的平均中心移动到原点
  moveToZero() {
    const self = this;
    const graph = self.graph;
    const data = graph.get('data');
    const nodes = data.nodes;
    if (nodes[0].x === undefined || nodes[0].x === null || isNaN(nodes[0].x)) {
      return;
    }
    const meanCenter = [ 0, 0 ];
    nodes.forEach(node => {
      meanCenter[0] += node.x;
      meanCenter[1] += node.y;
    });
    meanCenter[0] /= nodes.length;
    meanCenter[1] /= nodes.length;
    nodes.forEach(node => {
      node.x -= meanCenter[0];
      node.y -= meanCenter[1];
    });
  }

  destroy() {
    const self = this;
    self.graph = null;
    const layoutMethod = self.layoutMethod;
    layoutMethod && layoutMethod.destroy();
    self.destroyed = true;
  }
}

module.exports = LayoutController;
