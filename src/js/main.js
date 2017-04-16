$(function() {
  $(".led-calc-wrapper").ledCalсModule();
  $(".led-calc-input-numeric").jNumericInput();
  $('.led-calc-slider').jRange({
    from: 5,
    to: 36,
    step: 0.5,
    scale: [5,12,24,36],
    format: '',
    width: 430,
    showLabels: true,
    theme: "theme-led-calc"
});
});