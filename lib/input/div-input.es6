/*
 * This file is part of the ZombieBox package.
 *
 * Copyright (c) 2011-2015, Interfaced
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
goog.provide('zb.ui.DivInput');
goog.require('zb.html');
goog.require('zb.ui.AbstractInput');
goog.require('zb.ui.IInputWidget');
goog.require('zb.ui.templates.divInput');



/**
 * @implements {zb.ui.IInputWidget}
 */
zb.ui.DivInput = class extends zb.ui.AbstractInput {
	/**
	 * @param {HTMLDivElement} container
	 * @param {zb.ui.DivInput.DivInputParams=} opt_params
	 */
	constructor(container, opt_params) {
		super(container, opt_params);

		container.classList.add('w-zbui-div-input');
		container.appendChild(this._exported.root);

		if (opt_params && typeof opt_params.caretWidth === 'number') {
			this._caretWidth = opt_params.caretWidth;
		} else {
			this._caretWidth = 1;
		}

		if (opt_params && opt_params.caretAnimationType) {
			this._caretAnimationType = opt_params.caretAnimationType;
		} else {
			this._caretAnimationType = zb.ui.DivInput.CaretAnimationType.REQUEST_ANIMATION_FRAME;
		}

		this._value = '';
		this._selectionStart = 0;
		this._inputTextPosition = 0;
		this._passwordSymbol = (opt_params && opt_params.passwordSymbol) || '*';
		this._isCaretPermanent = false;
		this._isAnimating = false;

		this._exported.textBeforeCaret.style.borderRightWidth = `${this._caretWidth}px`;

		this._showHidePlaceholder();
		this.setCaretVisible(false);
	}


	/**
	 * @override
	 */
	afterDOMShow() {
		super.afterDOMShow();
		this.updateInputWidth();
		this._renderInputCaret(this.getCaretPosition());
		this.setCaretDOMVisible(true);
	}


	/**
	 * @override
	 */
	afterDOMHide() {
		super.afterDOMHide();
		this.stopCaretAnimation();
	}


	/**
	 * @override
	 */
	focus(opt_fromRect) {
		super.focus(opt_fromRect);
		this.showCaret();
	}


	/**
	 * @override
	 */
	blur() {
		super.blur();
		this.hideCaret();
	}


	/**
	 * @override
	 */
	getCaretPosition() {
		return this._selectionStart;
	}


	/**
	 * @override
	 */
	setCaretPosition(position) {
		if (position < 0 || position > this._value.length) {
			return false;
		}

		this._selectionStart = position;
		this._renderInputCaret(position);

		return true;
	}


	/**
	 * @override
	 */
	getValue() {
		return this._value;
	}


	/**
	 * @override
	 */
	setPlaceholder(placeholder) {
		zb.html.text(this._exported.placeholder, placeholder);
	}


	/**
	 */
	updateInputWidth() {
		this._inputWidth = this._container.offsetWidth;
	}


	/**
	 * @param {zb.ui.DivInput.CaretAnimationType} animationType
	 */
	setCaretAnimationType(animationType) {
		if (this.isAnimating()) {
			this.stopCaretAnimation();
		}
		this._caretAnimationType = animationType;
		this.startCaretAnimation();
	}


	/**
	 * @param {boolean=} opt_permanent
	 */
	showCaret(opt_permanent) {
		if (opt_permanent) {
			this._isCaretPermanent = true;
		}
		this.setCaretVisible(true);

		if (this.isDOMVisible() && !this.isAnimating()) {
			this.setCaretDOMVisible(true);
			this.startCaretAnimation();
		}
	}


	/**
	 * @param {boolean=} opt_force Hide permanent caret too.
	 * @return {boolean}
	 */
	hideCaret(opt_force) {
		const force = opt_force === true;

		if (!this._isCaretPermanent || force) {
			this.setCaretVisible(false);
			this._isCaretPermanent = false;

			this.stopCaretAnimation();
			this.setCaretDOMVisible(false);

			return true;
		}

		return false;
	}


	/**
	 * @param {boolean} isVisible
	 */
	setCaretVisible(isVisible) {
		this._isCaretVisible = isVisible;
		zb.html.updateClassName(this._container, '_caret-visible', isVisible);
	}


	/**
	 */
	startCaretAnimation() {
		if (this._caretAnimationType === zb.ui.DivInput.CaretAnimationType.CSS) {
			this._setCaretAnimationWithCSS(true);
		} else {
			this._startAnimateCaretWithRAF();
		}
		this.setCaretDOMVisible(true);
	}


	/**
	 */
	stopCaretAnimation() {
		if (this._caretAnimationType === zb.ui.DivInput.CaretAnimationType.CSS) {
			this._setCaretAnimationWithCSS(false);
		} else {
			this._stopAnimateCaretWithRAF();
		}
	}


	/**
	 * @param {boolean} isVisible
	 */
	setCaretDOMVisible(isVisible) {
		this._isCaretDOMVisible = isVisible;
		this._exported.textBeforeCaret.style.borderRightColor = isVisible ? '' : 'transparent';
	}


	/**
	 * @return {boolean}
	 */
	isAnimating() {
		return this._isAnimating;
	}


	/**
	 * @override
	 */
	_processKey(zbKey, opt_e) {
		let isHandled = false;
		const zbCharKey = app.device.input.keyToPrintableChar(zbKey);

		if (zbCharKey !== null) {
			this.putStr(zbCharKey);
			isHandled = true;
		}

		return isHandled || super._processKey(zbKey, opt_e);
	}


	/**
	 * @override
	 */
	_updateCurrentValue(value) {
		this._value = value;

		this._showHidePlaceholder();
		zb.html.text(this._exported.inputText, this._valueToRenderValue());
		this._renderInputCaret(this.getCaretPosition());
	}


	/**
	 * @override
	 */
	_setType(type) {
		let inputClass = '';

		switch (type) {
			case zb.ui.AbstractInput.Type.TEXT:
				inputClass = 'text';
				break;
			case zb.ui.AbstractInput.Type.PASSWORD:
				inputClass = 'password';
				break;
			default:
				inputClass = 'text';
				break;
		}

		this._container.classList.add('_type-' + inputClass);

		super._setType(type);
	}


	/**
	 * @override
	 */
	_renderTemplate() {
		return zb.ui.templates.divInput({});
	}


	/**
	 * @param {boolean} isAnimating
	 * @protected
	 */
	_setCaretAnimationWithCSS(isAnimating) {
		const elementWithCaret = this._exported.textBeforeCaret;

		for (const browserName in zb.ui.DivInput.AnimationPropertyNames) {
			if (zb.ui.DivInput.AnimationPropertyNames.hasOwnProperty(browserName)) {
				const propertyName = zb.ui.DivInput.AnimationPropertyNames[browserName];
				elementWithCaret.style[propertyName] = isAnimating ? 'inputCaret 1s linear 0s infinite' : '';
			}
		}

		this._isAnimating = isAnimating;
	}


	/**
	 * @protected
	 */
	_startAnimateCaretWithRAF() {
		this._animationStartTime = null;
		this._requestId = window.requestAnimationFrame(this._animationRAFStep.bind(this));
		this._isAnimating = true;
	}


	/**
	 * @param {number} timestamp
	 * @protected
	 */
	_animationRAFStep(timestamp) {
		this._animationStartTime = this._animationStartTime || timestamp;

		if (timestamp - this._animationStartTime >= 500) {
			this.setCaretDOMVisible(!this._isCaretDOMVisible);
			this._animationStartTime = null;
		}

		this._requestId = window.requestAnimationFrame(this._animationRAFStep.bind(this));
	}


	/**
	 * @protected
	 */
	_stopAnimateCaretWithRAF() {
		window.cancelAnimationFrame(this._requestId);
		this._isAnimating = false;
		this._animationStartTime = null;
		this.setCaretDOMVisible(false);
	}


	/**
	 * @return {string}
	 * @protected
	 */
	_valueToRenderValue() {
		if (this._type === zb.ui.AbstractInput.Type.PASSWORD) {
			const passwordLength = this._value.length ? this._value.length + 1 : 0;
			return new Array(passwordLength).join(this._passwordSymbol);
		} else {
			return this._value;
		}
	}


	/**
	 * Toggle value of placeholder. Depending on value of real input.
	 * @protected
	 */
	_showHidePlaceholder() {
		zb.html.showHide(this._exported.placeholder, !this._value);
	}


	/**
	 * @param {number} caretPosition
	 * @protected
	 */
	_renderInputCaret(caretPosition) {
		const valueForRender = this._valueToRenderValue();
		let beforeCaretValue = '';

		if (caretPosition >= valueForRender.length) {
			beforeCaretValue = valueForRender;
		} else if (caretPosition > 0) {
			beforeCaretValue = valueForRender.substr(0, caretPosition);
		}

		zb.html.text(this._exported.textBeforeCaret, beforeCaretValue);

		this._placeCaretToInput(beforeCaretValue);
	}


	/**
	 * Тут происходит расчет позиции текста, относительно родительского инпута. Если внутренний текст больше инпута,
	 * то вычисляется смещение этого текста относительно родительского блока. Далее по тексту:
	 * RI - Real Input, т.е. тот блок, который содержит в себе всю строку целиком и отображается;
	 * FI - Fake Input, блок, который содержит в себе только текст до каретки и спрятан в DOM;
	 * Слайдером буду называть весь движущийся механизм, состоящий из RI и FI, без родительского элемента;
	 * @param {string} beforeCaretValue
	 * @protected
	 */
	_placeCaretToInput(beforeCaretValue) {
		const textWidth = this._exported.inputText.offsetWidth;
		const inputTextPosition = Math.abs(this._inputTextPosition);
		let newFakeTextPosition = 0;

		if (this._inputWidth < textWidth) {
			const widthDiff = textWidth - this._inputWidth;
			const fakeTextWidth = this._exported.textBeforeCaret.offsetWidth;

			if (fakeTextWidth === textWidth + this._caretWidth) {
				/**
				 * Эта ситуация описывает поведение в случае нахождения каретки в крайнем правом положении относительно RI
				 * Если ширина FI равна ширине RI с шириной каретки, то смещаем слайдер
				 * относительно родителя влево. FI сдвигаем меньше на ширину каретки, чтобы не сливалась с бордером.
				 */
				newFakeTextPosition = -widthDiff - this._caretWidth;
			} else if (beforeCaretValue.length === 0) {
				/**
				 * Это ситуация с крайним левым положением каретки относительно RI,
				 * сбрасываем позицию слайдера к исходному положению
				 */
				newFakeTextPosition = 0;
			} else if (fakeTextWidth - inputTextPosition < 0) {
				/**
				 * Описывает ситуацию, когда каретка находится в крайнем левом положении относительно родителя,
				 * т.е. размер FI становится меньше, чем смещение этого самого FI по отношению к родителю,
				 * смещаем слайдер вправо относительно родителя, FI смещаем на 1px больше,
				 * чтобы не сливался с бордером
				 */
				newFakeTextPosition = -fakeTextWidth + this._caretWidth;
			} else if (fakeTextWidth - inputTextPosition >= this._inputWidth) {
				/**
				 * Описывает ситуацию, когда каретка находится в крайнем правом положении относительно родителя,
				 * т.е. размер FI без учета смещения относительно родителя, становится больше, чем размер самого родителя.
				 * Находим разницу между размерами родителя и FI и смещаем слайдер влево относительно родителя,
				 * FI смещаем на 1px меньше, чтобы он не сливался с бордером.
				 */
				newFakeTextPosition = this._inputWidth - fakeTextWidth;
			} else {
				return;
			}
		} else if (inputTextPosition !== 0) {
			/**
			 * Если значение было сброшено каким-то путем - возвращаем слайдер к исходному положению
			 */
			newFakeTextPosition = 0;
		} else {
			return;
		}

		this._inputTextPosition = newFakeTextPosition;
		this._exported.slider.style.marginLeft = newFakeTextPosition === 0 ? '' : `${newFakeTextPosition}px`;
	}
};


/**
 * @type {zb.ui.templates.DivInputOut}
 * @protected
 */
zb.ui.DivInput.prototype._exported;


/**
 * @type {zb.ui.DivInput.CaretAnimationType}
 * @protected
 */
zb.ui.DivInput.prototype._caretAnimationType;


/**
 * @type {?number} timestamp
 * @protected
 */
zb.ui.DivInput.prototype._animationStartTime;


/**
 * @type {number}
 * @protected
 */
zb.ui.DivInput.prototype._requestId;


/**
 * @type {boolean}
 * @protected
 */
zb.ui.DivInput.prototype._isAnimating;


/**
 * @type {boolean}
 * @protected
 */
zb.ui.DivInput.prototype._isCaretVisible;


/**
 * @type {boolean}
 * @protected
 */
zb.ui.DivInput.prototype._isCaretDOMVisible;


/**
 * @type {boolean}
 * @protected
 */
zb.ui.DivInput.prototype._isCaretPermanent;


/**
 * @type {number}
 * @protected
 */
zb.ui.DivInput.prototype._inputWidth;


/**
 * Width of slider caret, right border of fake input
 * @type {number}
 * @protected
 */
zb.ui.DivInput.prototype._caretWidth;


/**
 * Current caret's offset position relative to the parent. This value always <= 0
 * @type {number}
 * @protected
 */
zb.ui.DivInput.prototype._inputTextPosition;


/**
 * @type {string}
 * @protected
 */
zb.ui.DivInput.prototype._value;


/**
 * @type {number}
 * @protected
 */
zb.ui.DivInput.prototype._selectionStart;


/**
 * Poor css animation cause performance problems in Presto-like browsers. And by default used RAF instead.
 * If there is no need to support these platforms you can switch to CSS animation painlessly.
 * @enum {string}
 */
zb.ui.DivInput.CaretAnimationType = {
	CSS: 'css-animation',
	REQUEST_ANIMATION_FRAME: 'request-animation-frame'
};


/**
 * @enum {string}
 */
zb.ui.DivInput.AnimationPropertyNames = {
	PRESTO: 'OAnimation',
	WEBKIT: 'WebkitAnimation',
	COMMON: 'animation'
};


/**
 * @typedef {{
 *     type: (zb.ui.AbstractInput.Type|undefined),
 *     placeholder: (string|undefined),
 *     passwordSymbol: (string|undefined),
 *     caretWidth: (number|undefined),
 *     caretAnimationType: (zb.ui.DivInput.CaretAnimationType|undefined)
 * }}
 */
zb.ui.DivInput.DivInputParams;