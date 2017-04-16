;(function ( $, window, document ) {
    // default params
    var pluginName = 'jNumericInput',
        defaults = {
            defaultVal: 0,
            rangeMin: 0,
            rangeMax: Infinity,
            step: 1
        };

    // plugin constructor
    function Plugin( element, options ) {
        this.element = element;
        this.options = $.extend( {}, defaults, options) ;
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    Plugin.prototype.init = function () {

        //variables
        var rangeMin, rangeMax, step, precision, defaultVal, thisInput = $(this.element);

        //checking attributes of input[type="number"], if don't exist - using plugin options
        thisInput.attr('min') ? rangeMin = +thisInput.attr('min') : rangeMin = +this.options.rangeMin;
        thisInput.attr('max') ? rangeMax = +thisInput.attr('max') : rangeMax = +this.options.rangeMax;
        thisInput.attr('step') ? step = thisInput.attr('step') : step = this.options.step;
        thisInput.attr('val') ? defaultVal = +thisInput.attr('val') : defaultVal = +this.options.defaultVal;

        //value precision
        precision = step.indexOf('.') === -1 ? 0 : step.length - step.indexOf('.') - 1;
        step = +step;

        //default value of input
        thisInput.val(defaultVal);

        //adding class to remove standard increase/decrease buttons in modern browserss
        thisInput.hasClass('jnumeric-input') ? false : thisInput.addClass('jnumeric-input');

        //adding wrapper and buttons for our input
        thisInput.wrap('<div class="jnumeric-input-wrapper"></div>')
        .before('<div class="jnumeric-input-btn jnumeric-input-btn-minus">-</div>')
        .after('<div class="jnumeric-input-btn jnumeric-input-btn-plus">+</div>');

        //processing buttons +/-
        thisInput.parent().on('click touch', ".jnumeric-input-btn", function(e) {
            var btn, inputVal = thisInput.val();
            btn = $(this);
            btn.hasClass('jnumeric-input-btn-plus') && inputVal < rangeMax ?
            thisInput.val(numStep('add')) : btn.hasClass('jnumeric-input-btn-minus') && inputVal > rangeMin ?
            thisInput.val(numStep('sub')) : false;
            return false;
        });

        function numStep(operation) {
            var result;
            if(operation === "add") {
                result = +thisInput.val() + step;
            } else if(operation === "sub") {
                result = +thisInput.val() - step;
            } else {
                return false;
            }
            return result.toFixed(precision);
        }

        //allow only numbers and some other symbols for input
        thisInput.on('keydown', function(e) {
            if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 188, 191]) !== -1 ||
             // ctrl+a,z,x,c,v
            ((e.keyCode === 90 || 88 || 67 || 86 || 65 ) && (e.ctrlKey === true || e.metaKey === true)) ||
             //home, end, up, down, left, right
            (e.keyCode >= 35 && e.keyCode <= 40)) {
                 // allowed
                 return;
            }
            // cancel keypress
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }

        });

        //if entered value > max allowed value, set value to max allowed. If entered value < min allowed value, set it to min.
        thisInput.on('keyup', function(e) {
            if(thisInput.val() > rangeMax) {
                thisInput.val(rangeMax);
                return false;
            }
            if(thisInput.val() < rangeMin) {
                thisInput.val(rangeMin);
                return false;
            }
        });
        //if input value empty - set it to default
        thisInput.on('blur', function(e) {
            if(thisInput.val() === "") {
                thisInput.val(defaultVal);
                return false;
            }
        });
    };

    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName,
                new Plugin( this, options ));
            }
        });
    }

})( jQuery, window, document );