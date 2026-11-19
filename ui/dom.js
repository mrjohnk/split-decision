// Small helpers for building the page. Nothing here knows about the game.

const SVG_NS = 'http://www.w3.org/2000/svg';

function append(parent, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
}

function setAttributes(element, attributes) {
  for (const [name, value] of Object.entries(attributes || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (name === 'class') element.setAttribute('class', value);
    else if (name === 'text') element.textContent = value;
    else if (name.startsWith('on') && typeof value === 'function') element.addEventListener(name.slice(2), value);
    else if (value === true) element.setAttribute(name, '');
    else element.setAttribute(name, String(value));
  }
  return element;
}

/** Create an HTML element: h('p', { class: 'note' }, 'text', child, ...). */
export function h(tag, attributes, ...children) {
  return append(setAttributes(document.createElement(tag), attributes), children);
}

/** Create an SVG element. */
export function s(tag, attributes, ...children) {
  return append(setAttributes(document.createElementNS(SVG_NS, tag), attributes), children);
}

export function replaceChildren(parent, ...children) {
  parent.replaceChildren();
  return append(parent, children);
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
