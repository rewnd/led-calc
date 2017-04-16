;(function ( $, window, document ) {
    // определяем необходимые параметры по умолчанию
    var pluginName = 'ledCalсModule',
        defaults = {
          "resistance": [1, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2, 2.2, 2.4, 2.7, 3, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1],
          "power": [0.125, 0.25, 0.5, 1, 2],
          "ledsList": [
            {"description":"Выберите модель светодиода из списка (необязательно)", "value":"0", "text":"Модель светодиода"},
            {"text": "3мм жёлтый", "description":"2.1В 20мА", "image": "img/blank.gif", "imagecss": "icon-led-3mm-yellow", "value": "1", "voltage": 2.1, "current": 20},
            {"text": "3мм зелёный", "description":"2.3В 20мА", "image": "img/blank.gif", "imagecss": "icon-led-3mm-green", "value": "2", "voltage": 2.3, "current": 20},
            {"text": "3мм красный", "description":"1.9В 20мА", "image": "img/blank.gif", "imagecss": "icon-led-3mm-red", "value": "3", "voltage": 1.9, "current": 20},
            {"text": "3мм синий", "description":"2.9В 20мА", "image": "img/blank.gif", "imagecss": "icon-led-3mm-blue", "value": "4", "voltage": 2.9, "current": 20},
            {"text": "5мм жёлтый", "description":"2.1В 20мА", "image": "img/blank.gif", "imagecss": "icon-led-5mm-yellow", "value": "5", "voltage": 2.1, "current": 20},
            {"text": "5мм зелёный", "description":"2.3В 20мА", "image": "img/blank.gif", "imagecss": "icon-led-5mm-green", "value": "6", "voltage": 2.3, "current": 20},
            {"text": "5мм красный", "description":"1.9В 20мА", "image": "img/blank.gif", "imagecss": "icon-led-5mm-red", "value": "7", "voltage": 1.9, "current": 20},
            {"text": "5мм сверхъяркий белый/синий", "description":"3.6В 75мА", "image": "img/blank.gif", "imagecss": "icon-led-5mm-bright", "value": "8", "voltage": 3.6, "current": 75}
          ]
        };

    // конструктор плагина
    function Plugin( element, options ) {
        this.element = element;
        this.options = $.extend( {}, defaults, options) ;
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    Plugin.prototype.init = function () {
        var ledSelect, ledVoltageInput, ledCurrentInput, calcCont, calcOptions = this.options;
        calcCont = this.element;
        ledVoltageInput = $("#voltage-input");
        ledCurrentInput = $("#current-input");
        ledSelect = $('#led-select-cont');

        //отображаем значение напряжения с ползунка
        $(this.element).on('change', '#led-calc-voltage-slider', function(e) {
            var voltage = ($(this).val() / 1);
            $(calcCont).find(".led-calc-voltage-val").text(voltage);
        });

        $("#led-select-cont").msDropDown({byJson:{data:calcOptions.ledsList, name:'ledSelect'}}).data("dd");

        //меняем данные в инпутах при выборе диода
        ledSelect.on('change', 'select', function(e) {
          var thisOption = $(this).find('option:selected');
          if(thisOption.val() !== '0'){
            ledVoltageInput.val(thisOption.attr('data-voltage'));
            ledCurrentInput.val(thisOption.attr('data-current'));
          }
        });

        //функция отображения выбранного светодиода в результате
        function ledNameString() {
          var selectedOption = ledSelect.find('option:selected');
          return selectedOption.val() === '0' ? ledVoltageInput.val() + ' В ' + ledCurrentInput.val() + ' мА'  : selectedOption.text() + ' (' + selectedOption.attr('data-description') + ')';
        }

        //тут будет функция для расчета
        $("#led-calc").on('click', function(e) {
          var srcVoltage, ledVoltage, ledCurrent, resistanceCalculated, powerCalculated, resistanceStandard, powerStandart, standardParamsString;
          srcVoltage = + $('#led-calc-voltage-slider').val();
          ledVoltage = + ledVoltageInput.val();
          ledCurrent = (ledCurrentInput.val() / 1000); //переводим в амперы

          if(ledVoltage >= srcVoltage) {
            alert("Некорректные условия! Прямое напряжение светодиода выше или равно напряжению питания схемы.");
            return false;
          }

          resistanceCalculated = resistanceCalc(srcVoltage, ledVoltage, ledCurrent);
          powerCalculated = powerCalc(srcVoltage, ledVoltage, ledCurrent);

          resistanceStandard = nearestVal(resistanceCalculated, calcOptions.resistance);
          powerStandard = nearestVal(powerCalculated, calcOptions.power);

          showLoadingSpinner(1000);

          $(calcCont).find(".led-calc-r-calculated").text(resistanceCalculated);
          $(calcCont).find(".led-calc-p").text(powerCalculated);
          $(calcCont).find(".led-calc-circuit-v-val-cont > span").text(Math.round(srcVoltage));
          $(calcCont).find(".led-calc-circuit-r-val-cont > span").text(resistanceStandard + ' ' + powerStandard);
          $(calcCont).find(".led-calc-led-model").text(ledNameString());
          $(calcCont).find(".led-calc-r-standard").text(resistanceStandard + ' ' + powerStandard);
          return false;
        });

        //функция печати
        $("#led-print").on('click', function(e) {
          $("#print-container").printThis({printContainer: false});
          return false;
        });


        //... и функция, где мы возвращаем максимально похожее на правду значение
        function nearestVal(value, arr) {
          var multiplier, i, valArr = value.split(' ');
          i = arr.length - 1;
          multiplier = 1;
          if((valArr[1] === 'Ом') && valArr[0].length > 1) {
             multiplier = Math.pow(10, valArr[0].length - 1);
             valArr[0] /= multiplier;
          }
          while(+valArr[0] <= arr[i]  && i >= 0) {
            i--;
          }

          //TODO: вычислять более близкие значения сопротивления?

          return (valArr[1] === 'кОм' || valArr[1] === 'Вт') ? arr[i+1] + ' ' + valArr[1]  : i === arr.length - 1 ? arr[0] + ' кОм' :  Math.round(arr[i+1] * multiplier) + ' ' + valArr[1];
        }

        //сопротивление резистора считаем как R = (Uпитания – Uсветодиода) / (Iсветодиода)
        function resistanceCalc(srcVoltage, ledVoltage, ledCurrent) {
          var kOhm, resistance = Math.round((srcVoltage-ledVoltage) / ledCurrent);
          kOhm = resistance/1000;
          return resistance < 1000 ? resistance + ' Ом' : kOhm.toFixed(1) + ' кОм';
        }

        //мощность резистора считаем как P = Uпитания*Iсветодиода – Uсветодиода*Iсветодиода
        function powerCalc(srcVoltage, ledVoltage, ledCurrent) {
          var pwr = (srcVoltage * ledCurrent) - (ledVoltage * ledCurrent);
          return pwr.toFixed(3) + ' Вт';
        }

        // тут будет функция для отображения лоадера
        function showLoadingSpinner(delay) {
          var spinner = $('.loader-overlay');
          spinner.show();
          setTimeout(function(){spinner.hide()}, delay);
        }
    };

    // Простой декоратор конструктора,
    // предотвращающий дублирование плагинов
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName,
                new Plugin( this, options ));
            }
        });
    }

})( jQuery, window, document );