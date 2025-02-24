import { svgPositionGet } from '../infrastructure/svg-utils.js';
import { SvgConnector } from './svg-connector.js';
import { SvgShape } from './svg-shape.js';

/**
 * @param {object} param
 * @param {SVGGElement} param.svgCanvas
 * @param {EventListenerOrEventListenerObject} param.listener
 * @param {WeakMap<SVGGraphicsElement, IPresenterElement>} param.svgElemToPresenterObj
 * @param {PresenterShapeAppendParam} param.createParams
 * @returns {SvgShape}
 */
export function shapeCreate({ svgCanvas, listener, svgElemToPresenterObj, createParams }) {
	const shapeSvgEl = /** @type {SVGGElement} */ (svgCanvas.ownerSVGElement.getElementsByTagName('defs')[0]
		.querySelector(`[data-templ='${createParams.templateKey}']`)
		.cloneNode(true));

	// TODO: to reduce DOM changes (for performance) 'shape.update' must go before 'svg.append'
	svgCanvas.append(shapeSvgEl);
	const shape = new SvgShape({ svgEl: shapeSvgEl });

	if (!createParams.postionIsIntoCanvas) {
		const canvasPosition = svgPositionGet(svgCanvas);
		createParams.position.x -= canvasPosition.x;
		createParams.position.y -= canvasPosition.y;
	}

	shape.update(createParams);

	shape.connectable = shapeSvgEl.getAttribute('data-connectable') === 'true';
	const defaultConnectPoint = parseConnectPointAttr(shapeSvgEl);
	if (defaultConnectPoint) {
		// !circile link!
		shape.defaultInConnector = connectorCreate(shapeSvgEl, shape);
	}

	shapeSvgEl.addEventListener('pointerdown', listener);

	// create connectors
	shapeSvgEl.querySelectorAll('[data-connect]').forEach(
		/** @param {SVGGraphicsElement} el */el => {
			const connector = connectorCreate(el, shape);
			el.addEventListener('pointerdown', listener);
			svgElemToPresenterObj.set(el, connector);
			shape.connectors.set(connector.key, connector);
		});

	svgElemToPresenterObj.set(shapeSvgEl, shape);
	return shape;
}

/**
 * @param {SVGGraphicsElement} svgEl
 * @param {IPresenterShape} shape
 * @returns {IPresenterConnector}
 */
function connectorCreate(svgEl, shape) {
	return new SvgConnector({
		svgEl: svgEl,
		connectorType: svgEl.getAttribute('data-connect') === 'in' ? 'in' : 'out',
		shape: shape,
		key: svgEl.getAttribute('data-key'),
		innerPosition: parseConnectPointAttr(svgEl),
		dir: /** @type {PresenterPathEndDirection} */(svgEl.getAttribute('data-connect-dir'))
	});
}

/**
 * @param {SVGGraphicsElement} svgEl
 * @returns {Point | null}
 */
function parseConnectPointAttr(svgEl) {
	const attr = svgEl.getAttribute('data-connect-point');
	if (!attr) {
		return null;
	}
	const point = svgEl.getAttribute('data-connect-point').split(',');
	return { x: parseFloat(point[0]), y: parseFloat(point[1]) };
}
