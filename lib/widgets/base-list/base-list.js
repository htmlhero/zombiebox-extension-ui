goog.provide('zb.ui.widgets.BaseList');
goog.require('zb.device.input.Keys');
goog.require('zb.html');
goog.require('zb.ui.widgets.AbstractBaseListBuffer');
goog.require('zb.ui.widgets.BaseListDataList');
goog.require('zb.ui.widgets.BaseListItem');
goog.require('zb.ui.widgets.IBaseListItem');
goog.require('zb.ui.widgets.templates.baseList.BaseListOut');
goog.require('zb.ui.widgets.templates.baseList.baseList');
goog.require('zb.widgets.CuteWidget');


/**
 */
zb.ui.widgets.BaseList = class extends zb.widgets.CuteWidget {
	/**
	 * @param {zb.ui.widgets.BaseList.Input=} opt_params
	 */
	constructor(opt_params) {
		super();

		this._itemClass = (opt_params && opt_params.itemClass) || zb.ui.widgets.BaseListItem;

		const isVertical = (opt_params && opt_params.isVertical) || false;
		this._setVertical(isVertical);

		const options = (opt_params && opt_params.options) || {};
		this._buffer = new zb.ui.widgets.BaseListDataList(
			options,
			this._setItems.bind(this),
			this._selectItem.bind(this)
		);

		this._items = [];

		this._wrapperSize = 0;
		this._sliderSize = 0;
		this._itemSize = 0;
		this._position = 0;

		this._visibleIndex = 0;
		this._lastData = null;

		const source = (opt_params && opt_params.source) || null;
		this.setSource(source);
	}

	/**
	 * @override
	 */
	beforeDOMShow() {
		this._items.forEach((item) => {
			item.beforeDOMShow();
		});

		super.beforeDOMShow();
	}

	/**
	 * @override
	 */
	afterDOMShow() {
		super.afterDOMShow();

		this._items.forEach((item) => {
			item.afterDOMShow();
		});

		this.updateView();
	}

	/**
	 * @override
	 */
	beforeDOMHide() {
		this._items.forEach((item) => {
			item.beforeDOMHide();
		});

		super.beforeDOMHide();
	}

	/**
	 * @override
	 */
	afterDOMHide() {
		this._items.forEach((item) => {
			item.afterDOMHide();
		});

		super.afterDOMHide();
	}

	/**
	 * @override
	 */
	focus(opt_fromRect) {
		super.focus(opt_fromRect);

		const currentItem = this.getCurrentItem();
		if (currentItem) {
			currentItem.focus();
		}
	}

	/**
	 * @override
	 */
	blur() {
		super.blur();

		const currentItem = this.getCurrentItem();
		if (currentItem) {
			currentItem.blur();
		}
	}

	/**
	 * @override
	 */
	mouseOver(e) {
		super.mouseOver(e);

		const item = this._getItemByNode(/** @type {HTMLElement} */(e.target));

		if (item) {
			this._buffer.setIndexByItem(item.getData());
		}
	}

	/**
	 * @override
	 */
	mouseClick(e) {
		const item = this._getItemByNode(/** @type {HTMLElement} */(e.target));

		if (item) {
			this._fireEvent(this.EVENT_CLICK, item.getData());
		}
	}

	/**
	 * @return {function()} function that restores state
	 */
	takeSnapshot() {
		const state = this.saveState();

		return () => {
			this.loadState(state);
		};
	}

	/**
	 * @return {zb.ui.widgets.BaseList.State}
	 */
	saveState() {
		return {
			index: this._buffer.getGlobalIndex(),
			visibleIndex: this._visibleIndex
		};
	}

	/**
	 * @param {zb.ui.widgets.BaseList.State} state
	 */
	loadState(state) {
		if (!this.hasSource()) {
			return;
		}

		const isSelected = this._buffer.setGlobalIndex(state.index);

		if (isSelected) {
			this._visibleIndex = state.visibleIndex;
			this._adjustPosition();
		}
	}

	/**
	 * @param {zb.ui.widgets.AbstractBaseListBuffer.Source} source
	 */
	setSource(source) {
		this._buffer.setSource(source);
	}

	/**
	 * @return {zb.ui.widgets.AbstractBaseListBuffer.Source}
	 */
	getSource() {
		return this._buffer.getSource();
	}

	/**
	 * @return {boolean}
	 */
	hasSource() {
		return this._buffer.hasSource();
	}

	/**
	 * @return {number}
	 */
	getSize() {
		return this._buffer.getLocalSize();
	}

	/**
	 * @return {number}
	 */
	getCurrentIndex() {
		return this._buffer.getLocalIndex();
	}

	/**
	 * @return {boolean}
	 */
	hasItems() {
		return !!this._items.length;
	}

	/**
	 * @return {?zb.ui.widgets.IBaseListItem}
	 */
	getCurrentItem() {
		return this._items[this.getCurrentIndex()] || null;
	}

	/**
	 */
	updateView() {
		this._calculateSize();
		this._adjustPosition();
	}

	/**
	 * @override
	 */
	_renderTemplate() {
		return zb.ui.widgets.templates.baseList.baseList(this._getTemplateData(), this._getTemplateOptions());
	}

	/**
	 * @override
	 */
	_processKey(zbKey) {
		let isHandled = false;
		const keys = zb.device.input.Keys;

		switch (zbKey) {
			case keys.UP:
				isHandled = this._moveUp();
				break;
			case keys.DOWN:
				isHandled = this._moveDown();
				break;
			case keys.LEFT:
				isHandled = this._moveLeft();
				break;
			case keys.RIGHT:
				isHandled = this._moveRight();
				break;
			case keys.ENTER:
				const data = this._buffer.getSourceItem();
				if (data) {
					this._fireEvent(this.EVENT_CLICK, data);
					isHandled = true;
				}
				break;
		}

		return isHandled;
	}

	/**
	 * @return {boolean}
	 * @protected
	 */
	_moveUp() {
		return this._isVertical ? this._buffer.selectPrevLine() : this._buffer.selectPrevIndex();
	}

	/**
	 * @return {boolean}
	 * @protected
	 */
	_moveDown() {
		return this._isVertical ? this._buffer.selectNextLine() : this._buffer.selectNextIndex();
	}

	/**
	 * @return {boolean}
	 * @protected
	 */
	_moveLeft() {
		return this._isVertical ? this._buffer.selectPrevIndex() : this._buffer.selectPrevLine();
	}

	/**
	 * @return {boolean}
	 * @protected
	 */
	_moveRight() {
		return this._isVertical ? this._buffer.selectNextIndex() : this._buffer.selectNextLine();
	}

	/**
	 * @param {boolean} isVertical
	 * @protected
	 */
	_setVertical(isVertical) {
		this._isVertical = isVertical;
		zb.html.updateClassName(this._container, '_is-vertical', isVertical);
	}

	/**
	 * @param {Array<*>} newDataItems
	 * @protected
	 */
	_setItems(newDataItems) {
		this._updateItemsIfNeeded(newDataItems);

		// Если пришел пустой массив, очищаем.
		if (!newDataItems.length) {
			this._clear();
		}

		if (this.isDOMVisible()) {
			this.updateView();
		}
	}

	/**
	 * @param {Array<*>} newDataItems
	 * @protected
	 */
	_updateItemsIfNeeded(newDataItems) {
		const getDiff = (arr1, arr2) => arr1.filter((item) => arr2.indexOf(item) === -1);

		const oldDataItems = this._getItemsData();

		const addedDataItems = getDiff(newDataItems, oldDataItems);
		const removedDataItems = getDiff(oldDataItems, newDataItems);

		if (!addedDataItems.length && !removedDataItems.length) {
			return;
		}

		removedDataItems.forEach((item, index) => {
			this._removeItem(oldDataItems.indexOf(item) - index);
		});

		addedDataItems.forEach((item) => {
			this._addItem(item, newDataItems.indexOf(item));
		});
	}

	/**
	 * @protected
	 */
	_clear() {
		this._visibleIndex = 0;
		this._lastData = null;
	}

	/**
	 * @param {*} data
	 * @param {number} index
	 * @return {zb.ui.widgets.IBaseListItem}
	 * @protected
	 */
	_addItem(data, index) {
		const nextItem = this._items[index];
		const nextItemContainer = nextItem ? nextItem.getContainer() : null;

		const item = new this._itemClass({data});
		const itemContainer = item.getContainer();
		const isVisible = this.isDOMVisible();

		if (isVisible) {
			item.beforeDOMShow();
		}

		this._items.splice(index, 0, item);
		this._exported.slider.insertBefore(itemContainer, nextItemContainer);

		if (isVisible) {
			item.afterDOMShow();
		}

		return item;
	}

	/**
	 * @param {number} index
	 * @return {zb.ui.widgets.IBaseListItem}
	 * @protected
	 */
	_removeItem(index) {
		const item = this._items[index];
		const itemContainer = item.getContainer();
		const isVisible = this.isDOMVisible();

		if (isVisible) {
			item.beforeDOMHide();
		}

		this._exported.slider.removeChild(itemContainer);
		this._items.splice(index, 1);

		if (isVisible) {
			item.afterDOMHide();
		}

		return item;
	}

	/**
	 * @protected
	 */
	_adjustPosition() {
		const lastDataIndex = this._getLastDataIndex();
		const itemsSkipped = lastDataIndex - this._visibleIndex;
		const itemsSkippedSize = this._getSizeOfItems(itemsSkipped);

		this._setPosition(itemsSkippedSize);
	}

	/**
	 * @param {number} position
	 * @protected
	 */
	_setPosition(position) {
		// Проверяем, чтобы не было пустого места.
		// Нужно для zb.ui.data.CyclicalList при прыжке из начала в конец списка.
		const maxPosition = this._sliderSize - this._wrapperSize;
		let fixedPosition = Math.min(maxPosition, position);

		// Позиция не может быть меньше нуля.
		fixedPosition = Math.max(0, fixedPosition);

		const sliderStyle = this._exported.slider.style;
		if (this._isVertical) {
			sliderStyle.top = `${-fixedPosition}px`;
		} else {
			sliderStyle.left = `${-fixedPosition}px`;
		}

		this._position = fixedPosition;
	}

	/**
	 * @param {*} newData
	 * @param {number} newLocalIndex
	 * @param {*} oldData
	 * @param {number} oldLocalIndex
	 * @protected
	 */
	_selectItem(newData, newLocalIndex, oldData, oldLocalIndex) {
		if (isNaN(newLocalIndex)) {
			return;
		}

		if (this.isFocused() && !isNaN(oldLocalIndex)) {
			this._items[oldLocalIndex].blur();
		}

		this._fireBeforeMove(newData, newLocalIndex, oldData, oldLocalIndex);

		const position = this._getPositionByIndex(newLocalIndex);
		this._setPosition(position);

		this._lastData = newData;
		this._calculateVisibleIndex(newLocalIndex);

		if (this.isFocused() && !isNaN(newLocalIndex)) {
			this._items[newLocalIndex].focus();
		}

		this._fireAfterMove(newData, newLocalIndex, oldData, oldLocalIndex);
	}

	/**
	 * @param {*} newData
	 * @param {number} newLocalIndex
	 * @param {*} oldData
	 * @param {number} oldLocalIndex
	 * @protected
	 */
	_fireBeforeMove(newData, newLocalIndex, oldData, oldLocalIndex) {
		this._fireEvent(this.EVENT_BEFORE_MOVE, newData, newLocalIndex, oldData, oldLocalIndex);
	}

	/**
	 * @param {*} newData
	 * @param {number} newLocalIndex
	 * @param {*} oldData
	 * @param {number} oldLocalIndex
	 * @protected
	 */
	_fireAfterMove(newData, newLocalIndex, oldData, oldLocalIndex) {
		this._fireEvent(this.EVENT_AFTER_MOVE, newData, newLocalIndex, oldData, oldLocalIndex);
	}

	/**
	 * @protected
	 */
	_calculateSize() {
		const exp = this._exported;

		this._wrapperSize = this._isVertical ? exp.wrapper.offsetHeight : exp.wrapper.offsetWidth;
		this._sliderSize = this._isVertical ? exp.slider.offsetHeight : exp.slider.offsetWidth;
		this._itemSize = 0;

		if (this._items.length) {
			const firstItemContainer = this._items[0].getContainer();
			this._itemSize = this._isVertical ? firstItemContainer.offsetHeight : firstItemContainer.offsetWidth;
		}
	}

	/**
	 * @param {number} index
	 * @protected
	 */
	_calculateVisibleIndex(index) {
		// Защита от еще не определенного this._itemSize.
		if (!this._itemSize) {
			return;
		}

		const linesSkipped = this._position / this._itemSize;
		const itemsSkipped = this._buffer.getItemsByLines(linesSkipped);

		this._visibleIndex = index - itemsSkipped;
	}

	/**
	 * @param {number} index
	 * @return {number}
	 * @protected
	 */
	_getPositionByIndex(index) {
		const beforeItem = this._getPositionBeforeItem(index);
		const afterItem = this._getPositionAfterItem(index);
		let beforeView = this._position;
		const afterView = beforeView + this._wrapperSize;

		if (beforeItem < beforeView) {
			beforeView = beforeItem;
		} else if (afterItem > afterView) {
			beforeView = afterItem - this._wrapperSize;
		}

		return beforeView;
	}

	/**
	 * @param {number} index
	 * @return {number}
	 * @protected
	 */
	_getPositionBeforeItem(index) {
		const line = this._buffer.getLineByIndex(index);
		return line * this._itemSize;
	}

	/**
	 * @param {number} index
	 * @return {number}
	 * @protected
	 */
	_getPositionAfterItem(index) {
		const before = this._getPositionBeforeItem(index);
		return before + this._itemSize;
	}

	/**
	 * @param {number} items
	 * @return {number}
	 * @protected
	 */
	_getSizeOfItems(items) {
		const lines = this._buffer.getLinesByItems(items);
		return lines * this._itemSize;
	}

	/**
	 * @return {number}
	 * @protected
	 */
	_getMaxSliderSize() {
		return this._getSizeOfItems(this._buffer.getGlobalSize());
	}

	/**
	 * @return {Array<*>}
	 * @protected
	 */
	_getItemsData() {
		return this._items.map((item) => item.getData());
	}

	/**
	 * @return {Array<HTMLElement>}
	 * @protected
	 */
	_getItemsContainers() {
		return this._items.map((item) => item.getContainer());
	}

	/**
	 * @return {number}
	 * @protected
	 */
	_getLastDataIndex() {
		const itemsData = this._getItemsData();

		let lastDataIndex = itemsData.indexOf(this._lastData);
		lastDataIndex = lastDataIndex === -1 ? 0 : lastDataIndex;

		return lastDataIndex;
	}

	/**
	 * @param {HTMLElement} node
	 * @return {zb.ui.widgets.IBaseListItem}
	 * @protected
	 */
	_getItemByNode(node) {
		return this._items.filter((item) => item.getContainer().contains(node))[0];
	}
};


/**
 * @type {zb.ui.widgets.templates.baseList.BaseListOut}
 * @protected
 */
zb.ui.widgets.BaseList.prototype._exported;


/**
 * @type {Function}
 * @protected
 */
zb.ui.widgets.BaseList.prototype._itemClass;


/**
 * @type {zb.ui.widgets.AbstractBaseListBuffer}
 * @protected
 */
zb.ui.widgets.BaseList.prototype._buffer;


/**
 * @type {Array<zb.ui.widgets.IBaseListItem>}
 * @protected
 */
zb.ui.widgets.BaseList.prototype._items;


/**
 * @type {number}
 * @protected
 */
zb.ui.widgets.BaseList.prototype._wrapperSize;


/**
 * @type {number}
 * @protected
 */
zb.ui.widgets.BaseList.prototype._sliderSize;


/**
 * @type {number}
 * @protected
 */
zb.ui.widgets.BaseList.prototype._itemSize;


/**
 * @type {number}
 * @protected
 */
zb.ui.widgets.BaseList.prototype._position;


/**
 * @type {number}
 * @protected
 */
zb.ui.widgets.BaseList.prototype._visibleIndex;


/**
 * @type {?*}
 * @protected
 */
zb.ui.widgets.BaseList.prototype._lastData;


/**
 * @type {boolean}
 * @protected
 */
zb.ui.widgets.BaseList.prototype._isVertical;


/**
 * Fired when item clicked.
 * Fired with: data {*}
 * @const {string}
 */
zb.ui.widgets.BaseList.prototype.EVENT_CLICK = 'click';


/**
 * Fired before slider position changed.
 * Fired with: newData {*}, newIndex {number}, oldData {*}, oldIndex {number}
 * @const {string}
 */
zb.ui.widgets.BaseList.prototype.EVENT_BEFORE_MOVE = 'before-move';


/**
 * Fired after slider position changed.
 * Fired with: newData {*}, newIndex {number}, oldData {*}, oldIndex {number}
 * @const {string}
 */
zb.ui.widgets.BaseList.prototype.EVENT_AFTER_MOVE = 'after-move';


/**
 * @typedef {{
 *     itemClass: (Function|undefined),
 *     source: (zb.ui.widgets.AbstractBaseListBuffer.Source|undefined),
 *     options: (zb.ui.widgets.AbstractBaseListBuffer.Options|undefined),
 *     isVertical: (boolean|undefined)
 * }}
 */
zb.ui.widgets.BaseList.Input;


/**
 * @typedef {{
 *     index: number,
 *     visibleIndex: number
 * }}
 */
zb.ui.widgets.BaseList.State;
