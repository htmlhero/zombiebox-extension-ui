goog.provide('zb.ui.widgets.Throbber');
goog.require('zb.Block');
goog.require('zb.html');
goog.require('zb.widgets.InlineWidget');


/**
 */
zb.ui.widgets.Throbber = class extends zb.widgets.InlineWidget {
	/**
	 * @param {(HTMLElement|zb.ui.widgets.Throbber.Input)=} opt_container
	 * @param {zb.ui.widgets.Throbber.Input=} opt_params
	 */
	constructor(opt_container, opt_params) {
		let container = opt_container;
		let params = opt_params;

		if (typeof opt_container === 'undefined') {
			container = zb.html.div();
		} else if (!(opt_container instanceof HTMLElement)) {
			container = zb.html.div();
			params = /** @type {zb.ui.widgets.Throbber.Input} */ (opt_container);
		}

		container.classList.add('w-zbui-throbber');

		super(/** @type {HTMLElement} */ (container));

		this._block = new zb.Block();
		this._block.on(this._block.EVENT_BLOCK, this._start.bind(this));
		this._block.on(this._block.EVENT_UNBLOCK, this._stop.bind(this));

		this._width = (params && params.width) || this.WIDTH;
		this._step = (params && params.step) || this.STEP;
		this._stepInterval = (params && params.stepInterval) || this.STEP_INTERVAL;

		this._animationFrameCallback = this._animationFrameCallback.bind(this);
		this._animationFrameId = null;

		this._updatePosition(0);
	}

	/**
	 * @override
	 */
	isFocusable() {
		return false;
	}

	/**
	 * @param {IThenable} promise
	 */
	wait(promise) {
		this._block.block(promise);
	}

	/**
	 * @protected
	 */
	_start() {
		this._fireEvent(this.EVENT_START);

		this._updatePosition(0);
		this._requestAnimationFrame();
	}

	/**
	 * @protected
	 */
	_stop() {
		if (this._animationFrameId !== null) {
			cancelAnimationFrame(this._animationFrameId);
			this._animationFrameId = null;
		}

		this._fireEvent(this.EVENT_STOP);
	}

	/**
	 * @protected
	 */
	_requestAnimationFrame() {
		this._animationFrameId = requestAnimationFrame(this._animationFrameCallback);
	}

	/**
	 * @protected
	 */
	_animationFrameCallback() {
		if (Date.now() - this._positionChangeTime >= this._stepInterval) {
			this._updatePosition(this._position + this._step);
		}

		this._requestAnimationFrame();
	}

	/**
	 * @param {number} position
	 * @protected
	 */
	_updatePosition(position) {
		this._setPosition(position);
		this._positionChangeTime = Date.now();
	}

	/**
	 * @param {number} position
	 * @protected
	 */
	_setPosition(position) {
		let fixedPosition = position;

		if (position > this._width - this._step) {
			fixedPosition = 0;
		}

		this._container.style.backgroundPosition = `${-fixedPosition}px 0`;
		this._position = fixedPosition;
	}
};


/**
 * @type {zb.Block}
 * @protected
 */
zb.ui.widgets.Throbber.prototype._block;


/**
 * @type {number}
 * @protected
 */
zb.ui.widgets.Throbber.prototype._step;


/**
 * @type {number}
 * @protected
 */
zb.ui.widgets.Throbber.prototype._stepInterval;


/**
 * @type {number}
 * @protected
 */
zb.ui.widgets.Throbber.prototype._width;


/**
 * @type {number}
 * @protected
 */
zb.ui.widgets.Throbber.prototype._position;


/**
 * @type {number}
 * @protected
 */
zb.ui.widgets.Throbber.prototype._positionChangeTime;


/**
 * @type {?number}
 * @protected
 */
zb.ui.widgets.Throbber.prototype._animationFrameId;


/**
 * Fired with: nothing
 * @const {string}
 */
zb.ui.widgets.Throbber.prototype.EVENT_START = 'start';


/**
 * Fired with: nothing
 * @const {string}
 */
zb.ui.widgets.Throbber.prototype.EVENT_STOP = 'stop';


/**
 * @const {number}
 */
zb.ui.widgets.Throbber.prototype.STEP = 88;


/**
 * @const {number}
 */
zb.ui.widgets.Throbber.prototype.WIDTH = 2112;


/**
 * @const {number}
 */
zb.ui.widgets.Throbber.prototype.STEP_INTERVAL = 100;


/**
 * @typedef {{
 *     step: (number|undefined),
 *     width: (number|undefined),
 *     stepInterval: (number|undefined)
 * }}
 */
zb.ui.widgets.Throbber.Input;
