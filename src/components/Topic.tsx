/** @jsx jsx */
import {
  useContext,
  KeyboardEvent,
  useState,
  DragEvent,
  MouseEvent,
  memo,
} from 'react';
import { ThemeContext } from '../context/theme';
import {
  MAX_TOPIC_WIDTH,
  TOPIC_RADIUS,
  EDITOR_MODE,
  KEY_MAPS,
  TOPIC_CLASS,
} from '../constant';
import { css, jsx } from '@emotion/core';
import { TopicData } from 'xmind-model/types/models/topic';
import * as rootStore from '../store/root';
import editorStore from '../store/editor';
import { HierachyNode } from '@antv/hierarchy';
import { getTopicFontsize } from '../layout/mindmap';
import { topicWalker } from '../utils/tree';
import { selectText } from '../utils/dom';

const Topic = (props: HierachyNode<TopicData>) => {
  const {
    data: { title, id },
    x,
    y,
    depth,
    hgap,
    vgap,
  } = props;
  const $theme = useContext(ThemeContext);
  const editorState = editorStore.useSelector(s => s);
  const { mode, selectedNodeId } = editorState;
  const isSelected = id === selectedNodeId;
  const isEditing = isSelected && mode === EDITOR_MODE.edit;
  const [isDragEntering, setIsDragEntering] = useState(false);
  const hasBorder = depth <= 1;

  function selectNode() {
    editorStore.dispatch('SELECT_NODE', id);
  }

  function exitEditMode(e: KeyboardEvent<HTMLDivElement>) {
    if (
      [KEY_MAPS.Enter, KEY_MAPS.Escape].includes(e.key) &&
      mode === EDITOR_MODE.edit
    ) {
      editorStore.dispatch('SET_MODE', EDITOR_MODE.regular);
      rootStore.dispatch('UPDATE_NODE', {
        id,
        node: {
          title: e.currentTarget.innerText,
        },
      });
      // fix selection exit after exit edit mode on firefox
      getSelection()?.removeAllRanges();
    }
  }

  function handleDragStart(e: DragEvent) {
    // root node is not draggable
    if (id === rootStore.getState().id) {
      e.preventDefault();
      return;
    }
    // setData dataTransfer to make drag and drop work in firefox
    e.dataTransfer.setData('text/plain', '');
    editorStore.dispatch('DRAG_NODE', props.data);
  }
  function handleDragEnter() {
    setIsDragEntering(true);
  }
  function handleDragLeave() {
    setIsDragEntering(false);
  }

  function handleDrop() {
    if (!editorState.dragingNode) return;
    if (editorState.dragingNode.id === id) return;
    // should not drop topic to it's descendants
    const descendants = topicWalker.getDescendants(editorState.dragingNode);
    if (descendants.some(node => node.id === id)) {
      return;
    }
    rootStore.dispatch('DELETE_NODE', editorState.dragingNode?.id);
    rootStore.dispatch('APPEND_CHILD', {
      id,
      node: editorState.dragingNode,
    });
    handleDragLeave();
  }

  // We need to prevent the default behavior
  // of this event, in order for the onDrop
  // event to fire.
  // It may sound weird, but the default is
  // to cancel out the drop.
  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }
  const outline =
    isSelected || isDragEntering ? `2px solid ${$theme.mainColor}` : 'none';
  const background = hasBorder ? '#fff' : 'transparent';

  // preventDefault to prevent enter keyboard event create new html element
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if ([KEY_MAPS.Enter].includes(e.key) && mode === EDITOR_MODE.edit) {
      e.preventDefault();
    }
  }

  function editTopic(e: MouseEvent<HTMLDivElement>) {
    const el = e.target as HTMLDivElement;
    el?.focus();
    selectText(el);
    editorStore.dispatch('SET_MODE', EDITOR_MODE.edit);
  }

  const padding = `${vgap}px ${hgap}px`;

  return (
    <div
      id={`topic-${id}`}
      className={TOPIC_CLASS}
      contentEditable={isEditing}
      onClick={selectNode}
      onDoubleClick={editTopic}
      onKeyUp={exitEditMode}
      onKeyDown={handleKeyDown}
      draggable
      onDragStart={handleDragStart}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      // stopPropagation to prevent invoke Mindmap's event
      onMouseDown={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      css={css`
        display: inline-block;
        border-radius: ${TOPIC_RADIUS}px;
        position: absolute;
        top: 0;
        left: 0;
        transform: translate(${x}px, ${y}px);
        background: ${background};
        max-width: ${MAX_TOPIC_WIDTH}px;
        padding: ${padding};
        font-size: ${getTopicFontsize(props.data)}px;
        cursor: default;
        outline: ${outline};
        user-select: none;
        translate: 0 ${isEditing ? '2px' : 0};
      `}
      suppressContentEditableWarning
    >
      {title}
    </div>
  );
};

export default memo(Topic);
