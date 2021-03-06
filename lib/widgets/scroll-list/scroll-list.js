goog.provide('zb.ui.widgets.ScrollList');
goog.require('zb.ui.widgets.BaseList');
goog.require('zb.ui.widgets.ScrollBar');
goog.require('zb.ui.widgets.templates.scrollList.ScrollListOut');
goog.require('zb.ui.widgets.templates.scrollList.scrollList');


/**
 */
zb.ui.widgets.ScrollList = class extends zb.ui.widgets.BaseList {
	/**
	 * @override
	 */
	constructor(opt_params) {
		super(opt_params);

		if (this._exported.bar instanceof zb.ui.widgets.ScrollBar && typeof this._exported.thumb !== 'undefined') {
			this._exported.bar.setThumb(this._exported.thumb);
		}
	}

	/**
	 * @override
	 */
	getFocusableRects() {
		return [this.getContainerRect()];
	}

	/**
	 * @override
	 */
	updateView() {
		super.updateView();

		this._updateThumbSize();
	}

	/**
	 * @param {number} globalEnd
	 */
	setGlobalEnd(globalEnd) {
		this._buffer.setGlobalEnd(globalEnd);
	}

	/**
	 * @override
	 */
	_renderTemplate() {
		return zb.ui.widgets.templates.scrollList.scrollList(this._getTemplateData(), this._getTemplateOptions());
	}

	/**
	 * @override
	 */
	_setVertical(isVertical) {
		super._setVertical(isVertical);

		this._exported.bar.setVertical(isVertical);
	}

	/**
	 * @override
	 */
	_setPosition(sliderPositionPx) {
		super._setPosition(sliderPositionPx);

		this._updateThumbPosition();
	}

	/**
	 * @protected
	 */
	_updateThumbSize() {
		let thumbSizePc = this._wrapperSize * 100 / this._getMaxSliderSize();

		// Для случая, если размер всех элементов в сумме меньше, чем wrapperSize
		thumbSizePc = Math.min(thumbSizePc, 100);

		this._exported.bar.setThumbSize(thumbSizePc);
	}

	/**
	 * @protected
	 */
	_updateThumbPosition() {
		const itemsSkipped = this._buffer.getLocalStart();
		const itemsSkippedSize = this._getSizeOfItems(itemsSkipped);

		const sliderPositionPx = this._position + itemsSkippedSize;
		const maxSliderPositionPx = this._getMaxSliderSize() - this._wrapperSize;

		const thumbPositionPc = sliderPositionPx * 100 / maxSliderPositionPx;
		this._exported.bar.setThumbPosition(thumbPositionPc);
	}
};


/**
 * @type {zb.ui.widgets.templates.scrollList.ScrollListOut}
 * @protected
 */
zb.ui.widgets.ScrollList.prototype._exported;
