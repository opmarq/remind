import { TreeNode } from '../types/xmind';
import hierarchy, { Options } from '@antv/hierarchy';
import {
  MIN_TOPIC_HEIGHT,
  canvasContext,
  MAX_TOPIC_WIDTH,
  TOPIC_PADDING,
  TOPIC_FONT_SIZE,
} from '../constant';
import uuidv4 from 'uuid/v4';

function measureText(text: string, fontSize: number = TOPIC_FONT_SIZE) {
  canvasContext.save();
  canvasContext.font = `${fontSize}px System`;
  const measure = canvasContext.measureText(text);
  canvasContext.restore();
  return measure;
}

const defaultOptions: Options<TreeNode> = {
  getId() {
    return uuidv4();
  },
  getHeight(node) {
    const width = measureText(node.title).width;
    const lines = Math.ceil(width / MAX_TOPIC_WIDTH);
    const contentHeight = Math.max(
      MIN_TOPIC_HEIGHT,
      TOPIC_FONT_SIZE * 1.4 * lines
    );
    node.contentHeight = contentHeight;
    return contentHeight;
  },
  getWidth(node) {
    const measure = measureText(node.title);
    const contentWidth = Math.min(measure.width, MAX_TOPIC_WIDTH);
    node.contentWidth = contentWidth;
    return contentWidth;
  },
  getSubTreeSep(d) {
    if (!d.children || !d.children.length) {
      return 0;
    }
    return TOPIC_PADDING;
  },
  getHGap() {
    return TOPIC_PADDING;
  },
  getVGap() {
    return TOPIC_PADDING * 2;
  },
};

export default function(
  root: TreeNode,
  options: Options<TreeNode> = defaultOptions
) {
  const rootNode = hierarchy.mindmap(root, options);
  rootNode.eachNode(node => {
    if (!node.parent) return;
    node.x += 70 * node.depth;
  });
  return rootNode;
}